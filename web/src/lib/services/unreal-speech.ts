/**
 * Unreal Speech API v8 Service
 * Text-to-voice using Unreal Speech v8 API
 * Documentation: https://docs.unrealspeech.com
 */

interface SpeechOptions {
    Text: string;
    VoiceId: string;
    Bitrate?: string;      // 16k, 32k, 48k, 64k, 128k, 192k, 256k, 320k (default: 192k)
    Speed?: number;        // -1.0 to 1.0 (default: 0)
    Pitch?: number;        
    TimestampType?: string; // 'word' or 'sentence' (default: 'sentence')
}

interface SpeechResponse {
    CreationTime: string;
    OutputUri: string;
    RequestCharacters: number;
    TaskId: string;
    TaskStatus: string;
    TimestampsUri?: string;
    VoiceId: string;
}

const UNREAL_SPEECH_API_URL = 'https://api.v8.unrealspeech.com';

export class UnrealSpeechService {
    private apiKey: string;

    constructor() {
        const apiKey = process.env.UNREAL_SPEECH_API_KEY;
        if (!apiKey) {
            throw new Error('UNREAL_SPEECH_API_KEY environment variable is not set');
        }
        this.apiKey = apiKey;
    }

    private getHeaders(): HeadersInit {
        return {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
        };
    }

    /**
     * Generate speech from text using the /speech endpoint
     * Best for text up to 3,000 characters
     * Returns URLs to audio file and timestamps
     */
    async generateSpeech(text: string, options?: Partial<SpeechOptions>): Promise<SpeechResponse> {
        // Validate text length
        if (!text || text.trim().length === 0) {
            throw new Error('Text cannot be empty');
        }

        if (text.length > 3000) {
            throw new Error(`Text exceeds 3,000 character limit (got ${text.length} characters)`);
        }

        const requestBody: SpeechOptions = {
            Text: text,
            VoiceId: options?.VoiceId || 'Noah',
            Bitrate: options?.Bitrate || '192k',
            Speed: options?.Speed ?? 0,
            Pitch: options?.Pitch ?? 1.0,
            TimestampType: options?.TimestampType || 'sentence',
        };

        console.log('Unreal Speech Request:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(`${UNREAL_SPEECH_API_URL}/speech`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Unreal Speech API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data as SpeechResponse;
    }

    /**
     * Download audio from Unreal Speech URL and return as Buffer
     */
    async downloadAudio(audioUrl: string): Promise<Buffer> {
        const response = await fetch(audioUrl);

        if (!response.ok) {
            throw new Error(`Failed to download audio: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    /**
     * Generate speech and download the audio buffer
     * Convenience method that combines generateSpeech + downloadAudio
     */
    async generateAndDownloadAudio(
        text: string,
        options?: Partial<SpeechOptions>
    ): Promise<{ audioBuffer: Buffer; audioUrl: string; response: SpeechResponse }> {
        const result = await this.generateSpeech(text, options);
        const audioBuffer = await this.downloadAudio(result.OutputUri);

        return {
            audioBuffer,
            audioUrl: result.OutputUri,
            response: result,
        };
    }
}

// Export singleton instance
let unrealSpeechServiceInstance: UnrealSpeechService | null = null;

export function getUnrealSpeechService(): UnrealSpeechService {
    if (!unrealSpeechServiceInstance) {
        unrealSpeechServiceInstance = new UnrealSpeechService();
    }
    return unrealSpeechServiceInstance;
}
