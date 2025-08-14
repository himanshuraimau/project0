import { NextRequest, NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { ApiSuccessResponse, ApiErrorResponse, FlashcardItem, GenerateFlashcardRequest } from '@/lib/types';

const model = google('models/gemini-1.5-flash-latest');

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const body: GenerateFlashcardRequest = await request.json();
    const { noteId } = body;

    if (!noteId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Note ID is required'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Check if flashcards already exist for this note
    const existingFlashcard = await prisma.flashcard.findUnique({
      where: { noteId }
    });

    if (existingFlashcard) {
      const response: ApiSuccessResponse = {
        success: true,
        data: existingFlashcard,
        message: 'Flashcards already exist for this note'
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

    // Generate flashcards using AI
    const result = await generateText({
      model,
      prompt: `
        You are an expert educational content creator and flashcard designer specializing in creating comprehensive, detailed study materials. I will provide you with a structured document summary, and your task is to analyze the content deeply and create exactly 20 high-quality flashcards that thoroughly test understanding of key concepts, facts, and details.
Your flashcards should:

Cover the most important concepts, definitions, processes, facts, and relationships from the content
Range from foundational recall questions to complex analytical and application questions
Be clear, specific, and unambiguous in their wording
Have detailed, comprehensive answers that provide thorough explanations (3-6 sentences typically)
Test different cognitive levels: knowledge, comprehension, application, analysis, and evaluation
Include context and reasoning in answers, not just bare facts

DETAILED INSTRUCTIONS:
1. Content Analysis Phase

Read the entire provided content carefully and identify all major themes, concepts, and details
Map out relationships between different concepts and ideas
Note processes, methodologies, benefits, limitations, comparisons, and real-world applications
Identify both explicit information and implicit connections

2. Question Design Strategy
Create exactly 20 flashcards with diverse question types:

Definitional (3-4 cards): What is X? Define Y in the context of Z
Explanatory (4-5 cards): How does X work? Why does Y occur? Explain the process of Z
Comparative (2-3 cards): Compare X and Y. What are the differences between A and B?
Application (3-4 cards): How would you apply X in situation Y? What would happen if Z?
Analytical (3-4 cards): What are the implications of X? Why is Y significant? What factors influence Z?
Evaluative (2-3 cards): What are the advantages/disadvantages of X? When should you use Y over Z?

3. Answer Quality Requirements
Each answer must:

Provide comprehensive explanations with sufficient detail for deep understanding
Include relevant context and background information when necessary
Explain the "why" behind facts, not just the "what"
Use specific examples or scenarios when applicable
Connect concepts to broader themes or implications
Be self-contained (readable without referring back to the source material)

4. Technical Requirements

Each flashcard must have: id (number), question (string), answer (string)
Questions should be specific, unambiguous, and test meaningful understanding
Avoid overly simplistic yes/no questions or trivial details
Ensure comprehensive coverage across all major sections of the provided content
Questions should progressively build understanding from basic to advanced concepts

OUTPUT FORMAT:
You must output ONLY valid JSON in the following exact format. DO NOT use markdown code blocks, backticks, or any other formatting. Return ONLY the raw JSON array:
[
{
"id": 1,
"question": "[Example question testing core concept with comparative analysis]",
"answer": "[Comprehensive 3-6 sentence answer explaining the concept, its significance, how it works, and why it matters. Includes context, reasoning, and connections to broader themes.]"
},
{
"id": 2,
"question": "[Example question testing process or methodology understanding]",
"answer": "[Detailed explanation covering the process steps, underlying principles, effectiveness rationale, and practical implications. Self-contained with sufficient context for complete understanding.]"
}
]
QUALITY CHECKLIST:
Before finalizing, ensure each flashcard meets these criteria:

✓ Question tests meaningful understanding, not trivial recall
✓ Answer provides detailed explanation with reasoning
✓ Answer includes relevant context and implications
✓ Question and answer are clear and unambiguous
✓ Content accurately reflects the source material
✓ Covers different aspects and difficulty levels
✓ Answers are comprehensive enough for thorough learning

INPUT CONTENT TO ANALYZE:
${note.content}
Generate exactly 20 flashcards in the JSON format specified above. Focus on creating detailed, comprehensive answers that promote deep understanding. Output ONLY the JSON array, no other text, no markdown formatting, no code blocks, no backticks.
      `,
    });

    // Parse and validate the generated flashcards
    let cleanedText = result.text.trim();
    
    // Remove markdown code blocks if they exist
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const flashcardsData: FlashcardItem[] = JSON.parse(cleanedText);
    
    if (!Array.isArray(flashcardsData) || flashcardsData.length !== 20) {
      throw new Error('Invalid flashcard format or count');
    }

    // Save flashcards to database as a single record with JSON content
    const createdFlashcard = await prisma.flashcard.create({
      data: {
        noteId: noteId,
        content: flashcardsData as any, // Cast to any for JSON compatibility
        userId: userId || undefined
      }
    });

    const response: ApiSuccessResponse = {
      success: true,
      data: createdFlashcard,
      message: `Successfully generated ${flashcardsData.length} flashcards`
    };
    return NextResponse.json(response);

  } catch (error) {
    console.error('Flashcard generation error:', error);
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to generate flashcards',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Flashcard Generation API',
    endpoints: {
      POST: '/api/notes/generate-flashcards - Generate flashcards from note content',
    },
    parameters: {
      noteId: 'Note ID to generate flashcards from (required)',
    },
  });
}
