import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

const flashcardSchema = z.object({
  flashcards: z.array(z.object({
    id: z.number(),
    question: z.string().describe("Clear, specific question testing understanding"),
    answer: z.string().describe("Comprehensive answer with explanation and context")
  })).length(10)
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { userId } = await auth();
    const { chapterId } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!chapterId) {
      return NextResponse.json(
        { success: false, error: 'Chapter ID is required' },
        { status: 400 }
      );
    }

    // Get the chapter with its content
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        unit: {
          include: {
            course: true
          }
        }
      }
    });

    if (!chapter) {
      return NextResponse.json(
        { success: false, error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Verify that the user owns this course
    if (chapter.unit.course.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if flashcards already exist
    if (chapter.flashcards) {
      return NextResponse.json({
        success: true,
        data: chapter.flashcards,
        cached: true,
        message: `Retrieved ${Array.isArray(chapter.flashcards) ? chapter.flashcards.length : 0} cached flashcards`
      });
    }

    // Check if chapter has content (notes)
    if (!chapter.notes || chapter.notes.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Chapter content not available. Please load the chapter content first.' },
        { status: 400 }
      );
    }

    // Generate flashcards using AI
    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: flashcardSchema,
      prompt: `You are an expert educational content creator specializing in creating high-quality study flashcards.

Create exactly 10 flashcards based on the following chapter content. The flashcards should:

1. **Test Key Concepts**: Focus on the most important ideas, definitions, and principles
2. **Range in Difficulty**: Include both foundational and analytical questions
3. **Be Clear and Specific**: Questions should be unambiguous and test meaningful understanding
4. **Have Comprehensive Answers**: Provide detailed explanations with context and reasoning (2-4 sentences)

**Question Types to Include:**
- Definitional: "What is...?" "Define..."
- Explanatory: "How does...?" "Why does...?" "Explain..."
- Application: "How would you apply...?" "What would happen if...?"
- Analytical: "What are the implications of...?" "Compare..."

**Chapter Title:** ${chapter.name}

**Chapter Content:**
${chapter.notes}

Generate exactly 10 flashcards that thoroughly cover the key concepts from this chapter content.`,
    });

    // Save the generated flashcards to the database
    await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        flashcards: result.object.flashcards
      }
    });

    return NextResponse.json({
      success: true,
      data: result.object.flashcards,
      message: `Successfully generated ${result.object.flashcards.length} flashcards`
    });

  } catch (error) {
    console.error('Chapter flashcard generation error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate flashcards',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  const { chapterId } = await params;
  
  return NextResponse.json({
    message: 'Chapter Flashcard API',
    endpoints: {
      POST: `/api/chapter/${chapterId}/flashcards - Generate flashcards from chapter content`,
    },
    parameters: {
      chapterId: 'Chapter ID to generate flashcards from (required)',
    },
  });
}