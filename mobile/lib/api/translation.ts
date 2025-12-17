import apiClient, { handleApiResponse, handleApiError } from './client';
import { NoteTranslation, TranslateNoteRequest, ApiResponse } from './types';

/**
 * Translation API Module
 * Handles all translation-related operations for notes
 */

// ==================== Supported Languages ====================

export const SUPPORTED_LANGUAGES = {
    en: 'English',
    es: 'Spanish (Español)',
    fr: 'French (Français)',
    de: 'German (Deutsch)',
    zh: 'Chinese (中文)',
    hi: 'Hindi (हिन्दी)',
    pt: 'Portuguese (Português)',
    ja: 'Japanese (日本語)',
    ko: 'Korean (한국어)',
    ar: 'Arabic (العربية)',
    ru: 'Russian (Русский)',
    it: 'Italian (Italiano)',
    nl: 'Dutch (Nederlands)',
    tr: 'Turkish (Türkçe)',
    id: 'Indonesian (Bahasa Indonesia)',
    bn: 'Bengali (বাংলা)',
    vi: 'Vietnamese (Tiếng Việt)',
    ta: 'Tamil (தமிழ்)',
    ur: 'Urdu (اردو)',
    fa: 'Persian (فارسی)',
    th: 'Thai (ไทย)',
    pl: 'Polish (Polski)',
    uk: 'Ukrainian (Українська)',
    sw: 'Swahili (Kiswahili)',
    ro: 'Romanian (Română)',
    el: 'Greek (Ελληνικά)',
    he: 'Hebrew (עברית)',
    cs: 'Czech (Čeština)',
    sv: 'Swedish (Svenska)',
    hu: 'Hungarian (Magyar)',
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

/**
 * Check if a language code is supported
 * @param language - Language code to check
 */
export const isSupportedLanguage = (language: string): language is LanguageCode => {
    return Object.keys(SUPPORTED_LANGUAGES).includes(language);
};

/**
 * Get language display name
 * @param language - Language code
 */
export const getLanguageName = (language: LanguageCode): string => {
    return SUPPORTED_LANGUAGES[language];
};

/**
 * Get list of available translation languages (excluding English)
 */
export const getAvailableTranslationLanguages = (): LanguageCode[] => {
    return Object.keys(SUPPORTED_LANGUAGES).filter(lang => lang !== 'en') as LanguageCode[];
};

// ==================== API Functions ====================

/**
 * Get translation for a note in a specific language
 * @param noteId - Note ID
 * @param language - Language code (e.g., 'es', 'fr', 'de')
 * @returns Translation if exists, throws error if not found
 */
export const getTranslation = async (noteId: string, language: string): Promise<NoteTranslation> => {
    try {
        const response = await apiClient.get<ApiResponse<NoteTranslation>>(
            `/notes/${noteId}/translate`,
            {
                params: { language },
            }
        );
        return handleApiResponse<NoteTranslation>(response);
    } catch (error) {
        return handleApiError(error);
    }
};

/**
 * Generate a new translation for a note
 * Uses AI to translate the note's title and content
 * @param noteId - Note ID
 * @param language - Language code to translate to
 * @returns Newly created translation
 */
export const translateNote = async (
    noteId: string,
    language: string
): Promise<NoteTranslation> => {
    try {
        // Use longer timeout for AI translation (120 seconds)
        const response = await apiClient.post<ApiResponse<NoteTranslation>>(
            `/notes/${noteId}/translate`,
            { language },
            { timeout: 120000 }
        );
        return handleApiResponse<NoteTranslation>(response);
    } catch (error) {
        return handleApiError(error);
    }
};

/**
 * Delete a specific translation for a note
 * @param noteId - Note ID
 * @param language - Language code to delete
 * @returns Deletion confirmation
 */
export const deleteTranslation = async (
    noteId: string,
    language: string
): Promise<{ deleted: boolean }> => {
    try {
        const response = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(
            `/notes/${noteId}/translate`,
            {
                params: { language },
            }
        );
        return handleApiResponse<{ deleted: boolean }>(response);
    } catch (error) {
        return handleApiError(error);
    }
};

// ==================== Helper Functions ====================

/**
 * Get or create translation (fetch if exists, generate if not)
 * @param noteId - Note ID
 * @param language - Language code
 * @returns Translation (existing or newly generated)
 */
export const getOrCreateTranslation = async (
    noteId: string,
    language: string
): Promise<NoteTranslation> => {
    try {
        // Try to fetch existing translation
        return await getTranslation(noteId, language);
    } catch (error: any) {
        // If 404 (not found), generate new translation
        if (error?.statusCode === 404 || error?.message?.includes('not found')) {
            console.log(`📝 Translation not found for ${language}, generating...`);
            return await translateNote(noteId, language);
        }
        // Re-throw other errors
        throw error;
    }
};

/**
 * Translate note to multiple languages
 * @param noteId - Note ID
 * @param languages - Array of language codes
 * @returns Array of translation results (successful and failed)
 */
export const translateNoteToMultipleLanguages = async (
    noteId: string,
    languages: string[]
): Promise<{
    successful: NoteTranslation[];
    failed: Array<{ language: string; error: string }>;
}> => {
    const successful: NoteTranslation[] = [];
    const failed: Array<{ language: string; error: string }> = [];

    for (const language of languages) {
        try {
            const translation = await translateNote(noteId, language);
            successful.push(translation);
            console.log(`✅ Translated to ${language}: ${translation.title}`);
        } catch (error: any) {
            const errorMessage = error?.message || 'Unknown error';
            failed.push({ language, error: errorMessage });
            console.error(`❌ Failed to translate to ${language}:`, errorMessage);
        }
    }

    return { successful, failed };
};

/**
 * Get all available translations for a note
 * @param noteId - Note ID
 * @param languagesToCheck - Optional array of languages to check (defaults to all)
 * @returns Array of available translations
 */
export const getAllTranslations = async (
    noteId: string,
    languagesToCheck?: string[]
): Promise<NoteTranslation[]> => {
    const languages = languagesToCheck || getAvailableTranslationLanguages();
    const translations: NoteTranslation[] = [];

    for (const language of languages) {
        try {
            const translation = await getTranslation(noteId, language);
            translations.push(translation);
        } catch (error) {
            // Translation doesn't exist, skip
            continue;
        }
    }

    return translations;
};

/**
 * Check which translations exist for a note
 * @param noteId - Note ID
 * @returns Object mapping language codes to existence status
 */
export const checkTranslationAvailability = async (
    noteId: string
): Promise<Record<string, boolean>> => {
    const languages = getAvailableTranslationLanguages();
    const availability: Record<string, boolean> = {};

    await Promise.all(
        languages.map(async (language) => {
            try {
                await getTranslation(noteId, language);
                availability[language] = true;
            } catch (error: any) {
                // 404 (not found) and 400 (bad request/unsupported) are expected
                // Silently mark as unavailable without logging
                availability[language] = false;
            }
        })
    );

    return availability;
};

// ==================== Exports ====================

export default {
    // Language utilities
    SUPPORTED_LANGUAGES,
    isSupportedLanguage,
    getLanguageName,
    getAvailableTranslationLanguages,

    // Core API functions
    getTranslation,
    translateNote,
    deleteTranslation,

    // Helper functions
    getOrCreateTranslation,
    translateNoteToMultipleLanguages,
    getAllTranslations,
    checkTranslationAvailability,
};
