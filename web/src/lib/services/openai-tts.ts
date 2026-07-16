/**
 * TTS Service
 * Text-to-speech using gpt-4o-mini-tts via the Vercel AI Gateway.
 */

import { openaiAudio, AI_MODELS } from '@/lib/ai/gateway';

interface TTSOptions {
    voice?: 'alloy' | 'ash' | 'coral' | 'echo' | 'fable' | 'onyx' | 'nova' | 'sage' | 'shimmer';
    instructions?: string;
    speed?: number;
    responseFormat?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm';
}

/**
 * Generate speech audio from text using gpt-4o-mini-tts
 * @param text - Text to convert (max 4096 chars)
 * @param options - Voice, instructions, speed, format
 * @returns Buffer of audio data
 */
export async function generateSpeechAudio(
    text: string,
    options: TTSOptions = {}
): Promise<Buffer> {
    if (!text || text.trim().length === 0) {
        throw new Error('Text cannot be empty');
    }

    if (text.length > 4096) {
        throw new Error(`Text exceeds 4,096 character limit (got ${text.length} characters)`);
    }

    const response = await openaiAudio.audio.speech.create({
        model: AI_MODELS.tts,
        input: text,
        voice: options.voice || 'coral',
        instructions: options.instructions || 'Speak in a warm, clear, and engaging tone like a podcast narrator. Pace yourself naturally with slight pauses between topics.',
        response_format: options.responseFormat || 'mp3',
        speed: options.speed ?? 1.0,
    });

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}
