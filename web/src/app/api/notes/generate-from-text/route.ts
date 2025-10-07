import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateNotesFromContent, NoteService } from "@/lib/note-service";
import { FeatureGateService } from "@/lib/feature-gate-service";
import { ApiSuccessResponse, ApiErrorResponse, GenerateNotesFromTextRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "Unauthorized"
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const { text, title }: GenerateNotesFromTextRequest = await request.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "Text content is required"
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Check subscription access
    const accessCheck = await FeatureGateService.checkAccessForAPI();
    if (!accessCheck.allowed) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: accessCheck.message || 'Active subscription required to generate notes from text'
      };
      return NextResponse.json(errorResponse, { status: accessCheck.statusCode });
    }

    // Create a transcript record for the text input
    const timestamp = Date.now();
    const fileName = `${timestamp}_${(title || "text-input").replace(
      /[^a-zA-Z0-9]/g,
      "_"
    )}.txt`;

    const transcript = await prisma.transcript.create({
      data: {
        userId,
        fileName,
        originalName: title || "Text Input",
        content: text.trim(),
        cleanContent: text.trim(),
        pages: 1,
        metadata: {
          source: "text-input",
          title: title || "Text Input",
        },
      },
    });

    // Generate AI notes from the text content
    let note;
    try {
      const aiNote = await generateNotesFromContent(
        text.trim(),
        title || "Text Note"
      );

      // Create the note using NoteService to automatically generate embeddings
      const noteService = new NoteService();
      note = await noteService.saveNote({
        title: aiNote.title,
        content: aiNote.content,
        transcriptId: transcript.id,
        userId,
      });

      // No credit deduction needed - subscription system handles access
    } catch (error) {
      console.error("Error generating AI notes:", error);

      // If AI note generation fails, still return the transcript but with an error note
      note = {
        error: "Failed to generate AI notes",
        message:
          "The text was processed successfully, but AI note generation failed. Please try again.",
      };
    }

    const result = {
      transcript: {
        id: transcript.id,
        text: transcript.content,
        cleanText: transcript.cleanContent,
        pages: transcript.pages,
        metadata: transcript.metadata,
        imageCount: 0,
      },
      note,
    };

    const response: ApiSuccessResponse = {
      success: true,
      data: result,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in generate-from-text API:", error);
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: "Internal server error",
      message: "Failed to process text input",
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
