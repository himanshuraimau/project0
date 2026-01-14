/**
 * Transcript Generator Service
 * Converts note content into a voice-friendly script for TTS
 */

import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const MAX_OUTPUT_CHARS = 2800; // Leave buffer for 3000 char limit

const SYSTEM_PROMPT = `You are a professional narrator script writer. Your task is to convert study notes into a clear, engaging narration script.

RULES:
1. Write in first person as a single narrator explaining the content
2. NO dialogue, NO guest speakers, NO "Host:" or "Guest:" labels
3. Use natural spoken language, not written text style
4. Break up long sentences for easier listening
5. Add brief transitions between topics (e.g., "Moving on to...", "Now let's discuss...")
6. Remove bullet points, numbered lists - convert to flowing prose
7. Keep technical terms but explain them briefly when first introduced
8. The output MUST be under ${MAX_OUTPUT_CHARS} characters
9. Focus on the most important concepts if the content is long
10. Start with a brief introduction and end with a summary

OUTPUT FORMAT:
Just the narration script text, ready to be read aloud. No titles, no section headers, no formatting.`;

export interface TranscriptResult {
    transcript: string;
    wordCount: number;
    estimatedDurationSeconds: number;
}

/**
 * Generate a voice-friendly transcript from note content
 * @param noteContent - The raw note content to convert
 * @param noteTitle - Optional note title for context
 * @returns TranscriptResult with the generated script
 */
export async function generateVoiceTranscript(
    noteContent: string,
    noteTitle?: string
): Promise<TranscriptResult> {
    if (!noteContent || noteContent.trim().length === 0) {
        throw new Error('Note content cannot be empty');
    }

    const userPrompt = noteTitle
        ? `Convert the following notes titled "${noteTitle}" into a narration script:\n\n${noteContent}`
        : `Convert the following notes into a narration script:\n\n${noteContent}`;

    const { text } = await generateText({
        model: openai('gpt-5.1'),
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
        maxOutputTokens: 1500,
    });

    // Ensure we don't exceed character limit
    let transcript = text.trim();
    if (transcript.length > MAX_OUTPUT_CHARS) {
        // Truncate at last complete sentence
        const truncated = transcript.substring(0, MAX_OUTPUT_CHARS);
        const lastSentenceEnd = Math.max(
            truncated.lastIndexOf('.'),
            truncated.lastIndexOf('!'),
            truncated.lastIndexOf('?')
        );
        transcript = lastSentenceEnd > 0
            ? truncated.substring(0, lastSentenceEnd + 1)
            : truncated;
    }

    const wordCount = transcript.split(/\s+/).length;
    // Average speaking rate: 150 words per minute
    const estimatedDurationSeconds = Math.round((wordCount / 150) * 60);

    return {
        transcript,
        wordCount,
        estimatedDurationSeconds,
    };
}
