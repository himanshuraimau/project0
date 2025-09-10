import { Voice, VoiceSettings, PodcastGenerationError } from './types/podcast.types';
import { podcastErrorHandler } from './utils/podcast-error-handler';
import { podcastCacheService } from './utils/podcast-cache-service';
import { performanceMonitor } from './utils/simple-performance-monitor';

/**
 * Service for interacting with ElevenLabs API for voice synthesis
 * Handles voice listing, text-to-speech generation, and voice previews
 */
export class ElevenLabsService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.elevenlabs.io/v1';
  private readonly defaultVoiceSettings: VoiceSettings = {
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0.0,
    useSpeakerBoost: true
  };

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ELEVENLABS_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key is required');
    }
  }

  /**
   * Get available voices for a specific language
   */
  async getVoices(language: string = 'en'): Promise<Voice[]> {
    try {
      // Check cache first
      const cachedVoices = podcastCacheService.getCachedVoices(language);
      if (cachedVoices) {
        return cachedVoices;
      }

      const voices = await podcastErrorHandler.retryWithBackoff(async () => {
        const response = await fetch(`${this.baseUrl}/voices`, {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Filter and map voices for the requested language
        return this.filterVoicesByLanguage(data.voices || [], language);
      }, 3, 'getVoices');

      // Cache the result
      await podcastCacheService.cacheVoices(language, voices);
      
      return voices;
    } catch (error) {
      throw podcastErrorHandler.handleError(
        error as Error,
        `Failed to fetch voices for language: ${language}`
      );
    }
  }

  /**
   * Generate audio from text using specified voice
   */
  async textToSpeech(
    text: string, 
    voiceId: string, 
    settings: Partial<VoiceSettings> = {}
  ): Promise<Buffer> {
    const timerId = performanceMonitor.startTimer('elevenlabs_tts');
    
    try {
      if (!text.trim()) {
        throw new Error('Text content is required for speech synthesis');
      }

      if (!voiceId) {
        throw new Error('Voice ID is required for speech synthesis');
      }

      const voiceSettings = { ...this.defaultVoiceSettings, ...settings };

      const result = await podcastErrorHandler.retryWithBackoff(async () => {
        const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg'
          },
          body: JSON.stringify({
            text: text.trim(),
            model_id: 'eleven_multilingual_v2', // Best model for podcast quality
            voice_settings: voiceSettings
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`ElevenLabs TTS error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }, 3, `textToSpeech for voice ${voiceId}`);

      performanceMonitor.endTimer(timerId, true);
      return result;
    } catch (error) {
      performanceMonitor.endTimer(timerId, false, error as Error);
      throw podcastErrorHandler.handleError(
        error as Error,
        `Failed to generate speech for voice ${voiceId}`
      );
    }
  }

  /**
   * Get voice preview sample
   */
  async getVoicePreview(voiceId: string): Promise<Buffer> {
    try {
      if (!voiceId) {
        throw new Error('Voice ID is required for preview');
      }

      // Check cache first
      const cachedPreview = podcastCacheService.getCachedVoicePreview(voiceId);
      if (cachedPreview) {
        return cachedPreview;
      }

      const audioBuffer = await podcastErrorHandler.retryWithBackoff(async () => {
        const response = await fetch(`${this.baseUrl}/voices/${voiceId}`, {
          headers: {
            'xi-api-key': this.apiKey
          }
        });

        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
        }

        const voiceData = await response.json();
        
        // If voice has preview URL, fetch it
        if (voiceData.preview_url) {
          const previewResponse = await fetch(voiceData.preview_url);
          if (previewResponse.ok) {
            const arrayBuffer = await previewResponse.arrayBuffer();
            return Buffer.from(arrayBuffer);
          }
        }

        // Fallback: generate short preview using TTS
        const previewText = "Hello, this is a preview of my voice for your podcast.";
        return await this.textToSpeech(previewText, voiceId, {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true
        });
      }, 2, `getVoicePreview for voice ${voiceId}`);

      // Cache the result
      await podcastCacheService.cacheVoicePreview(voiceId, audioBuffer);
      
      return audioBuffer;
    } catch (error) {
      throw podcastErrorHandler.handleError(
        error as Error,
        `Failed to get voice preview for ${voiceId}`
      );
    }
  }

  /**
   * Get voice details including metadata
   */
  async getVoiceDetails(voiceId: string): Promise<Voice> {
    try {
      return await podcastErrorHandler.retryWithBackoff(async () => {
        const response = await fetch(`${this.baseUrl}/voices/${voiceId}`, {
          headers: {
            'xi-api-key': this.apiKey
          }
        });

        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
        }

        const voiceData = await response.json();
        return this.mapElevenLabsVoiceToVoice(voiceData);
      }, 3, `getVoiceDetails for voice ${voiceId}`);
    } catch (error) {
      throw podcastErrorHandler.handleError(
        error as Error,
        `Failed to get voice details for ${voiceId}`
      );
    }
  }

  /**
   * Check API quota and usage
   */
  async getUsageInfo(): Promise<{ charactersUsed: number; charactersLimit: number }> {
    try {
      return await podcastErrorHandler.retryWithBackoff(async () => {
        const response = await fetch(`${this.baseUrl}/user`, {
          headers: {
            'xi-api-key': this.apiKey
          }
        });

        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
        }

        const userData = await response.json();
        return {
          charactersUsed: userData.subscription?.character_count || 0,
          charactersLimit: userData.subscription?.character_limit || 0
        };
      }, 2, 'getUsageInfo');
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

  /**
   * Filter voices by language and quality
   */
  private filterVoicesByLanguage(voices: any[], language: string): Voice[] {
    const languageMap: Record<string, string[]> = {
      'en': ['en', 'english'],
      'es': ['es', 'spanish', 'español'],
      'fr': ['fr', 'french', 'français'],
      'de': ['de', 'german', 'deutsch']
    };

    const targetLanguages = languageMap[language] || [language];

    return voices
      .filter(voice => {
        // Filter by language if specified in voice metadata
        if (voice.labels && voice.labels.language) {
          const voiceLang = voice.labels.language.toLowerCase();
          return targetLanguages.some(lang => voiceLang.includes(lang));
        }
        
        // If no language metadata, include all voices for now
        // This can be refined based on ElevenLabs API updates
        return true;
      })
      .map(voice => this.mapElevenLabsVoiceToVoice(voice))
      .filter(voice => voice.id && voice.name); // Ensure valid voice data
  }

  /**
   * Map ElevenLabs API response to our Voice interface
   */
  private mapElevenLabsVoiceToVoice(apiVoice: any): Voice {
    // Extract metadata from labels or description
    const labels = apiVoice.labels || {};
    const description = apiVoice.description || '';
    
    // Determine gender from labels or name
    let gender: 'male' | 'female' = 'male';
    if (labels.gender) {
      gender = labels.gender.toLowerCase() === 'female' ? 'female' : 'male';
    } else if (description.toLowerCase().includes('female') || description.toLowerCase().includes('woman')) {
      gender = 'female';
    }

    // Determine age from labels or description
    let age: 'young' | 'middle_aged' | 'old' = 'middle_aged';
    if (labels.age) {
      const ageLabel = labels.age.toLowerCase();
      if (ageLabel.includes('young') || ageLabel.includes('teen')) {
        age = 'young';
      } else if (ageLabel.includes('old') || ageLabel.includes('senior')) {
        age = 'old';
      }
    }

    // Determine accent from labels
    const accent = labels.accent || labels.language || 'neutral';

    return {
      id: apiVoice.voice_id,
      name: apiVoice.name,
      gender,
      age,
      accent,
      description: description || `${gender} voice with ${accent} accent`,
      previewUrl: apiVoice.preview_url
    };
  }
}

// Export singleton instance
export const elevenLabsService = new ElevenLabsService();