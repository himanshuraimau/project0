/**
 * ElevenLabs API Service
 * Direct integration with ElevenLabs Podcast API for podcast generation
 * Requirements: 1.3, 8.1, 8.4
 */

// Ensure environment variables are loaded
// Environment variables are handled by Next.js automatically

import { config } from '../config/environment';
import * as crypto from 'crypto';

// ElevenLabs API Types
export interface ElevenLabsVoice {
    voice_id: string;
    name: string;
    category: string;
    description?: string;
    preview_url?: string;
    available_for_tiers?: string[];
}

export interface ElevenLabsPodcastGenerationRequest {
    text: string;
    mode: 'conversation' | 'bulletin';
    voice_settings: {
        host_voice_id: string;
        guest_voice_id?: string;
    };
    quality_preset: 'standard' | 'high' | 'highest' | 'ultra' | 'ultra_lossless';
    duration_scale: 'short' | 'default' | 'long';
    language?: string;
    intro?: string;
    outro?: string;
}

export interface ElevenLabsPodcastGenerationResponse {
    project_id: string;
    status: 'generating' | 'completed' | 'failed';
    audio_url?: string;
    duration?: number;
    error_message?: string;
}

export class ElevenLabsApiError extends Error {
    public readonly status: number;
    public readonly type: string;
    public readonly code?: string;

    constructor(data: {
        error: {
            message: string;
            type: string;
            code?: string;
        };
        status: number;
    }) {
        super(data.error.message);
        this.name = 'ElevenLabsApiError';
        this.status = data.status;
        this.type = data.error.type;
        this.code = data.error.code;
    }
}

export interface ElevenLabsVoiceConfiguration {
    hostVoiceId: string;
    guestVoiceId?: string;
    qualityPreset: 'standard' | 'high' | 'highest' | 'ultra' | 'ultra_lossless';
    durationScale: 'short' | 'default' | 'long';
}

/**
 * ElevenLabs Service Class
 * Handles direct API communication with ElevenLabs Podcast API
 */
export class ElevenLabsService {
    private readonly apiKey: string;
    private readonly baseUrl: string;
    private readonly webhookSecret: string;

    constructor(options?: { skipValidation?: boolean }) {
        this.apiKey = config.ai.elevenlabs.apiKey;
        this.baseUrl = config.ai.elevenlabs.baseUrl;
        this.webhookSecret = config.ai.elevenlabs.webhookSecret;

        console.log('ElevenLabs Service Configuration:', {
            hasApiKey: !!this.apiKey,
            apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'none',
            baseUrl: this.baseUrl,
            hasWebhookSecret: !!this.webhookSecret,
        });

        if (!this.apiKey && !options?.skipValidation) {
            throw new Error('ElevenLabs API key is required. Set ELEVENLABS_API_KEY environment variable.');
        }
    }

    /**
     * Generate a podcast from text content
     * Requirements: 1.3, 8.1
     */
    async generatePodcast(request: ElevenLabsPodcastGenerationRequest): Promise<ElevenLabsPodcastGenerationResponse> {
        try {
            // Build the mode object according to ElevenLabs API spec
            const mode = request.mode === 'conversation' 
                ? {
                    type: 'conversation' as const,
                    conversation: {
                        host_voice_id: request.voice_settings.host_voice_id,
                        guest_voice_id: request.voice_settings.guest_voice_id!,
                    }
                  }
                : {
                    type: 'bulletin' as const,
                    bulletin: {
                        host_voice_id: request.voice_settings.host_voice_id,
                    }
                  };

            // Build the source object
            const source = {
                type: 'text' as const,
                text: request.text,
            };

            // Build the complete payload according to ElevenLabs API spec
            const payload = {
                model_id: 'eleven_multilingual_v2', // Default model
                mode,
                source,
                quality_preset: request.quality_preset,
                duration_scale: request.duration_scale,
                ...(request.language && { language: request.language }),
                ...(request.intro && { intro: request.intro }),
                ...(request.outro && { outro: request.outro }),
                callback_url: config.ai.elevenlabs.callbackUrl, // Add callback URL from config
            };

            console.log('ElevenLabs API Request:', {
                url: `${this.baseUrl}/studio/podcasts`,
                payload: JSON.stringify(payload, null, 2),
                apiKeyPrefix: this.apiKey.substring(0, 10) + '...',
            });

            const response = await fetch(`${this.baseUrl}/studio/podcasts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': this.apiKey,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('ElevenLabs API Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorData,
                    headers: Object.fromEntries(response.headers.entries()),
                });
                throw new ElevenLabsApiError({
                    error: {
                        message: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
                        type: 'api_error',
                        code: errorData.error?.code,
                    },
                    status: response.status,
                });
            }

            const data = await response.json();

            return {
                project_id: data.project?.project_id || data.project_id,
                status: data.project?.state === 'creating' ? 'generating' : (data.status || 'generating'),
                audio_url: data.audio_url,
                duration: data.duration,
                error_message: data.error_message,
            };
        } catch (error) {
            if (error instanceof ElevenLabsApiError) {
                throw error;
            }

            // Handle network errors and other exceptions
            throw new ElevenLabsApiError({
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error occurred',
                    type: 'network_error',
                },
                status: 0,
            });
        }
    }

    /**
     * Get available voices for podcast generation
     * Requirements: 8.1, 8.4
     */
    async getAvailableVoices(): Promise<ElevenLabsVoice[]> {
        try {
            const response = await fetch(`${this.baseUrl}/voices`, {
                method: 'GET',
                headers: {
                    'xi-api-key': this.apiKey,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new ElevenLabsApiError({
                    error: {
                        message: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
                        type: 'api_error',
                        code: errorData.error?.code,
                    },
                    status: response.status,
                });
            }

            const data = await response.json();
            return data.voices || [];
        } catch (error) {
            if (error instanceof ElevenLabsApiError) {
                throw error;
            }

            throw new ElevenLabsApiError({
                error: {
                    message: error instanceof Error ? error.message : 'Failed to fetch voices',
                    type: 'network_error',
                },
                status: 0,
            });
        }
    }

    /**
     * Get podcast generation status by project ID
     * Requirements: 8.1
     */
    async getPodcastStatus(projectId: string): Promise<ElevenLabsPodcastGenerationResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/studio/projects/${projectId}`, {
                method: 'GET',
                headers: {
                    'xi-api-key': this.apiKey,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new ElevenLabsApiError({
                    error: {
                        message: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
                        type: 'api_error',
                        code: errorData.error?.code,
                    },
                    status: response.status,
                });
            }

            const data = await response.json();

            return {
                project_id: data.project_id || projectId,
                status: data.state === 'creating' ? 'generating' : (data.state === 'default' ? 'completed' : data.state),
                audio_url: data.audio_url,
                duration: data.duration,
                error_message: data.error_message,
            };
        } catch (error) {
            if (error instanceof ElevenLabsApiError) {
                throw error;
            }

            throw new ElevenLabsApiError({
                error: {
                    message: error instanceof Error ? error.message : 'Failed to get podcast status',
                    type: 'network_error',
                },
                status: 0,
            });
        }
    }

    /**
     * Download audio file from ElevenLabs
     * Requirements: 8.1
     */
    async downloadAudio(audioUrl: string): Promise<Buffer> {
        try {
            const response = await fetch(audioUrl, {
                method: 'GET',
                headers: {
                    'xi-api-key': this.apiKey,
                },
            });

            if (!response.ok) {
                throw new ElevenLabsApiError({
                    error: {
                        message: `Failed to download audio: HTTP ${response.status}`,
                        type: 'download_error',
                    },
                    status: response.status,
                });
            }

            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (error) {
            if (error instanceof ElevenLabsApiError) {
                throw error;
            }

            throw new ElevenLabsApiError({
                error: {
                    message: error instanceof Error ? error.message : 'Failed to download audio',
                    type: 'network_error',
                },
                status: 0,
            });
        }
    }

    /**
     * Validate voice configuration
     * Requirements: 8.4
     */
    validateVoiceConfiguration(voiceConfig: ElevenLabsVoiceConfiguration): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Validate host voice ID
        if (!voiceConfig.hostVoiceId || voiceConfig.hostVoiceId.trim().length === 0) {
            errors.push('Host voice ID is required');
        }

        // Validate guest voice ID for conversation mode (will be checked by caller)
        if (voiceConfig.guestVoiceId && voiceConfig.guestVoiceId.trim().length === 0) {
            errors.push('Guest voice ID cannot be empty if provided');
        }

        // Validate quality preset
        const validQualityPresets = ['standard', 'high', 'highest', 'ultra', 'ultra_lossless'];
        if (!validQualityPresets.includes(voiceConfig.qualityPreset)) {
            errors.push(`Invalid quality preset. Must be one of: ${validQualityPresets.join(', ')}`);
        }

        // Validate duration scale
        const validDurationScales = ['short', 'default', 'long'];
        if (!validDurationScales.includes(voiceConfig.durationScale)) {
            errors.push(`Invalid duration scale. Must be one of: ${validDurationScales.join(', ')}`);
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Verify webhook signature
     * Requirements: 8.1
     */
    verifyWebhookSignature(payload: string, signature: string): boolean {
        if (!this.webhookSecret) {
            console.warn('ElevenLabs webhook secret not configured');
            return false;
        }

        try {
            // ElevenLabs uses HMAC-SHA256 for webhook signatures
            // crypto is imported at the top
            const expectedSignature = crypto
                .createHmac('sha256', this.webhookSecret)
                .update(payload)
                .digest('hex');

            // Compare signatures securely
            const providedSignature = signature.replace('sha256=', '');
            return crypto.timingSafeEqual(
                Buffer.from(expectedSignature, 'hex'),
                Buffer.from(providedSignature, 'hex')
            );
        } catch (error) {
            console.error('Error verifying webhook signature:', error);
            return false;
        }
    }

    /**
     * Get default voice configurations for different modes
     * Requirements: 8.4
     */
    getDefaultVoiceConfigurations(): Record<string, ElevenLabsVoiceConfiguration> {
        return {
            conversation: {
                hostVoiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - default male voice
                guestVoiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - default female voice
                qualityPreset: 'high',
                durationScale: 'default',
            },
            bulletin: {
                hostVoiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - default male voice
                qualityPreset: 'high',
                durationScale: 'default',
            },
        };
    }

    /**
     * Format text content for podcast generation
     * Requirements: 8.4
     */
    formatTextForPodcast(text: string, maxLength: number = 50000): string {
        // Remove excessive whitespace and normalize line breaks
        let formatted = text
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n\n')
            .trim();

        // Truncate if too long
        if (formatted.length > maxLength) {
            formatted = formatted.substring(0, maxLength - 3) + '...';
        }

        return formatted;
    }

    /**
     * Check if the service is properly configured
     * Requirements: 8.1
     */
    isConfigured(): boolean {
        return !!(this.apiKey && this.baseUrl);
    }

    /**
     * Get service configuration status
     * Requirements: 8.1
     */
    getConfigurationStatus(): {
        configured: boolean;
        apiKey: boolean;
        baseUrl: boolean;
        webhookSecret: boolean;
    } {
        return {
            configured: this.isConfigured(),
            apiKey: !!this.apiKey,
            baseUrl: !!this.baseUrl,
            webhookSecret: !!this.webhookSecret,
        };
    }
}

// Export singleton instance (lazy initialization)
let _elevenLabsService: ElevenLabsService | null = null;

export const elevenLabsService = {
    getInstance(): ElevenLabsService {
        if (!_elevenLabsService) {
            _elevenLabsService = new ElevenLabsService();
        }
        return _elevenLabsService;
    }
};

// Export error class for external use
export { ElevenLabsApiError as ElevenLabsError };