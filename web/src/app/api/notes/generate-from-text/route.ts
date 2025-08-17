import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateNotesFromContent, NoteService } from "@/lib/note-service";
import { UserService } from "@/lib/user-service";
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

    // Check if user has enough credits (1 credit for text-to-notes generation)
    const hasEnoughCredits = await UserService.hasEnoughCredits(userId, 1);
    if (!hasEnoughCredits) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Insufficient credits. You need 1 credit to generate notes from text.'
      };
      return NextResponse.json(errorResponse, { status: 402 });
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

      // Deduct 1 credit for text-to-notes generation
      await UserService.deductCredits('text_to_notes', 1, note.id);
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
