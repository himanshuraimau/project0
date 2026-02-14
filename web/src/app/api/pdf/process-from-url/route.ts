import { NextRequest, NextResponse } from "next/server";
import { PDFParser } from "@/lib/pdf-parser";
import { NoteService } from "@/lib/note-service";
import { FeatureGateService } from "@/lib/feature-gate-service";
import { getUserFromAuth } from "@/lib/auth-helper";

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
      parseResult = await parser.extractToDatabase(buffer, fileName, userId);
    } catch (parseError) {
      console.error("PDF parsing failed:", parseError);

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

    // Generate AI notes if requested
    let noteResult = null;

    // Increment PDF processing usage counter after successful parsing
    await FeatureGateService.incrementPdfUsage(userId);

    if (generateNotes && parseResult.documentId) {
      try {
        noteResult = await noteService.generateAINote(parseResult.documentId, userId, folderId || undefined);

        // Increment note usage counter after successful note creation
        await FeatureGateService.incrementNoteUsage(userId);
      } catch (noteError) {
        console.error("Failed to generate AI notes:", noteError);

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
