import { Voice, VoiceSettings } from './types/podcast.types';
import { podcastErrorHandler } from './utils/podcast-error-handler';

/**
 * Service for interacting with ElevenLabs API through backend routes
 * Handles voice listing, text-to-speech generation, and voice previews
 */
export class ElevenLabsService {
  private readonly defaultVoiceSettings: VoiceSettings = {
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0.0,
    useSpeakerBoost: true
  };

  constructor() {
    // No API key needed in frontend - handled by backend routes
  }

  /**
   * Get available voices for a specific language
   */
  async getVoices(language: string = 'en'): Promise<Voice[]> {
    try {
      const response = await fetch(`/api/voices?language=${encodeURIComponent(language)}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch voices');
      }

      return data.voices || [];
    } catch (error) {
      throw new Error(`Failed to fetch voices for language: ${language} - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate audio from text using specified voice (backend only)
   * This method should only be called from backend API routes
   */
  async textToSpeech(
    text: string,
    voiceId: string,
    settings: Partial<VoiceSettings> = {}
  ): Promise<Buffer> {
    throw new Error('textToSpeech should only be called from backend API routes. Use /api/tts endpoint instead.');
  }

  /**
   * Get voice preview sample
   */
  async getVoicePreview(voiceId: string): Promise<Buffer> {
    try {
      if (!voiceId) {
        throw new Error('Voice ID is required for preview');
      }

      const response = await fetch(`/api/voices/${encodeURIComponent(voiceId)}/preview`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      throw new Error(`Failed to get voice preview for ${voiceId} - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get voice details including metadata
   */
  async getVoiceDetails(voiceId: string): Promise<Voice> {
    try {
      const response = await fetch(`/api/voices/${encodeURIComponent(voiceId)}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch voice details');
      }

      return data.voice;
    } catch (error) {
      throw new Error(`Failed to get voice details for ${voiceId} - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check API quota and usage (backend only)
   */
  async getUsageInfo(): Promise<{ charactersUsed: number; charactersLimit: number }> {
    try {
      const response = await fetch('/api/voices/usage');

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.usage || { charactersUsed: 0, charactersLimit: 0 };
    } catch (error) {
      // Don't throw for usage info failures, just log and return defaults
      podcastErrorHandler.logError(error as Error, 'Failed to get ElevenLabs usage info');
      return { charactersUsed: 0, charactersLimit: 0 };
    }
  }

  /**
   * Validate voice settings
   */
  validateVoiceSettings(settings: Partial<VoiceSettings>): VoiceSettings {
    const validated: VoiceSettings = { ...this.defaultVoiceSettings };

    if (settings.stability !== undefined) {
      validated.stability = Math.max(0, Math.min(1, settings.stability));
    }

    if (settings.similarityBoost !== undefined) {
      validated.similarityBoost = Math.max(0, Math.min(1, settings.similarityBoost));
    }

    if (settings.style !== undefined) {
      validated.style = Math.max(0, Math.min(1, settings.style));
    }

    if (settings.useSpeakerBoost !== undefined) {
      validated.useSpeakerBoost = settings.useSpeakerBoost;
    }

    return validated;
  }


}

// Export singleton instance
export const elevenLabsService = new ElevenLabsService();