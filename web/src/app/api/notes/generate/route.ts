import { NextRequest, NextResponse } from 'next/server';
import { NoteService } from '@/lib/note-service';
import { getUserFromAuth } from '@/lib/auth-helper';
import { ApiSuccessResponse, ApiErrorResponse, GenerateNoteRequest } from '@/lib/types';
import { queueBackgroundTranslation } from '@/lib/translation-service';
import { noteProgressManager } from '@/lib/note-progress-manager';
import { prisma } from '@/lib/prisma';

const noteService = new NoteService();

export async function POST(request: NextRequest) {
  let progressJobId = '';
  const publishProgress = async (
    progress: number,
    stage: "uploading" | "processing" | "generating" | "completed" | "error",
    message: string
  ) => {
    if (!progressJobId) return;
    await noteProgressManager.publish({
      jobId: progressJobId,
      progress,
      stage,
      message,
    });
  };

  try {
    const userId = await getUserFromAuth(request);
    const body: GenerateNoteRequest = await request.json();
    const folderId = body.folderId;
    let transcriptId =
      typeof body.transcriptId === "string" ? body.transcriptId.trim() : "";
    progressJobId =
      typeof body.progressJobId === "string" ? body.progressJobId.trim() : "";

    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Unauthorized'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Recovery path: resolve transcript via persisted progressJobId metadata
    if (!transcriptId && progressJobId) {
      try {
        const transcriptByPath = await prisma.transcript.findFirst({
          where: {
            userId,
            metadata: {
              path: ["progressJobId"],
              equals: progressJobId,
            },
          },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        });
        transcriptId = transcriptByPath?.id ?? "";
      } catch (lookupError) {
        // Fallback for DB engines/providers where JSON path filter support differs.
        console.warn(
          "[notes/generate] JSON path lookup failed, using fallback scan:",
          lookupError
        );
        const candidates = await prisma.transcript.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: { id: true, metadata: true },
        });
        const matched = candidates.find((candidate) => {
          if (
            !candidate.metadata ||
            typeof candidate.metadata !== "object" ||
            Array.isArray(candidate.metadata)
          ) {
            return false;
          }
          return (
            (candidate.metadata as Record<string, unknown>).progressJobId ===
            progressJobId
          );
        });
        transcriptId = matched?.id ?? "";
      }
    }

    if (!transcriptId && progressJobId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "Transcript not found for progress job",
        message:
          "Transcript is not ready yet. Please retry in a few seconds.",
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    if (!transcriptId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "Transcript ID is required",
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    await publishProgress(65, "generating", "Generating AI notes...");

    if (progressJobId) {
      try {
        const transcript = await prisma.transcript.findUnique({
          where: { id: transcriptId },
          select: { metadata: true },
        });
        const metadata =
          transcript?.metadata &&
          typeof transcript.metadata === "object" &&
          !Array.isArray(transcript.metadata)
            ? (transcript.metadata as Record<string, unknown>)
            : {};
        await prisma.transcript.update({
          where: { id: transcriptId },
          data: {
            metadata: { ...metadata, progressJobId },
          },
        });
      } catch (metadataError) {
        console.error(
          "Failed to persist progressJobId on transcript metadata:",
          metadataError
        );
      }
    }

    // IDEMPOTENCY CHECK: Check if note already exists for this transcript
    const existingNote = await prisma.note.findFirst({
      where: {
        transcriptId: transcriptId,
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // If note already exists, return it instead of creating duplicate
    if (existingNote) {
      console.log(`Idempotency: Returning existing note ${existingNote.id} for transcript ${transcriptId}`);
      await publishProgress(100, "completed", "Notes already available");
      const response: ApiSuccessResponse = {
        success: true,
        data: existingNote,
      };
      return NextResponse.json(response);
    }

    // Check note creation access (allows free tier: 1 note)
    const { FeatureGateService } = await import('@/lib/feature-gate-service');
    const accessCheck = await FeatureGateService.checkNoteCreationAccess();

    if (!accessCheck.allowed) {
      await publishProgress(0, "error", accessCheck.message || "Unable to create note");
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: accessCheck.message || 'Unable to create note',
        message: accessCheck.message,
        // @ts-expect-error - adding extra fields for client
        notesUsed: accessCheck.notesUsed,
        notesLimit: accessCheck.notesLimit,
        upgradeUrl: accessCheck.upgradeUrl || '/pricing',
      };
      return NextResponse.json(errorResponse, { status: accessCheck.statusCode });
    }

    const reservation = await FeatureGateService.reserveNoteUsage(userId);
    if (!reservation.allowed) {
      await publishProgress(0, "error", reservation.message || "Unable to create note");
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: reservation.error || 'Unable to create note',
        message: reservation.message,
        // @ts-expect-error - adding extra fields for client
        notesUsed: reservation.notesUsed,
        notesLimit: reservation.notesLimit,
        upgradeUrl: reservation.upgradeUrl || '/pricing',
      };
      return NextResponse.json(errorResponse, { status: reservation.statusCode });
    }

    // Generate AI note from the transcript
    let note;
    try {
      note = await noteService.generateAINote(transcriptId, userId || undefined, folderId);
    } catch (noteError) {
      // Decrement counter since note creation failed
      await FeatureGateService.decrementNoteUsage(userId);
      throw noteError; // Re-throw to be caught by outer catch block
    }

    // Queue background translation to all supported languages
    console.log('🌍 Queueing background translation for note:', note.id);
    queueBackgroundTranslation(note.id, note.title, note.content);

    await publishProgress(100, "completed", "Notes generated successfully");

    // No credit deduction - notes from existing content are free

    const response: ApiSuccessResponse = {
      success: true,
      data: note,
    };
    return NextResponse.json(response);

  } catch (error) {
    console.error('AI note generation error:', error);
    await publishProgress(
      0,
      "error",
      error instanceof Error ? error.message : "Failed to generate AI note"
    );

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to generate AI note',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'AI Note Generation API',
    endpoints: {
      POST: '/api/notes/generate - Generate AI notes from transcript',
    },
    parameters: {
      transcriptId: 'Transcript ID to generate notes from (required)',
    },
  });
}
