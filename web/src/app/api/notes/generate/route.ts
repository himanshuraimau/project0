import { NextRequest, NextResponse } from 'next/server';
import { NoteService } from '@/lib/note-service';
import { UserService } from '@/lib/user-service';
import { getUserFromAuth } from '@/lib/auth-helper';
import { ApiSuccessResponse, ApiErrorResponse, GenerateNoteRequest } from '@/lib/types';
import { queueBackgroundTranslation } from '@/lib/translation-service';

const noteService = new NoteService();

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);
    const body: GenerateNoteRequest = await request.json();
    const { transcriptId, folderId } = body;

    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Unauthorized'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    if (!transcriptId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Transcript ID is required'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // IDEMPOTENCY CHECK: Check if note already exists for this transcript
    const { prisma } = await import('@/lib/prisma');
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
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: accessCheck.message || 'Unable to create note',
        message: accessCheck.message,
        // @ts-ignore - adding extra fields for client
        notesUsed: accessCheck.notesUsed,
        notesLimit: accessCheck.notesLimit,
        upgradeUrl: accessCheck.upgradeUrl || '/pricing',
      };
      return NextResponse.json(errorResponse, { status: accessCheck.statusCode });
    }

    // Generate AI note from the transcript
    const note = await noteService.generateAINote(transcriptId, userId || undefined, folderId);

    // Increment user's notes count
    await prisma.user.update({
      where: { id: userId },
      data: { notesCount: { increment: 1 } }
    });

    // Queue background translation to all supported languages
    console.log('🌍 Queueing background translation for note:', note.id);
    queueBackgroundTranslation(note.id, note.title, note.content);

    // No credit deduction - notes from existing content are free

    const response: ApiSuccessResponse = {
      success: true,
      data: note,
    };
    return NextResponse.json(response);

  } catch (error) {
    console.error('AI note generation error:', error);

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
