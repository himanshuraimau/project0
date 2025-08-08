import { NextRequest, NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

const model = google('models/gemini-1.5-flash-latest');

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

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    const { noteId } = body;

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }

    // Check if quiz already exists for this note
    const existingQuiz = await prisma.quiz.findUnique({
      where: { noteId }
    });

    if (existingQuiz) {
      return NextResponse.json({
        success: true,
        data: existingQuiz,
        message: 'Quiz already exists for this note'
      });
    }

    // Get the note and its content
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        transcript: true
      }
    });

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    // Generate quiz using AI
    const result = await generateText({
      model,
      prompt: `
        You are a professional quiz creator and educational content developer. I will provide you with a text file containing educational content. Your task is to carefully read and analyze the entire document, and then create exactly 20 high-quality quiz questions based on the content.

        QUIZ REQUIREMENTS:
        - Create exactly 20 questions
        - Only use multiple choice and true/false question types
        - Questions should cover different aspects and difficulty levels of the content
        - Each question should test understanding, not just memorization
        - Include questions that test application of concepts, not just recall

        OUTPUT FORMAT:
        You must return a valid JSON object with the following structure:

        {
          "quiz": [
            {
              "id": 1,
              "type": "multiple_choice",
              "question": "What is the main concept discussed in the document?",
              "options": [
                "Option A",
                "Option B", 
                "Option C",
                "Option D"
              ],
              "correct_answer": "Option B",
              "explanation": "Brief explanation of why this is correct"
            },
            {
              "id": 2,
              "type": "true_false",
              "question": "The document states that...",
              "correct_answer": true,
              "explanation": "Brief explanation"
            }
          ]
        }

        QUESTION TYPE DISTRIBUTION:
        - 15 multiple choice questions (with 4 options each)
        - 5 true/false questions

        QUALITY GUIDELINES:
        - Questions should be clear and unambiguous
        - Multiple choice options should be plausible distractors
        - Avoid trick questions or overly obscure details
        - Focus on key concepts, relationships, and applications
        - Ensure questions are answerable based on the provided content
        - Progressive difficulty: mix easy, medium, and challenging questions

        IMPORTANT: 
        - Return ONLY valid JSON - no additional text, explanations, or formatting
        - Ensure all JSON syntax is correct (proper quotes, commas, brackets)
        - Do not include any markdown formatting or code block indicators
        - The response should start with { and end with }

        Input content to create quiz from:
        ${note.content}
      `,
    });

    // Parse and validate the generated quiz
    let cleanedText = result.text.trim();
    
    // Remove markdown code blocks if they exist
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const quizData: QuizData = JSON.parse(cleanedText);
    
    if (!quizData.quiz || !Array.isArray(quizData.quiz) || quizData.quiz.length !== 20) {
      throw new Error('Invalid quiz structure or incorrect number of questions');
    }

    // Save quiz to database as a single record with JSON content
    const createdQuiz = await prisma.quiz.create({
      data: {
        noteId: noteId,
        content: quizData as any, // Cast to any for JSON compatibility
        userId: userId || undefined
      }
    });

    return NextResponse.json({
      success: true,
      data: createdQuiz,
      message: `Successfully generated ${quizData.quiz.length} quiz questions`
    });

  } catch (error) {
    console.error('Quiz generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate quiz',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
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
