/**
 * Background Translation Service
 * Automatically translates notes in the background for all supported languages
 */

import { prisma } from '@/lib/prisma';
import { aiGateway, AI_MODELS } from '@/lib/ai/gateway';
import { generateText } from 'ai';

// Supported languages (matching mobile app)
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  es: 'Spanish (Español)',
  hi: 'Hindi (हिन्दी)',
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

interface TranslationJob {
  noteId: string;
  targetLanguage: LanguageCode;
  title: string;
  content: string;
}

/**
 * Translate a note to a specific language
 */
async function translateNoteToLanguage(
  noteId: string,
  title: string,
  content: string,
  targetLanguage: LanguageCode
): Promise<void> {
  try {
    // Check if translation already exists
    const existingTranslation = await prisma.noteTranslation.findUnique({
      where: {
        noteId_language: {
          noteId,
          language: targetLanguage,
        },
      },
    });

    if (existingTranslation) {
      console.log(`✅ Translation already exists for note ${noteId} in ${targetLanguage}`);
      return;
    }

    const targetLanguageName = SUPPORTED_LANGUAGES[targetLanguage];
    const model = aiGateway(AI_MODELS.translation);

    console.log(`🔄 Translating note ${noteId} to ${targetLanguageName}...`);

    // Translate title
    const titleResult = await generateText({
      model,
      prompt: `Translate the following educational note title to ${targetLanguageName}. 
Maintain the professional, educational tone and keep it concise. 
Only return the translated title, no additional text or quotes.

Title to translate: ${title}

Translated title in ${targetLanguageName}:`,
    });

    // Translate content
    const contentResult = await generateText({
      model,
      prompt: `You are a professional translator specializing in educational content. 
Translate the following educational note from English to ${targetLanguageName}.

TRANSLATION REQUIREMENTS:
1. Maintain all markdown formatting (headers ##, lists, **bold**, *italic*, code blocks, etc.)
2. Keep the professional, educational tone
3. Preserve the document structure and hierarchy
4. Translate technical terms accurately while maintaining their meaning
5. Keep code examples, variable names, and technical identifiers unchanged
6. Maintain the same level of detail and explanation quality
7. Ensure cultural appropriateness for ${targetLanguageName} speakers
8. Keep links and URLs unchanged
9. Preserve all special formatting like blockquotes (>), tables, etc.

Content to translate:
${content}

Translated content in ${targetLanguageName} (maintain ALL markdown formatting):`,
    });

    const translatedTitle = titleResult.text.trim().replace(/^["'`]|["'`]$/g, '');
    const translatedContent = contentResult.text.trim();

    // Validate translations
    if (!translatedTitle || translatedTitle.length === 0) {
      throw new Error('Failed to generate valid title translation');
    }

    if (!translatedContent || translatedContent.length === 0) {
      throw new Error('Failed to generate valid content translation');
    }

    // Save translation
    await prisma.noteTranslation.create({
      data: {
        noteId,
        language: targetLanguage,
        title: translatedTitle,
        content: translatedContent,
      },
    });

    console.log(`✅ Successfully translated note ${noteId} to ${targetLanguageName}`);
  } catch (error) {
    console.error(`❌ Failed to translate note ${noteId} to ${targetLanguage}:`, error);
    // Don't throw - we want to continue with other translations
  }
}

/**
 * Translate a note to all supported languages in the background
 * Skips English (source language)
 */
export async function translateNoteToAllLanguages(
  noteId: string,
  title: string,
  content: string
): Promise<void> {
  const languages = Object.keys(SUPPORTED_LANGUAGES).filter(
    (lang) => lang !== 'en'
  ) as LanguageCode[];

  console.log(`🌍 Starting background translation for note ${noteId} to ${languages.length} languages`);

  // Translate to each language sequentially to avoid rate limits
  for (const language of languages) {
    await translateNoteToLanguage(noteId, title, content, language);
  }

  console.log(`🎉 Completed background translation for note ${noteId}`);
}

/**
 * Queue a translation job to run in the background
 * This is non-blocking and won't delay the API response
 */
export function queueBackgroundTranslation(
  noteId: string,
  title: string,
  content: string
): void {
  // Run translation in the background without waiting
  translateNoteToAllLanguages(noteId, title, content).catch((error) => {
    console.error(`Background translation failed for note ${noteId}:`, error);
  });
}
