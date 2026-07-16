import { NextRequest, NextResponse } from 'next/server';
import { aiGateway, AI_MODELS } from '@/lib/ai/gateway';
import { generateText } from 'ai';
import { prisma } from '@/lib/prisma';
import { getUserFromAuth } from '@/lib/auth-helper';
import { ApiSuccessResponse, ApiErrorResponse, QuizQuestion, QuizData, CreateQuizRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);
    const body: CreateQuizRequest = await request.json();
    const { noteId } = body;

    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Unauthorized'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    if (!noteId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Note ID is required'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Check if quiz already exists for this note
    const existingQuiz = await prisma.quiz.findUnique({
      where: { noteId }
    });

    if (existingQuiz) {
      const response: ApiSuccessResponse = {
        success: true,
        data: existingQuiz,
        message: 'Quiz already exists for this note'
      };
      return NextResponse.json(response);
    }

    // Quizzes are now free once content exists - no credit check needed

    // Get the note and its content
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        transcript: true
      }
    });

    if (!note) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Note not found'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Generate quiz using AI with simplified prompt
    const result = await generateText({
      model: aiGateway(AI_MODELS.quiz),
      prompt: `Create a quiz with exactly 20 questions from this content:

CONTENT:
${note.content.substring(0, 3000)}

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
      "options": [
        "Option A",
        "Option B", 
        "Option C",
        "Option D"
      ],
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

    // Parse and validate the generated quiz
    let cleanedText = result.text.trim();
    console.log('Raw quiz generation result:', cleanedText.substring(0, 500));
    
    // Remove markdown code blocks if they exist
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    console.log('Cleaned quiz text:', cleanedText.substring(0, 500));
    
    const quizData: QuizData = JSON.parse(cleanedText);
    console.log('Parsed quiz data:', { questionCount: quizData.quiz?.length, firstQuestion: quizData.quiz?.[0] });
    
    if (!quizData.quiz || !Array.isArray(quizData.quiz) || quizData.quiz.length < 10) {
      throw new Error('Invalid quiz structure or insufficient questions');
    }

    // Save quiz to database as a single record with JSON content
    const createdQuiz = await prisma.quiz.create({
      data: {
        noteId: noteId,
        content: quizData as object, // Cast to object for JSON compatibility
        userId: userId || undefined
      }
    });

    // Quizzes are now free - no credit deduction

    const response: ApiSuccessResponse = {
      success: true,
      data: createdQuiz,
      message: `Successfully generated ${quizData.quiz.length} quiz questions`
    };
    return NextResponse.json(response);

  } catch (error) {
    console.error('Quiz generation error:', error);
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to generate quiz',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Quiz Generation API',
    endpoints: {
      POST: '/api/notes/generate-quiz - Generate quiz from note content',
    },
    parameters: {
      noteId: 'Note ID to generate quiz from (required)',
    },
  });
}
