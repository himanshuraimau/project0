import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuth } from '@/lib/auth-helper';
import { prisma } from '@/lib/prisma';
import { queueBackgroundTranslation } from '@/lib/translation-service';
import { ApiSuccessResponse, ApiErrorResponse } from '@/lib/types';

/**
 * POST /api/notes/translate-all
 * Manually trigger translation for all user's notes that don't have translations yet
 * This is useful for existing notes created before the background translation feature was added
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);

    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Unauthorized'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    console.log(`🌍 Starting bulk translation for user ${userId}`);

    // Get all notes for the user
    const notes = await prisma.note.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        content: true,
        translations: {
          select: {
            language: true,
          },
        },
      },
    });

    console.log(`📚 Found ${notes.length} notes for user`);

    let queuedCount = 0;
    let skippedCount = 0;

    // Queue translation for each note that doesn't have translations
    for (const note of notes) {
      // Check if note already has translations for es and hi
      const existingLanguages = note.translations.map(t => t.language);
      const needsTranslation = !existingLanguages.includes('es') || !existingLanguages.includes('hi');

      if (needsTranslation) {
        console.log(`🔄 Queueing translation for note: ${note.id} - "${note.title}"`);
        queueBackgroundTranslation(note.id, note.title, note.content);
        queuedCount++;
      } else {
        console.log(`✅ Note ${note.id} already has translations, skipping`);
        skippedCount++;
      }
    }

    const response: ApiSuccessResponse = {
      success: true,
      data: {
        totalNotes: notes.length,
        queuedForTranslation: queuedCount,
        alreadyTranslated: skippedCount,
        message: `Queued ${queuedCount} notes for background translation. This will take approximately ${queuedCount * 60} seconds.`
      },
    };

    console.log(`✅ Bulk translation queued: ${queuedCount} notes`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in translate-all API:', error);
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to queue translations',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Bulk Translation API',
    description: 'Triggers background translation for all user notes that are not yet translated',
    endpoint: 'POST /api/notes/translate-all',
    note: 'This will queue all untranslated notes for background translation to Spanish and Hindi',
  });
}
