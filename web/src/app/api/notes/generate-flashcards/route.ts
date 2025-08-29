import { NextRequest, NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { prisma } from '@/lib/prisma';
import { UserService } from '@/lib/user-service';
import { auth } from '@clerk/nextjs/server';
import { ApiSuccessResponse, ApiErrorResponse, FlashcardItem, GenerateFlashcardRequest } from '@/lib/types';

const model = google('models/gemini-1.5-flash-latest');

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
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
      model,
      prompt: `
🎯 **MASTER FLASHCARD CREATOR & LEARNING SPECIALIST** 📚

You are the ultimate flashcard designer! Your mission is to transform educational content into engaging, comprehensive, and powerful study materials that make learning both effective and enjoyable. 

✨ **YOUR CHALLENGE:** Create exactly 20 brilliant flashcards that thoroughly test understanding and promote deep learning mastery!

🧠 **FLASHCARD EXCELLENCE GOALS:**
- 🎯 Cover most important concepts, definitions, processes, and relationships
- 📈 Range from foundational recall to complex analytical questions
- 🔍 Be crystal clear, specific, and unambiguous
- 📖 Provide detailed, comprehensive answers (3-6 sentences typically)
- 🧩 Test different cognitive levels: knowledge, comprehension, application, analysis, evaluation
- 🔗 Include context and reasoning, not just bare facts

🎪 **CONTENT ANALYSIS STRATEGY:**

**Phase 1 - Deep Content Mining 🔍**
- 📚 Read entire content carefully and identify all major themes
- 🔗 Map relationships between different concepts and ideas  
- 📋 Note processes, methodologies, benefits, limitations, comparisons
- 🌍 Identify both explicit information and implicit connections

**Phase 2 - Strategic Question Design 🎯**

Create exactly 20 flashcards with diverse types:
- 📝 **Definitional (3-4 cards):** What is X? Define Y in context of Z
- 💡 **Explanatory (4-5 cards):** How does X work? Why does Y occur? Explain process of Z
- ⚖️ **Comparative (2-3 cards):** Compare X and Y. Differences between A and B?
- 🛠️ **Application (3-4 cards):** Apply X in situation Y. What happens if Z?
- 🧠 **Analytical (3-4 cards):** Implications of X? Why is Y significant? Factors influencing Z?
- 🎭 **Evaluative (2-3 cards):** Advantages/disadvantages of X? When use Y over Z?

🌟 **ANSWER EXCELLENCE REQUIREMENTS:**

Each answer MUST:
- 📚 Provide comprehensive explanations with sufficient detail
- 🌍 Include relevant context and background when necessary
- 🤔 Explain the "why" behind facts, not just "what"
- 📖 Use specific examples or scenarios when applicable
- 🔗 Connect concepts to broader themes and implications
- 💪 Be self-contained (readable without source material)

🎯 **TECHNICAL SPECIFICATIONS:**

**Requirements:**
- 🆔 Each flashcard: id (number), question (string), answer (string)
- ❓ Questions: specific, unambiguous, test meaningful understanding
- 🚫 Avoid overly simplistic yes/no or trivial details
- 📋 Ensure comprehensive coverage across all major sections
- 📈 Progressive difficulty from basic to advanced concepts

⚠️ **CRITICAL OUTPUT FORMAT:**
Return ONLY valid JSON in this EXACT format. NO markdown, NO code blocks, NO backticks:

[
{
"id": 1,
"question": "[Engaging question testing core concept with depth 🎯]",
"answer": "[Comprehensive 3-6 sentence answer explaining concept, significance, how it works, and why it matters. Includes context, reasoning, and connections 📚]"
},
{
"id": 2,
"question": "[Question testing process/methodology understanding 🔍]",
"answer": "[Detailed explanation covering process steps, principles, effectiveness rationale, and practical implications. Self-contained with complete context 💡]"
}
]

✅ **QUALITY EXCELLENCE CHECKLIST:**

Before finalizing, ensure each flashcard:
- 🧠 Tests meaningful understanding, not trivial recall
- 📖 Answer provides detailed explanation with reasoning
- 🌍 Answer includes relevant context and implications
- 🔍 Question and answer are clear and unambiguous
- ✅ Content accurately reflects source material
- 📊 Covers different aspects and difficulty levels
- 📚 Answers comprehensive enough for thorough learning

🎓 **INPUT CONTENT TO TRANSFORM:**
${note.content}

🎪 Generate exactly 20 amazing flashcards in JSON format! Focus on creating detailed, comprehensive answers that promote deep understanding. Output ONLY the JSON array - no extra text, no markdown, no code blocks! 🚀
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
