import { notesApi } from '@/lib/api';
import { Note } from '@/lib/api/types';

/**
 * Note Translation Service
 * Handles bulk translation of notes when user changes language
 */

export interface TranslationProgress {
  total: number;
  completed: number;
  failed: number;
  currentNote?: string;
}

export interface TranslationResult {
  success: boolean;
  totalNotes: number;
  translatedCount: number;
  failedCount: number;
  errors: Array<{ noteId: string; title: string; error: string }>;
}

/**
 * Translate all user notes to a specific language
 * @param targetLanguage - Language code to translate to (e.g., 'es', 'hi', 'en')
 * @param onProgress - Optional callback to track translation progress
 * @returns Translation result with success status and statistics
 */
export const translateAllNotes = async (
  targetLanguage: string,
  onProgress?: (progress: TranslationProgress) => void
): Promise<TranslationResult> => {
  const result: TranslationResult = {
    success: false,
    totalNotes: 0,
    translatedCount: 0,
    failedCount: 0,
    errors: [],
  };

  try {
    // Fetch all user notes
    console.log('🔄 Fetching all notes for translation...');
    const notes = await notesApi.getNotes();
    
    if (!notes || notes.length === 0) {
      console.log('ℹ️ No notes found to translate');
      result.success = true;
      return result;
    }

    result.totalNotes = notes.length;
    console.log(`📚 Found ${notes.length} notes to translate to ${targetLanguage}`);

    // Translate each note
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      
      try {
        // Notify progress
        if (onProgress) {
          onProgress({
            total: notes.length,
            completed: i,
            failed: result.failedCount,
            currentNote: note.title,
          });
        }

        console.log(`🔄 Translating note ${i + 1}/${notes.length}: "${note.title}"`);
        
        // Translate the note
        await notesApi.translateNote(note.id, { language: targetLanguage });
        
        result.translatedCount++;
        console.log(`✅ Successfully translated: "${note.title}"`);
        
      } catch (error: any) {
        result.failedCount++;
        const errorMessage = error.message || 'Unknown error';
        
        console.error(`❌ Failed to translate note "${note.title}":`, errorMessage);
        result.errors.push({
          noteId: note.id,
          title: note.title,
          error: errorMessage,
        });
        
        // Continue with next note even if one fails
        continue;
      }
    }

    // Final progress update
    if (onProgress) {
      onProgress({
        total: notes.length,
        completed: notes.length,
        failed: result.failedCount,
      });
    }

    // Consider success if at least 50% of notes were translated
    result.success = result.translatedCount >= notes.length * 0.5;

    console.log('📊 Translation Summary:');
    console.log(`   Total: ${result.totalNotes}`);
    console.log(`   Translated: ${result.translatedCount}`);
    console.log(`   Failed: ${result.failedCount}`);

    return result;
  } catch (error: any) {
    console.error('❌ Critical error during translation:', error);
    result.errors.push({
      noteId: 'SYSTEM',
      title: 'System Error',
      error: error.message || 'Failed to fetch notes',
    });
    return result;
  }
};

/**
 * Check if a note has translation for a specific language
 * @param noteId - The note ID to check
 * @param language - The language code to check
 * @returns True if translation exists, false otherwise
 */
export const hasTranslation = async (
  noteId: string,
  language: string
): Promise<boolean> => {
  try {
    await notesApi.getTranslation(noteId, language);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get translation for a note in a specific language, or return original if not available
 * @param note - The original note
 * @param language - The target language code
 * @returns Translated note or original note
 */
export const getTranslatedOrOriginal = async (
  note: Note,
  language: string
): Promise<{ title: string; content: string; isTranslated: boolean }> => {
  try {
    const translation = await notesApi.getTranslation(note.id, language);
    return {
      title: translation.title,
      content: translation.content,
      isTranslated: true,
    };
  } catch (error) {
    // Return original if translation doesn't exist
    return {
      title: note.title,
      content: note.content,
      isTranslated: false,
    };
  }
};

/**
 * Delete all translations for a specific language
 * @param language - The language code to delete translations for
 * @returns Number of translations deleted
 */
export const deleteAllTranslations = async (language: string): Promise<number> => {
  try {
    const notes = await notesApi.getNotes();
    let deletedCount = 0;

    for (const note of notes) {
      try {
        const hasTranslated = await hasTranslation(note.id, language);
        if (hasTranslated) {
          await notesApi.deleteTranslation(note.id, language);
          deletedCount++;
        }
      } catch (error) {
        console.error(`Failed to delete translation for note ${note.id}:`, error);
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('Failed to delete translations:', error);
    return 0;
  }
};
