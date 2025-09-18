import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { noteId } = await req.json();

    if (!noteId) {
      return NextResponse.json({ error: "Note ID is required" }, { status: 400 });
    }

    // Get the note content and transcript
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        mindmap: true,
        transcript: true
      }
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Check if mindmap already exists
    if (note.mindmap) {
      return NextResponse.json({
        success: true,
        data: note.mindmap
      });
    }

    // Use transcript content if available, otherwise fall back to note content
    const sourceContent = note.transcript?.content || note.content;
    const sourceTitle = note.title;

    if (!sourceContent || sourceContent.trim().length < 50) {
      return NextResponse.json({
        error: "Not enough content to generate a meaningful mindmap"
      }, { status: 400 });
    }

    // Generate mindmap using proper Mermaid mindmap syntax
    const prompt = `Create a simple Mermaid mindmap from this content:

Title: ${sourceTitle}
Content: ${sourceContent.substring(0, 1000)}

Use EXACTLY this format:
mindmap
  root((${sourceTitle}))
    Concept 1
      Detail 1
      Detail 2
    Concept 2
      Detail 3
      Detail 4
    Concept 3
      Detail 5

Replace "Concept 1", "Concept 2", "Concept 3" with main concepts from the content.
Replace "Detail 1", "Detail 2", etc. with specific details from the content.
Keep labels short (2-4 words max).
Generate ONLY the mermaid mindmap code:`;

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: prompt,
    });

    let mermaidCode = result.text.trim();

    console.log('Raw AI response:', mermaidCode.substring(0, 200) + '...');

    // Clean up the mermaid mindmap code
    if (mermaidCode.startsWith('```')) {
      mermaidCode = mermaidCode.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');
    }

    // Remove any extra whitespace and normalize line endings
    mermaidCode = mermaidCode.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Fix common syntax issues for mindmap
    mermaidCode = mermaidCode
      .replace(/[\u201C\u201D]/g, '"')  // Replace smart quotes
      .replace(/[\u2018\u2019]/g, "'")  // Replace smart apostrophes
      .trim();

    // Ensure it starts with 'mindmap'
    if (!mermaidCode.startsWith('mindmap')) {
      mermaidCode = 'mindmap\n' + mermaidCode;
    }

    console.log('Final mermaid code:', mermaidCode);

    // Create or update the mindmap record using upsert
    const mindmap = await prisma.mindMap.upsert({
      where: { noteId: noteId },
      update: {
        title: `${note.title} - Mindmap`,
        mermaidCode: mermaidCode,
        updatedAt: new Date(),
      },
      create: {
        title: `${note.title} - Mindmap`,
        mermaidCode: mermaidCode,
        noteId: noteId,
        userId: userId,
      }
    });

    return NextResponse.json({
      success: true,
      data: mindmap
    });

  } catch (error) {
    console.error("Error generating mindmap:", error);

    let errorMessage = "Failed to generate mindmap";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}