import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/services/prisma';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { ApiSuccessResponse, ApiErrorResponse } from '@/lib/types';

const SUPPORTED_LANGUAGES = {
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  zh: 'Chinese (Simplified)',
  hi: 'Hindi'
} as const;

type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

interface TranslateRequestBody {
  language: string;
}

interface TranslationResult {
  id: string;
  noteId: string;
  language: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// GET /api/notes/[id]/translate?language=es - Get translation for a specific language
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id: noteId } = await params;
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language');

    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Unauthorized'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    if (!language) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Language parameter is required'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!Object.keys(SUPPORTED_LANGUAGES).includes(language)) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: `Language '${language}' is not supported. Supported languages: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Verify note exists and belongs to user
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: { id: true, userId: true }
    });

    if (!note) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Note not found'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    if (note.userId && note.userId !== userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Unauthorized access to this note'
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    // Check if translation already exists
    const existingTranslation = await prisma.noteTranslation.findUnique({
      where: {
        noteId_language: {
          noteId,
          language
        }
      }
    });

    if (existingTranslation) {
      const response: ApiSuccessResponse = {
        success: true,
        data: existingTranslation
      };
      return NextResponse.json(response);
    }

    // Translation doesn't exist
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Translation not found. Please generate it first using POST method.'
    };
    return NextResponse.json(errorResponse, { status: 404 });

  } catch (error) {
    console.error('Error fetching translation:', error);
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to fetch translation',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// POST /api/notes/[id]/translate - Generate translation for a note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id: noteId } = await params;
    const body: TranslateRequestBody = await request.json();
    const { language } = body;

    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Unauthorized'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    if (!language) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Language is required'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!Object.keys(SUPPORTED_LANGUAGES).includes(language)) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: `Language '${language}' is not supported. Supported languages: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Fetch the note with full content
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: {
        id: true,
        title: true,
        content: true,
        userId: true
      }
    });

    if (!note) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Note not found'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    if (note.userId && note.userId !== userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Unauthorized access to this note'
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    // Check if translation already exists
    const existingTranslation = await prisma.noteTranslation.findUnique({
      where: {
        noteId_language: {
          noteId,
          language
        }
      }
    });

    if (existingTranslation) {
      const response: ApiSuccessResponse = {
        success: true,
        data: existingTranslation,
        message: 'Translation already exists'
      };
      return NextResponse.json(response);
    }

    // Generate translation using OpenAI
    const targetLanguage = SUPPORTED_LANGUAGES[language as LanguageCode];
    const model = openai('gpt-4o');

    // Translate the title
    const titleResult = await generateText({
      model,
      prompt: `Translate the following educational note title to ${targetLanguage}. 
Maintain the professional, educational tone and keep it concise. 
Only return the translated title, no additional text or quotes.

Title to translate: ${note.title}

Translated title in ${targetLanguage}:`
    });

    // Translate the content
    const contentResult = await generateText({
      model,
      prompt: `You are a professional translator specializing in educational content. 
Translate the following educational note from English to ${targetLanguage}.

TRANSLATION REQUIREMENTS:
1. Maintain all markdown formatting (headers ##, lists, **bold**, *italic*, code blocks, etc.)
2. Keep the professional, educational tone
3. Preserve the document structure and hierarchy
4. Translate technical terms accurately while maintaining their meaning
5. Keep code examples, variable names, and technical identifiers unchanged
6. Maintain the same level of detail and explanation quality
7. Ensure cultural appropriateness for ${targetLanguage} speakers
8. Keep links and URLs unchanged
9. Preserve all special formatting like blockquotes (>), tables, etc.

Content to translate:
${note.content}

Translated content in ${targetLanguage} (maintain ALL markdown formatting):`
    });

    const translatedTitle = titleResult.text.trim().replace(/^["'`]|["'`]$/g, '');
    const translatedContent = contentResult.text.trim();

    // Validate that we got meaningful translations
    if (!translatedTitle || translatedTitle.length === 0) {
      throw new Error('Failed to generate valid title translation');
    }

    if (!translatedContent || translatedContent.length === 0) {
      throw new Error('Failed to generate valid content translation');
    }

    // Save the translation
    const translation = await prisma.noteTranslation.create({
      data: {
        noteId,
        language,
        title: translatedTitle,
        content: translatedContent
      }
    });

    const response: ApiSuccessResponse = {
      success: true,
      data: translation,
      message: `Note successfully translated to ${targetLanguage}`
    };
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error generating translation:', error);
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to generate translation',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// DELETE /api/notes/[id]/translate?language=es - Delete a specific translation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id: noteId } = await params;
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language');

    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Unauthorized'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    if (!language) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Language parameter is required'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Verify note exists and belongs to user
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: { id: true, userId: true }
    });

    if (!note) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Note not found'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    if (note.userId && note.userId !== userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Unauthorized access to this note'
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    // Delete the translation
    await prisma.noteTranslation.delete({
      where: {
        noteId_language: {
          noteId,
          language
        }
      }
    });

    const response: ApiSuccessResponse = {
      success: true,
      data: { deleted: true },
      message: 'Translation deleted successfully'
    };
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error deleting translation:', error);
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to delete translation',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
