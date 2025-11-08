import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { prisma } from '@/lib/services/prisma';
import { auth } from '@clerk/nextjs/server';

interface QuizQuestion {
  id: number;
  type: 'multiple_choice' | 'true_false';
  question: string;
  options?: string[];
  correct_answer: string | boolean;
  explanation: string;
}

interface QuizData {
  quiz: QuizQuestion[];
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

    if (chapter.questions && chapter.questions.length > 0) {
      const quizQuestions: QuizQuestion[] = chapter.questions.map((q, index) => {
        const options = JSON.parse(q.options) as string[];
        return {
          id: index + 1,
          type: 'multiple_choice' as const,
          question: q.question,
          options: options,
          correct_answer: q.answer,
          explanation: `The correct answer is: ${q.answer}`
        };
      });

      const quizData: QuizData = { quiz: quizQuestions };
      
      return NextResponse.json({
        success: true,
        data: quizData,
        message: 'Quiz questions already exist for this chapter',
        cached: true
      });
    }

    const content = chapter.notes || chapter.transcript || '';
    
    if (!content || content.trim().length < 100) {
      return NextResponse.json(
        { success: false, error: 'Insufficient content to generate quiz' },
        { status: 400 }
      );
    }

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: `Create a quiz with exactly 20 questions from this chapter content:

CHAPTER: ${chapter.name}

CONTENT:
${content.substring(0, 3000)}

REQUIREMENTS:
1. Create exactly 20 questions (16 multiple choice, 4 true/false)
2. Test understanding of key concepts
3. Include clear explanations for each answer
4. Return ONLY valid JSON in this format:

{
  "quiz": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option B",
      "explanation": "Explanation of why this is correct."
    },
    {
      "id": 2,
      "type": "true_false",
      "question": "True or false statement here?",
      "options": ["True", "False"],
      "correct_answer": "True",
      "explanation": "Explanation of the answer."
    }
  ]
}

Generate ONLY the JSON, no other text:`,
    });

    let cleanedText = result.text.trim();
    
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const quizData: QuizData = JSON.parse(cleanedText);
    
    if (!quizData.quiz || !Array.isArray(quizData.quiz) || quizData.quiz.length < 10) {
      throw new Error('Invalid quiz structure or insufficient questions');
    }

    const mcQuestions = quizData.quiz.filter(q => q.type === 'multiple_choice').slice(0, 3);
    if (mcQuestions.length > 0) {
      await Promise.all(
        mcQuestions.map((q) =>
          prisma.question.create({
            data: {
              chapterId: chapterId,
              question: q.question,
              answer: q.correct_answer as string,
              options: JSON.stringify(q.options),
            },
          })
        )
      );
    }

    return NextResponse.json({
      success: true,
      data: quizData,
      message: `Successfully generated ${quizData.quiz.length} quiz questions`
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

    const questions = await prisma.question.findMany({
      where: { chapterId },
      orderBy: { createdAt: 'asc' }
    });

    if (questions.length > 0) {
      const quizQuestions: QuizQuestion[] = questions.map((q, index) => {
        const options = JSON.parse(q.options) as string[];
        return {
          id: index + 1,
          type: 'multiple_choice' as const,
          question: q.question,
          options: options,
          correct_answer: q.answer,
          explanation: `The correct answer is: ${q.answer}`
        };
      });

      const quizData: QuizData = { quiz: quizQuestions };

      return NextResponse.json({
        success: true,
        data: quizData,
        message: 'Questions found'
      });
    }

    return NextResponse.json({
      success: true,
      data: null,
      message: 'No questions found'
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
