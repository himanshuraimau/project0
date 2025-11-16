import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);

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

    // Generate mindmap using Markmap markdown format
    const prompt = `Generate a comprehensive mind map in Markmap markdown format that visually represents the key concepts, relationships, and hierarchies in this content:

Title: ${sourceTitle}
Content: ${sourceContent.substring(0, 2000)}

Follow these rules strictly:
1. Create a rich, detailed mind map with proper hierarchy using markdown heading syntax (# ## ### ####)
2. # is the root node (use the title), ## for main branches, ### for sub-branches, #### for details
3. Create at least 5-8 main branches (level 2 headings) covering different aspects/themes
4. Each main branch should have 3-5 sub-branches (level 3 headings)
5. Use bullet points (-) for additional details under any heading level
6. Make the mind map comprehensive and information-rich - don't oversimplify
7. Use **bold** for emphasis on important terms and *italic* for definitions or explanations
8. Use markdown syntax properly - headings for hierarchy and bullets for lists
9. Focus on showing relationships between concepts, not just listing them
10. DO NOT use any code blocks, triple backticks, or non-markdown syntax
11. Start directly with the root heading (# ${sourceTitle})

The goal is to create a detailed, well-structured visual representation that helps understand the content deeply.

Generate ONLY the markdown content for the mind map:`;

    const result = await generateText({
      model: openai('gpt-4o'),
      prompt: prompt,
      temperature: 0.7,
    });

    let markdownContent = result.text.trim();

    console.log('Raw AI response:', markdownContent.substring(0, 200) + '...');

    // Clean up the markdown content
    if (markdownContent.startsWith('```')) {
      markdownContent = markdownContent.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');
    }

    // Remove any extra whitespace and normalize line endings
    markdownContent = markdownContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Fix common syntax issues for markdown
    markdownContent = markdownContent
      .replace(/[\u201C\u201D]/g, '"')  // Replace smart quotes
      .replace(/[\u2018\u2019]/g, "'")  // Replace smart apostrophes
      .trim();

    // Ensure it starts with a top-level heading
    if (!markdownContent.startsWith('# ')) {
      markdownContent = `# ${sourceTitle}\n` + markdownContent;
    }

    console.log('Final markdown content:', markdownContent);

    // Store markdown content in the existing mermaidCode field
    const mindmap = await prisma.mindMap.upsert({
      where: { noteId: noteId },
      update: {
        title: `${note.title} - Mindmap`,
        // Store markdown in mermaidCode field
        mermaidCode: markdownContent,
        updatedAt: new Date(),
      },
      create: {
        title: `${note.title} - Mindmap`,
        // Store markdown in mermaidCode field
        mermaidCode: markdownContent,
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