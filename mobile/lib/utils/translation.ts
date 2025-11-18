import { Note, NoteTranslation } from '@/lib/api/types';
import { getCurrentLanguage } from '@/lib/i18n/i18n';

/**
 * Get the translated title and content for a note based on current language
 * Falls back to original content if translation doesn't exist
 * @param note - The note object with optional translations array
 * @returns Object with title and content (either translated or original)
 */
export function getTranslatedNote(note: Note): { title: string; content: string } {
  const currentLanguage = getCurrentLanguage();
  
  console.log('🔍 getTranslatedNote called:');
  console.log('   Current language:', currentLanguage);
  console.log('   Note ID:', note.id);
  console.log('   Note title:', note.title);
  console.log('   Has translations?', !!note.translations);
  console.log('   Translations count:', note.translations?.length || 0);
  if (note.translations && note.translations.length > 0) {
    console.log('   Available languages:', note.translations.map(t => t.language).join(', '));
  }
  
  // If current language is English or no translations exist, return original
  if (currentLanguage === 'en' || !note.translations || note.translations.length === 0) {
    console.log('   ➡️ Returning original (English)');
    return {
      title: note.title,
      content: note.content,
    };
  }
  
  // Find translation for current language
  const translation = note.translations.find(
    (t) => t.language === currentLanguage
  );
  
  // If translation exists, return it; otherwise return original
  if (translation) {
    console.log('   ✅ Translation found! Returning translated version');
    console.log('   Translated title:', translation.title);
    return {
      title: translation.title,
      content: translation.content,
    };
  }
  
  console.log('   ⚠️ Translation not found for', currentLanguage, '- Returning original');
  return {
    title: note.title,
    content: note.content,
  };
}

/**
 * Check if a note has been translated to a specific language
 * @param note - The note object
 * @param language - Language code to check (e.g., 'es', 'hi')
 * @returns True if translation exists, false otherwise
 */
export function hasTranslation(note: Note, language: string): boolean {
  if (!note.translations || note.translations.length === 0) {
    return false;
  }
  
  return note.translations.some((t) => t.language === language);
}

/**
 * Get all available languages for a note
 * @param note - The note object
 * @returns Array of language codes
 */
export function getAvailableLanguages(note: Note): string[] {
  if (!note.translations || note.translations.length === 0) {
    return ['en']; // Original language
  }
  
  const languages = note.translations.map((t) => t.language);
  return ['en', ...languages]; // Include original language
}
