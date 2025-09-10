import { PodcastGenerationError, Voice } from '../types/podcast.types';

/**
 * Specialized error handler for podcast generation operations
 * Provides retry logic, fallback strategies, and user notifications
 * Requirements: 4.6, 6.8, 8.8
 */
export class PodcastErrorHandler {
    private readonly maxRetries = 3;
    private readonly baseDelay = 1000; // 1 second
    private readonly fallbackVoices: Record<string, Voice[]> = {
        'en': [
            { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', gender: 'male', age: 'middle_aged', accent: 'american', description: 'Deep, authoritative voice' },
            { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', gender: 'female', age: 'young', accent: 'american', description: 'Calm, pleasant voice' }
        ],
        'es': [
            { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', gender: 'male', age: 'middle_aged', accent: 'american', description: 'Clear, confident voice' },
            { id: 'pFGYVqjYTHWd6gLDUuU5', name: 'Bella', gender: 'female', age: 'young', accent: 'american', description: 'Warm, friendly voice' }
        ]
    };

    /**
     * Retry operation with exponential backoff
     */
    async retryWithBackoff<T>(
        operation: () => Promise<T>,
        maxRetries: number = this.maxRetries,
        context?: string
    ): Promise<T> {
        let lastError: Error = new Error('Unknown error occurred');

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;

                if (attempt === maxRetries) {
                    break;
                }

                // Calculate delay with exponential backoff
                const delay = this.baseDelay * Math.pow(2, attempt - 1);

                console.warn(
                    `Podcast operation failed (attempt ${attempt}/${maxRetries})${context ? ` - ${context}` : ''}: ${error}. Retrying in ${delay}ms...`
                );

                await this.sleep(delay);
            }
        }

        throw new PodcastGenerationError(
            `Operation failed after ${maxRetries} attempts${context ? ` - ${context}` : ''}`,
            {
                code: 'SCRIPT_GENERATION_FAILED',
                details: { originalError: lastError, attempts: maxRetries }
            }
        );
    }

    /**
     * Handle specific error types with appropriate recovery strategies
     */
    handleError(error: Error, context: string): PodcastGenerationError {
        if (error instanceof PodcastGenerationError) {
            return error;
        }

        // Map common errors to podcast-specific error codes
        let code: PodcastGenerationError['code'] = 'SCRIPT_GENERATION_FAILED';

        if (error.message.includes('voice') || error.message.includes('audio')) {
            code = 'VOICE_SYNTHESIS_FAILED';
        } else if (error.message.includes('storage') || error.message.includes('upload')) {
            code = 'STORAGE_FAILED';
        } else if (error.message.includes('processing') || error.message.includes('combine')) {
            code = 'AUDIO_PROCESSING_FAILED';
        } else if (error.message.includes('validation') || error.message.includes('config')) {
            code = 'CONFIGURATION_INVALID';
        }

        return new PodcastGenerationError(
            `${context}: ${error.message}`,
            { code, details: error }
        );
    }

    /**
     * Get user-friendly error message for display
     */
    getUserFriendlyMessage(error: PodcastGenerationError): string {
        switch (error.code) {
            case 'CONFIGURATION_INVALID':
                return 'Please check your podcast configuration and try again.';

            case 'SCRIPT_GENERATION_FAILED':
                return 'Failed to generate podcast script. Please try again or contact support if the issue persists.';

            case 'VOICE_SYNTHESIS_FAILED':
                return 'Voice synthesis failed. This might be due to API limits or network issues. Please try again later.';

            case 'AUDIO_PROCESSING_FAILED':
                return 'Audio processing failed. Please try again or contact support if the issue persists.';

            case 'STORAGE_FAILED':
                return 'Failed to save podcast. Please check your connection and try again.';

            default:
                return 'An unexpected error occurred during podcast generation. Please try again.';
        }
    }

    /**
     * Check if error is retryable
     */
    isRetryableError(error: Error): boolean {
        const retryablePatterns = [
            'network',
            'timeout',
            'rate limit',
            'temporary',
            'service unavailable',
            'internal server error'
        ];

        const errorMessage = error.message.toLowerCase();
        return retryablePatterns.some(pattern => errorMessage.includes(pattern));
    }

    /**
     * Log error with context for monitoring
     */
    logError(error: Error, context: string, metadata?: Record<string, any>): void {
        const logData = {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            context,
            metadata,
            timestamp: new Date().toISOString()
        };

        console.error('Podcast generation error:', JSON.stringify(logData, null, 2));

        // TODO: Integrate with monitoring service (e.g., Sentry, LogRocket)
        // This would send error data to external monitoring for production tracking
    }

    /**
     * Get fallback voice for failed voice synthesis
     */
    async getFallbackVoice(language: string, originalVoiceId: string): Promise<Voice | null> {
        const fallbacks = this.fallbackVoices[language] || this.fallbackVoices['en'];
        
        // Find a different voice than the original
        const fallback = fallbacks.find(voice => voice.id !== originalVoiceId);
        
        if (fallback) {
            console.warn(`Using fallback voice ${fallback.name} (${fallback.id}) for language ${language}`);
            return fallback;
        }
        
        return null;
    }

    /**
     * Resume podcast generation from a specific stage
     */
    async resumeGeneration(podcastId: string, lastCompletedStage: 'script' | 'audio' | 'storage'): Promise<void> {
        try {
            console.log(`Resuming podcast generation for ${podcastId} from stage: ${lastCompletedStage}`);
            
            // This would integrate with the PodcastService to resume from the appropriate stage
            // For now, we'll log the recovery attempt
            this.logError(
                new Error(`Generation resumed from ${lastCompletedStage} stage`),
                'Generation Recovery',
                { podcastId, resumeStage: lastCompletedStage }
            );
            
            // TODO: Implement actual resume logic when PodcastService supports it
            // await podcastService.resumeFromStage(podcastId, lastCompletedStage);
            
        } catch (error) {
            this.logError(
                error as Error,
                'Generation Resume Failed',
                { podcastId, resumeStage: lastCompletedStage }
            );
            throw error;
        }
    }

    /**
     * Clean up failed generation artifacts
     */
    async cleanupFailedGeneration(podcastId: string): Promise<void> {
        try {
            console.log(`Cleaning up failed generation artifacts for podcast ${podcastId}`);
            
            // This would clean up temporary files, partial audio, etc.
            // For now, we'll log the cleanup attempt
            this.logError(
                new Error('Cleanup initiated for failed generation'),
                'Generation Cleanup',
                { podcastId, action: 'cleanup' }
            );
            
            // TODO: Implement actual cleanup logic
            // - Remove temporary audio files
            // - Clear partial database records
            // - Cancel any pending API requests
            
        } catch (error) {
            this.logError(
                error as Error,
                'Cleanup Failed',
                { podcastId }
            );
            // Don't throw here - cleanup failures shouldn't block other operations
        }
    }

    /**
     * Validate and sanitize user configuration to prevent errors
     */
    validateAndSanitizeConfig(config: any): { isValid: boolean; sanitizedConfig?: any; errors: string[] } {
        const errors: string[] = [];
        const sanitizedConfig = { ...config };

        // Validate language
        if (!config.language || typeof config.language !== 'string') {
            errors.push('Language is required and must be a string');
        } else {
            sanitizedConfig.language = config.language.toLowerCase().trim();
            if (!['en', 'es', 'fr', 'de'].includes(sanitizedConfig.language)) {
                errors.push('Language must be one of: en, es, fr, de');
            }
        }

        // Validate duration preset
        if (!config.durationPreset || typeof config.durationPreset !== 'string') {
            errors.push('Duration preset is required');
        } else {
            sanitizedConfig.durationPreset = config.durationPreset.toLowerCase().trim();
            if (!['short', 'medium', 'long'].includes(sanitizedConfig.durationPreset)) {
                errors.push('Duration preset must be one of: short, medium, long');
            }
        }

        // Validate voice IDs
        if (!config.host1VoiceId || typeof config.host1VoiceId !== 'string') {
            errors.push('Host 1 voice ID is required');
        } else {
            sanitizedConfig.host1VoiceId = config.host1VoiceId.trim();
        }

        if (!config.host2VoiceId || typeof config.host2VoiceId !== 'string') {
            errors.push('Host 2 voice ID is required');
        } else {
            sanitizedConfig.host2VoiceId = config.host2VoiceId.trim();
        }

        // Ensure different voices
        if (sanitizedConfig.host1VoiceId && sanitizedConfig.host2VoiceId && 
            sanitizedConfig.host1VoiceId === sanitizedConfig.host2VoiceId) {
            errors.push('Host voices must be different');
        }

        // Sanitize custom instructions
        if (config.customInstructions && typeof config.customInstructions === 'string') {
            sanitizedConfig.customInstructions = config.customInstructions.trim();
            if (sanitizedConfig.customInstructions.length > 1000) {
                sanitizedConfig.customInstructions = sanitizedConfig.customInstructions.substring(0, 1000);
            }
        }

        return {
            isValid: errors.length === 0,
            sanitizedConfig: errors.length === 0 ? sanitizedConfig : undefined,
            errors
        };
    }

    /**
     * Get recovery suggestions based on error type
     */
    getRecoverySuggestions(error: PodcastGenerationError): string[] {
        const suggestions: string[] = [];

        switch (error.code) {
            case 'CONFIGURATION_INVALID':
                suggestions.push('Check that all required fields are filled out correctly');
                suggestions.push('Ensure you have selected different voices for each host');
                suggestions.push('Verify that your language selection matches available voices');
                break;

            case 'SCRIPT_GENERATION_FAILED':
                suggestions.push('Try shortening your note content or selecting a shorter duration');
                suggestions.push('Check that your note has sufficient content (at least 50 characters)');
                suggestions.push('Consider simplifying complex formatting in your notes');
                break;

            case 'VOICE_SYNTHESIS_FAILED':
                suggestions.push('Try selecting different voices for your hosts');
                suggestions.push('Check your internet connection and try again');
                suggestions.push('Consider using a shorter duration preset to reduce processing time');
                break;

            case 'AUDIO_PROCESSING_FAILED':
                suggestions.push('Try generating the podcast again with a shorter duration');
                suggestions.push('Check that your selected voices are compatible');
                suggestions.push('Contact support if the issue persists');
                break;

            case 'STORAGE_FAILED':
                suggestions.push('Check your internet connection and try again');
                suggestions.push('Ensure you have sufficient storage space');
                suggestions.push('Try again in a few minutes if the service is busy');
                break;

            default:
                suggestions.push('Try refreshing the page and attempting the operation again');
                suggestions.push('Check your internet connection');
                suggestions.push('Contact support if the problem continues');
        }

        return suggestions;
    }

    /**
     * Sleep utility for retry delays
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export singleton instance
export const podcastErrorHandler = new PodcastErrorHandler();