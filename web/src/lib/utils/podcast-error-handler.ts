import { PodcastGenerationError } from '../types/podcast.types';

/**
 * Specialized error handler for podcast generation operations
 * Provides retry logic, fallback strategies, and user notifications
 */
export class PodcastErrorHandler {
    private readonly maxRetries = 3;
    private readonly baseDelay = 1000; // 1 second

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
     * Sleep utility for retry delays
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export singleton instance
export const podcastErrorHandler = new PodcastErrorHandler();