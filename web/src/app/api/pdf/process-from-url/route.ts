import { NextRequest, NextResponse } from "next/server";
import { PDFParser } from "@/lib/pdf-parser";
import { NoteService } from "@/lib/note-service";
import { FeatureGateService } from "@/lib/feature-gate-service";
import { getUserFromAuth } from "@/lib/auth-helper";
import { noteProgressManager } from "@/lib/note-progress-manager";
import { prisma } from "@/lib/prisma";

const parser = new PDFParser();
const noteService = new NoteService();

export const maxDuration = 300; // 5 minutes
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_PDF_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserFromAuth(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: "Please sign in to process PDF files." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const pdfUrl = typeof body.pdfUrl === "string" ? body.pdfUrl.trim() : "";
    const fileName = (typeof body.fileName === "string" ? body.fileName.trim() : null) ?? "uploaded.pdf";
    const generateNotes = body.generateNotes !== false; // default true
    const folderId = (typeof body.folderId === "string" ? body.folderId : null) || null;
    const progressJobId =
      typeof body.progressJobId === "string" ? body.progressJobId.trim() : "";

    const publishProgress = (
      progress: number,
      stage: "uploading" | "processing" | "generating" | "completed" | "error",
      message: string
    ) => {
      if (!progressJobId) {
        return;
      }
      noteProgressManager.publish({
        jobId: progressJobId,
        progress,
        stage,
        message,
      });
    };

    publishProgress(15, "uploading", "Extracting PDF...");

    if (!pdfUrl || !pdfUrl.startsWith("http")) {
      return NextResponse.json(
        { success: false, error: "Valid pdfUrl is required (must be an HTTP/HTTPS URL)." },
        { status: 400 }
      );
    }

    // Check note creation access
    const accessCheck = await FeatureGateService.checkNoteCreationAccess();
    if (!accessCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: accessCheck.error,
          message: accessCheck.message,
          notesUsed: accessCheck.notesUsed,
          notesLimit: accessCheck.notesLimit,
          upgradeUrl: accessCheck.upgradeUrl || "/pricing",
        },
        { status: accessCheck.statusCode }
      );
    }

    // Fetch PDF from S3 presigned URL
    const response = await fetch(pdfUrl, {
      method: "GET",
      headers: { Accept: "application/pdf" },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch PDF",
          message: `Failed to fetch PDF from storage: ${response.status} ${response.statusText}`,
        },
        { status: 502 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const size = arrayBuffer.byteLength;

    if (size > MAX_PDF_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "File too large",
          message: `PDF file is too large. Maximum size is 20MB. Your file is ${(size / 1024 / 1024).toFixed(2)}MB.`,
        },
        { status: 413 }
      );
    }

    // Convert to buffer for PDF parser
    let buffer: Buffer;
    try {
      buffer = Buffer.from(arrayBuffer);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "File processing failed",
          message: "Unable to read the uploaded file. Please try again.",
        },
        { status: 400 }
      );
    }

    // Parse PDF and extract text
    let parseResult;
    try {
      publishProgress(40, "processing", "Parsing PDF...");
      parseResult = await parser.extractToDatabase(buffer, fileName, userId);
    } catch (parseError) {
      console.error("PDF parsing failed:", parseError);
      publishProgress(0, "error", "Failed while parsing PDF");

      if (parseError instanceof Error) {
        const errorMessage = parseError.message.toLowerCase();

        if (errorMessage.includes("invalid pdf") || errorMessage.includes("corrupted")) {
          return NextResponse.json(
            { success: false, error: "Invalid PDF file", message: "The uploaded file is not a valid PDF or is corrupted." },
            { status: 400 }
          );
        }
        if (errorMessage.includes("timeout")) {
          return NextResponse.json(
            { success: false, error: "Processing timeout", message: "PDF processing timed out. Please try a smaller file." },
            { status: 408 }
          );
        }
        if (errorMessage.includes("password")) {
          return NextResponse.json(
            { success: false, error: "Password protected", message: "Password-protected PDFs are not supported." },
            { status: 400 }
          );
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: "PDF processing failed",
          message: parseError instanceof Error ? parseError.message : "Failed to process PDF",
        },
        { status: 500 }
      );
    }

    // Persist progressJobId on transcript metadata so we can recover/cleanup after refresh
    if (progressJobId && parseResult.documentId) {
      try {
        const baseMetadata =
          parseResult.metadata &&
          typeof parseResult.metadata === "object" &&
          !Array.isArray(parseResult.metadata)
            ? (parseResult.metadata as Record<string, unknown>)
            : {};

        const nextMetadata = { ...baseMetadata, progressJobId };

        await prisma.transcript.update({
          where: { id: parseResult.documentId },
          data: {
            metadata: nextMetadata,
          },
        });

        parseResult.metadata = nextMetadata;
      } catch (metadataError) {
        console.error("Failed to persist progressJobId on transcript metadata:", metadataError);
      }
    }

    // Generate AI notes if requested
    let noteResult = null;

    // Increment PDF processing usage counter after successful parsing
    await FeatureGateService.incrementPdfUsage(userId);

    if (generateNotes && parseResult.documentId) {
      try {
        const reservation = await FeatureGateService.reserveNoteUsage(userId);
        if (!reservation.allowed) {
          noteResult = {
            error: reservation.error || 'FREE_TIER_LIMIT_REACHED',
            message: reservation.message || 'Unable to create note',
            notesUsed: reservation.notesUsed,
            notesLimit: reservation.notesLimit,
            upgradeUrl: reservation.upgradeUrl || '/pricing',
          };
        } else {
          publishProgress(60, "generating", "Indexing...");
          publishProgress(75, "generating", "Chunking...");
          noteResult = await noteService.generateAINote(parseResult.documentId, userId, folderId || undefined);
        }
      } catch (noteError) {
        console.error("Failed to generate AI notes:", noteError);
        publishProgress(0, "error", "Failed while generating note");
        
        // Decrement counter since note creation failed
        await FeatureGateService.decrementNoteUsage(userId);

        if (noteError instanceof Error) {
          const errorMessage = noteError.message.toLowerCase();
          if (errorMessage.includes("overloaded") || errorMessage.includes("quota")) {
            noteResult = {
              modelOverloaded: true,
              message:
                "AI service is currently busy. Your PDF was processed successfully, but AI notes could not be generated at this time.",
            };
          } else {
            noteResult = { error: "Failed to generate AI notes", message: noteError.message };
          }
        } else {
          noteResult = { error: "Failed to generate AI notes", message: "Unknown error occurred during note generation" };
        }
      }
    }

    publishProgress(100, "completed", "Finishing...");

    return NextResponse.json({
      success: true,
      data: {
        transcript: {
          id: parseResult.documentId,
          text: parseResult.text,
          cleanText: parseResult.cleanText,
          pages: parseResult.pages,
          metadata: parseResult.metadata,
          imageCount: parseResult.images?.length || 0,
          extractedFiles: parseResult.extractedFiles,
        },
        note: noteResult,
      },
    });
  } catch (error) {
    console.error("PDF process-from-url error:", error);

    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes("unauthorized") || errorMessage.includes("authentication")) {
        return NextResponse.json(
          { success: false, error: "Authentication failed", message: "Please sign in and try again." },
          { status: 401 }
        );
      }
      if (errorMessage.includes("database") || errorMessage.includes("prisma")) {
        return NextResponse.json(
          { success: false, error: "Database error", message: "Unable to save PDF content. Please try again later." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "PDF processing failed",
        message: "An unexpected error occurred while processing the PDF. Please try again.",
      },
      { status: 500 }
    );
  }
}
