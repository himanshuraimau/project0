import { NextRequest, NextResponse } from 'next/server';
import { aiGateway, AI_MODELS } from '@/lib/ai/gateway';
import { generateText } from 'ai';
import { prisma } from '@/lib/prisma';
import { getUserFromAuth } from '@/lib/auth-helper';
import { ApiSuccessResponse, ApiErrorResponse, FlashcardItem, GenerateFlashcardRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);
    const body: GenerateFlashcardRequest = await request.json();
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

    // Flashcards are now free once content exists - no credit check needed

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
      model: aiGateway(AI_MODELS.quiz),
      prompt: `
MASTER FLASHCARD CREATOR & LEARNING SPECIALIST

You are the ultimate flashcard designer! Your mission is to transform educational content into engaging, comprehensive, and powerful study materials optimized for rapid recall and active retrieval practice.

YOUR CHALLENGE: Create exactly 20 brilliant flashcards that thoroughly test understanding through concise, focused questions and answers!

FLASHCARD EXCELLENCE GOALS:
- Cover most important concepts, definitions, processes, and relationships
- Range from foundational recall to complex analytical questions
- Be crystal clear, specific, and unambiguous
- Provide concise, focused answers (ONE WORD or ONE SENTENCE maximum)
- Test different cognitive levels: knowledge, comprehension, application, analysis, evaluation
- Ensure answers are specific and directly address the question

CONTENT ANALYSIS STRATEGY:

Phase 1 - Deep Content Mining
- Read entire content carefully and identify all major themes
- Map relationships between different concepts and ideas  
- Note processes, methodologies, benefits, limitations, comparisons
- Identify both explicit information and implicit connections

Phase 2 - Strategic Question Design

Create exactly 20 flashcards with diverse types:
- Definitional (4-5 cards): What is X? Define Y. Key term for Z?
- Explanatory (3-4 cards): What does X do? Main purpose of Y? Primary function of Z?
- Comparative (2-3 cards): Key difference between X and Y? Main advantage of A over B?
- Application (3-4 cards): What happens when X? Result of Y? Outcome of Z?
- Analytical (3-4 cards): Main reason for X? Primary factor in Y? Core principle of Z?
- Evaluative (2-3 cards): Primary benefit of X? Main limitation of Y? Best use case for Z?

ANSWER EXCELLENCE REQUIREMENTS:

Each answer MUST:
- Be EXACTLY one word OR one complete sentence (maximum 20 words)
- Directly and precisely answer the question asked
- Be specific and factually accurate
- Avoid unnecessary elaboration or context
- Stand alone as a clear, unambiguous response
- Focus on the essential information only

TECHNICAL SPECIFICATIONS:

Requirements:
- Each flashcard: id (number), question (string), answer (string)
- Questions: specific, unambiguous, designed for concise answers
- Answers: ONE WORD or ONE SENTENCE (max 20 words) only
- Ensure comprehensive coverage across all major sections
- Progressive difficulty from basic to advanced concepts

CRITICAL OUTPUT FORMAT:
Return ONLY valid JSON in this EXACT format. NO markdown, NO code blocks, NO backticks:

[
{
"id": 1,
"question": "[Focused question requiring one-word or one-sentence answer]",
"answer": "[Single word or single sentence answer, maximum 20 words]"
},
{
"id": 2,
"question": "[Specific question with clear, concise answer]",
"answer": "[Direct one-word or one-sentence response]"
}
]

QUALITY EXCELLENCE CHECKLIST:

Before finalizing, ensure each flashcard:
- Tests meaningful understanding through focused recall
- Answer is EXACTLY one word or one sentence (max 20 words)
- Question is phrased to elicit concise response
- Answer directly addresses the question
- Content accurately reflects source material
- Covers different aspects and difficulty levels
- Answer is specific and unambiguous

INPUT CONTENT TO TRANSFORM:
${note.content}

Generate exactly 20 amazing flashcards in JSON format! Focus on creating precise, concise answers of ONE WORD or ONE SENTENCE only. Output ONLY the JSON array - no extra text, no markdown, no code blocks!
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
        content: flashcardsData as object, // Cast to object for JSON compatibility
        userId: userId || undefined
      }
    });

    // Flashcards are now free - no credit deduction

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

export async function GET(request: NextRequest) {
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
