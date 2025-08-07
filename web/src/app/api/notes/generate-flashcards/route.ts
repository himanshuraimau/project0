import { NextRequest, NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

const model = google('models/gemini-1.5-flash-latest');

interface Flashcard {
  id: number;
  question: string;
  answer: string;
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

    // Check if flashcards already exist for this note
    const existingFlashcard = await prisma.flashcard.findUnique({
      where: { noteId }
    });

    if (existingFlashcard) {
      return NextResponse.json({
        success: true,
        data: existingFlashcard,
        message: 'Flashcards already exist for this note'
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

    // Generate flashcards using AI
    const result = await generateText({
      model,
      prompt: `
        You are an expert educational content creator and flashcard designer. I will provide you with a structured document summary, and your task is to analyze the content and create exactly 20 high-quality flashcards that test understanding of the key concepts, facts, and details.

        Your flashcards should:
        - Cover the most important concepts, definitions, processes, and facts from the content
        - Range from basic recall questions to more complex understanding and application questions
        - Be clear, concise, and unambiguous
        - Have answers that are complete but not overly lengthy
        - Test different aspects of the material (definitions, comparisons, processes, benefits, etc.)

        INSTRUCTIONS:
        1. Carefully read and analyze the entire provided content
        2. Identify the 20 most important concepts, facts, or details that should be tested
        3. Create exactly 20 flashcards in strict JSON format
        4. Each flashcard must have: id (number), question (string), answer (string)
        5. Questions should be diverse in type: definitions, comparisons, explanations, benefits, processes, etc.
        6. Answers should be comprehensive but concise (1-3 sentences typically)

        OUTPUT FORMAT:
        You must output ONLY valid JSON in the following exact format. DO NOT use markdown code blocks, backticks, or any other formatting. Return ONLY the raw JSON array:

        [
          {
            "id": 1,
            "question": "What is the main architectural innovation of the Transformer model?",
            "answer": "The Transformer uses only attention mechanisms, eliminating recurrence and convolutions entirely, which allows for better parallelization during training."
          },
          {
            "id": 2,
            "question": "How does the Transformer handle positional information without recurrence?",
            "answer": "The Transformer adds positional encodings using sine and cosine functions with different frequencies to the input embeddings to provide information about token order."
          }
        ]

        QUALITY REQUIREMENTS:
        - Questions must be specific and testable
        - Avoid overly simple yes/no questions
        - Include questions about key technical details, processes, benefits, and comparisons
        - Ensure answers are factually accurate based on the provided content
        - Cover different sections/topics from the material
        - Questions should test both recall and understanding

        INPUT CONTENT TO ANALYZE:
        ${note.content}

        Generate exactly 20 flashcards in the JSON format specified above. Output ONLY the JSON array, no other text, no markdown formatting, no code blocks, no backticks.
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
    
    const flashcardsData: Flashcard[] = JSON.parse(cleanedText);
    
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

    return NextResponse.json({
      success: true,
      data: createdFlashcard,
      message: `Successfully generated ${flashcardsData.length} flashcards`
    });

  } catch (error) {
    console.error('Flashcard generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate flashcards',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
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
