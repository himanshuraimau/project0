import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

interface QuizQuestion {
  question: string;
  answer: string;
  option1: string;
  option2: string;
  option3: string;
}

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
        questions: true,
      }
    });

    if (!chapter) {
      return NextResponse.json(
        { success: false, error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Check if questions already exist
    if (chapter.questions && chapter.questions.length > 0) {
      return NextResponse.json({
        success: true,
        data: chapter.questions,
        message: 'Quiz questions already exist for this chapter',
        cached: true
      });
    }

    // Prepare content for quiz generation
    const content = chapter.notes || chapter.transcript || '';
    
    if (!content || content.trim().length < 100) {
      return NextResponse.json(
        { success: false, error: 'Insufficient content to generate quiz' },
        { status: 400 }
      );
    }

    // Generate quiz questions using AI
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: `Create 3 multiple choice quiz questions from this chapter content:

CHAPTER: ${chapter.name}

CONTENT:
${content.substring(0, 3000)}

REQUIREMENTS:
1. Create exactly 3 multiple choice questions
2. Each question should have 3 options
3. Test understanding of key concepts
4. Return ONLY valid JSON in this exact format:

{
  "questions": [
    {
      "question": "Question text here?",
      "answer": "Correct answer text",
      "option1": "First option",
      "option2": "Second option",
      "option3": "Third option"
    }
  ]
}

IMPORTANT: 
- One of option1, option2, or option3 MUST match the answer exactly
- Make questions clear and unambiguous
- Generate ONLY the JSON, no other text`,
    });

    // Parse and validate the generated quiz
    let cleanedText = result.text.trim();
    
    // Remove markdown code blocks if they exist
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const quizData: { questions: QuizQuestion[] } = JSON.parse(cleanedText);
    
    if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
      throw new Error('Invalid quiz structure');
    }

    // Save questions to database
    const createdQuestions = await Promise.all(
      quizData.questions.map((q) =>
        prisma.question.create({
          data: {
            chapterId: chapterId,
            question: q.question,
            answer: q.answer,
            options: JSON.stringify([q.option1, q.option2, q.option3]),
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      data: createdQuestions,
      message: `Successfully generated ${createdQuestions.length} quiz questions`
    });

  } catch (error) {
    console.error('Chapter quiz generation error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate quiz',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
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

    // Get existing questions for the chapter
    const questions = await prisma.question.findMany({
      where: { chapterId },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: questions,
      message: questions.length > 0 ? 'Questions found' : 'No questions found'
    });

  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch quiz questions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Delete all questions for the chapter
    await prisma.question.deleteMany({
      where: { chapterId }
    });

    return NextResponse.json({
      success: true,
      message: 'Quiz deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting quiz:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete quiz',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
