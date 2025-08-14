import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateNotesFromContent, NoteService } from "@/lib/note-service";
import { checkUserHasCredits, consumeCredits } from "@/lib/usage";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { text, title } = await request.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Text content is required" },
        { status: 400 }
      );
    }

    // Check if user has sufficient credits
    const hasCredits = await checkUserHasCredits();
    if (!hasCredits) {
      return NextResponse.json(
        {
          success: false,
          error: "Insufficient credits",
          message: "You need at least 1 credit to generate AI notes from text.",
          redirectUrl: "/pricing",
        },
        { status: 403 }
      );
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
      // Consume credits before generating notes
      await consumeCredits();

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
        consumeCredits: false, // Don't consume credits again since we already did
      });
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

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in generate-from-text API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "Failed to process text input",
      },
      { status: 500 }
    );
  }
}
