import { NextRequest, NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { ApiSuccessResponse, ApiErrorResponse, QuizQuestion, QuizData, CreateQuizRequest } from '@/lib/types';

const model = google('models/gemini-1.5-flash-latest');

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const body: CreateQuizRequest = await request.json();
    const { noteId } = body;

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

    // Generate quiz using AI
    const result = await generateText({
      model,
      prompt: `
        You are a professional quiz creator and educational content developer specializing in creating comprehensive, thought-provoking assessments. I will provide you with a text file containing educational content. Your task is to carefully read and analyze the entire document, then create exactly 20 high-quality quiz questions that thoroughly test understanding, application, and analysis of the key concepts.
QUIZ REQUIREMENTS:

Create exactly 20 questions that comprehensively cover the content
Only use multiple choice and true/false question types
Questions should range across different cognitive levels: recall, comprehension, application, analysis, and evaluation
Each question should test meaningful understanding and practical application, not just rote memorization
Include questions that test concept relationships, real-world applications, and critical thinking
Cover all major themes and sections of the provided content

DETAILED QUESTION DESIGN STRATEGY:
Multiple Choice Questions (15 total):

Conceptual Understanding (4-5 questions): Test definitions, core principles, and fundamental concepts
Comparative Analysis (3-4 questions): Compare different approaches, methods, or concepts
Application & Problem-Solving (4-5 questions): Test ability to apply concepts to new scenarios
Process & Methodology (2-3 questions): Test understanding of procedures, workflows, or step-by-step processes
Evaluation & Analysis (1-2 questions): Test critical thinking about advantages, disadvantages, or implications

True/False Questions (5 total):

Focus on testing understanding of key relationships, cause-and-effect, and nuanced distinctions
Avoid overly simplistic statements that don't test meaningful understanding
Include subtle misconceptions that require careful thinking to identify

QUALITY ENHANCEMENT GUIDELINES:
Question Construction:

Questions should be specific, clear, and test substantial understanding
Multiple choice options should include plausible distractors that test common misconceptions
Avoid trick questions, but include options that require careful discrimination
Questions should be answerable by someone who thoroughly understands the content
Include scenario-based questions that test application in realistic contexts

Answer Options Quality:

All multiple choice distractors should be plausible to someone with partial understanding
Include common misconceptions as incorrect options to test precise understanding
Ensure only one clearly correct answer per question
Options should be similar in length and grammatical structure

Explanation Requirements:

Each explanation should be detailed and educational (2-4 sentences typically)
Explain not just why the correct answer is right, but why other options are incorrect
Include relevant context, reasoning, and connections to broader concepts
Make explanations valuable learning tools that reinforce understanding

DIFFICULTY DISTRIBUTION:

Easy (5-6 questions): Basic recall and fundamental understanding
Medium (8-10 questions): Application, analysis, and connections between concepts
Challenging (4-6 questions): Complex scenarios, evaluation, and synthesis

OUTPUT FORMAT:
You must return a valid JSON object with the following structure:
{
"quiz": [
{
"id": 1,
"type": "multiple_choice",
"question": "[Clear, specific question testing meaningful understanding with sufficient context]",
"options": [
"[Plausible option that tests understanding]",
"[Correct answer with appropriate detail]",
"[Common misconception or distractor]",
"[Another plausible but incorrect option]"
],
"correct_answer": "[Exact match to the correct option]",
"explanation": "[Comprehensive 2-4 sentence explanation covering why this answer is correct, why others are incorrect, and relevant context or implications.]"
},
{
"id": 2,
"type": "true_false",
"question": "[Statement that tests nuanced understanding rather than simple fact recall]",
"correct_answer": true,
"explanation": "[Detailed explanation of the reasoning, including context and why the opposite would be incorrect.]"
}
]
}
QUESTION TYPE DISTRIBUTION:

15 multiple choice questions (with 4 options each)
5 true/false questions

CONTENT COVERAGE STRATEGY:

Systematically cover all major sections and themes from the provided content
Ensure balanced representation of different topics within the material
Include questions that test understanding of relationships between different sections
Focus on the most important concepts while including some specific details that demonstrate thorough reading

QUALITY CHECKLIST:
Before finalizing, ensure each question meets these criteria:

✓ Tests meaningful understanding beyond simple recall
✓ Has clear, unambiguous wording
✓ Includes plausible distractors for multiple choice
✓ Explanation provides educational value and detailed reasoning
✓ Is answerable based solely on the provided content
✓ Contributes to comprehensive coverage of the material
✓ Appropriate difficulty level for the target audience

IMPORTANT FORMATTING REQUIREMENTS:

Return ONLY valid JSON - no additional text, explanations, or formatting
Ensure all JSON syntax is correct (proper quotes, commas, brackets)
Do not include any markdown formatting or code block indicators
The response should start with { and end with }
All strings must be properly escaped for JSON format

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
