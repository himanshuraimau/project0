import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { prisma } from '@/lib/services/prisma';
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
      prompt: `CHAPTER FLASHCARD MASTER & LEARNING ARCHITECT

You are the ultimate chapter-focused flashcard creator! Your mission is to transform this specific chapter content into 10 powerful, engaging flashcards that make mastering chapter concepts both effective and enjoyable.

YOUR MISSION: Create exactly 10 brilliant flashcards that thoroughly test understanding of this chapter's key concepts!

FLASHCARD EXCELLENCE STANDARDS:

1. Test Key Concepts
- Focus on most important ideas, definitions, and principles
- Target concepts that students MUST understand from this chapter
- Include both explicit facts and implicit connections

2. Smart Difficulty Range
- Mix foundational recall with analytical thinking
- Progress from basic understanding to application
- Include questions that test deeper comprehension

3. Crystal Clear Questions
- Unambiguous wording that tests meaningful understanding
- Specific enough to have one clear correct answer
- Avoid trick questions but challenge thinking

4. Comprehensive Answers
- Detailed explanations with context and reasoning (2-4 sentences)
- Include WHY something is true, not just WHAT is true
- Connect concepts to broader chapter themes

STRATEGIC QUESTION TYPES TO INCLUDE:

- Definitional (2-3 cards): "What is...?" "Define..." "Identify..."
- Explanatory (3-4 cards): "How does...?" "Why does...?" "Explain the process..."
- Application (2-3 cards): "How would you apply...?" "What would happen if...?" "In what scenario...?"
- Analytical (1-2 cards): "What are the implications of...?" "Compare..." "Analyze the relationship..."

QUALITY GUIDELINES:
- Each question should test understanding, not just memorization
- Answers should teach while testing - educational and comprehensive
- Include connections between concepts when relevant
- Make answers self-contained with sufficient context
- Use engaging language that makes learning enjoyable

Chapter Title: ${chapter.name}

Chapter Content to Transform:
${chapter.notes}

Create exactly 10 amazing flashcards that help students master this chapter's key concepts! Make each flashcard a powerful learning tool that builds understanding step by step.`,
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
  try {
    const { userId } = await auth();
    const { chapterId } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the chapter with its flashcards
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

    // Return existing flashcards if they exist
    if (chapter.flashcards) {
      return NextResponse.json({
        success: true,
        data: chapter.flashcards,
        message: `Found ${Array.isArray(chapter.flashcards) ? chapter.flashcards.length : 0} existing flashcards`
      });
    }

    // No flashcards found
    return NextResponse.json({
      success: true,
      data: null,
      message: 'No flashcards found'
    });

  } catch (error) {
    console.error('Error fetching flashcards:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch flashcards',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}