/**
 * API-specific error handling for podcast endpoints
 * Provides consistent error responses and logging
 * Requirements: 4.6, 6.8, 8.8
 */

import { NextResponse } from 'next/server';
import { PodcastGenerationError } from '../types/podcast.types';
import { ApiErrorResponse } from '../types';
import { podcastErrorHandler } from './podcast-error-handler';

/**
 * Standard error response structure for podcast APIs
 */
interface PodcastApiError extends ApiErrorResponse {
    code?: string;
    suggestions?: string[];
    retryable?: boolean;
    retryAfter?: number; // seconds
}

/**
 * Handle and format API errors for podcast endpoints
 */
export class PodcastApiErrorHandler {
    /**
     * Create standardized error response for podcast API endpoints
     */
    static createErrorResponse(
        error: Error | PodcastGenerationError | string,
        context: string,
        statusCode: number = 500
    ): NextResponse<PodcastApiError> {
        let podcastError: PodcastGenerationError;

        if (typeof error === 'string') {
            podcastError = new PodcastGenerationError(error, { code: 'UNKNOWN_ERROR' });
        } else if (error instanceof PodcastGenerationError) {
            podcastError = error;
        } else {
            podcastError = podcastErrorHandler.handleError(error, context);
        }

        // Log the error
        podcastErrorHandler.logError(podcastError, context, {
            statusCode,
            apiEndpoint: true
        });

        const userMessage = podcastErrorHandler.getUserFriendlyMessage(podcastError);
        const suggestions = podcastErrorHandler.getRecoverySuggestions(podcastError);
        const isRetryable = podcastErrorHandler.isRetryableError(podcastError);

        const errorResponse: PodcastApiError = {
            success: false,
            error: userMessage,
            message: podcastError.message,
            code: podcastError.code,
            suggestions,
            retryable: isRetryable,
            retryAfter: isRetryable ? this.calculateRetryAfter(podcastError.code) : undefined
        };

        return NextResponse.json(errorResponse, { status: statusCode });
    }

    /**
     * Handle validation errors specifically
     */
    static createValidationErrorResponse(
        errors: string[],
        context: string = 'validation'
    ): NextResponse<PodcastApiError> {
        const errorResponse: PodcastApiError = {
            success: false,
            error: 'Validation failed',
            message: errors.join(', '),
            code: 'CONFIGURATION_INVALID',
            suggestions: [
                'Check that all required fields are provided',
                'Ensure all values are in the correct format',
                'Verify that voice selections are different for each host'
            ],
            retryable: false
        };

        podcastErrorHandler.logError(
            new Error(`Validation failed: ${errors.join(', ')}`),
            context,
            { validationErrors: errors, apiEndpoint: true }
        );

        return NextResponse.json(errorResponse, { status: 400 });
    }

    /**
     * Handle authentication errors
     */
    static createAuthErrorResponse(): NextResponse<PodcastApiError> {
        const errorResponse: PodcastApiError = {
            success: false,
            error: 'Authentication required',
            message: 'Please sign in to access this feature',
            code: 'AUTHENTICATION_ERROR',
            suggestions: [
                'Sign in to your account',
                'Refresh the page and try again',
                'Check that your session has not expired'
            ],
            retryable: false
        };

        return NextResponse.json(errorResponse, { status: 401 });
    }

    /**
     * Handle rate limiting errors
     */
    static createRateLimitErrorResponse(retryAfter: number = 60): NextResponse<PodcastApiError> {
        const errorResponse: PodcastApiError = {
            success: false,
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            suggestions: [
                `Wait ${retryAfter} seconds before trying again`,
                'Consider upgrading your plan for higher limits',
                'Spread out your requests over time'
            ],
            retryable: true,
            retryAfter
        };

        return NextResponse.json(errorResponse, {
            status: 429,
            headers: {
                'Retry-After': retryAfter.toString(),
                'X-RateLimit-Reset': (Date.now() + retryAfter * 1000).toString()
            }
        });
    }

    /**
     * Handle service unavailable errors
     */
    static createServiceUnavailableResponse(
        service: string = 'podcast generation',
        retryAfter: number = 300
    ): NextResponse<PodcastApiError> {
        const errorResponse: PodcastApiError = {
            success: false,
            error: `${service} service temporarily unavailable`,
            message: 'The service is currently experiencing issues. Please try again later.',
            code: 'SERVICE_UNAVAILABLE',
            suggestions: [
                `Try again in ${Math.round(retryAfter / 60)} minutes`,
                'Check our status page for updates',
                'Contact support if the issue persists'
            ],
            retryable: true,
            retryAfter
        };

        return NextResponse.json(errorResponse, {
            status: 503,
            headers: {
                'Retry-After': retryAfter.toString()
            }
        });
    }

    /**
     * Handle resource not found errors
     */
    static createNotFoundResponse(resource: string): NextResponse<PodcastApiError> {
        const errorResponse: PodcastApiError = {
            success: false,
            error: `${resource} not found`,
            message: `The requested ${resource.toLowerCase()} could not be found`,
            code: 'RESOURCE_NOT_FOUND',
            suggestions: [
                'Check that the ID is correct',
                'Ensure the resource exists and you have access to it',
                'Try refreshing the page'
            ],
            retryable: false
        };

        return NextResponse.json(errorResponse, { status: 404 });
    }

    /**
     * Handle conflict errors (e.g., podcast already exists)
     */
    static createConflictResponse(message: string, suggestions?: string[]): NextResponse<PodcastApiError> {
        const errorResponse: PodcastApiError = {
            success: false,
            error: 'Resource conflict',
            message,
            code: 'RESOURCE_CONFLICT',
            suggestions: suggestions || [
                'Check if the resource already exists',
                'Try with different parameters',
                'Delete the existing resource first if appropriate'
            ],
            retryable: false
        };

        return NextResponse.json(errorResponse, { status: 409 });
    }

    /**
     * Wrap async API handlers with error handling
     */
    static async withErrorHandling<T>(
        handler: () => Promise<T>,
        context: string
    ): Promise<T | NextResponse<PodcastApiError>> {
        try {
            return await handler();
        } catch (error) {
            console.error(`API Error in ${context}:`, error);

            // Handle specific error types
            if (error instanceof PodcastGenerationError) {
                return this.createErrorResponse(error, context, this.getStatusCodeForError(error.code));
            }

            // Handle common HTTP errors
            if (error && typeof error === 'object' && 'status' in error) {
                const status = (error as any).status;
                if (status === 401) return this.createAuthErrorResponse();
                if (status === 404) return this.createNotFoundResponse('resource');
                if (status === 429) return this.createRateLimitErrorResponse();
                if (status === 503) return this.createServiceUnavailableResponse();
            }

            // Default error handling
            return this.createErrorResponse(error as Error, context);
        }
    }

    /**
     * Calculate retry delay based on error type
     */
    private static calculateRetryAfter(errorCode: string): number {
        switch (errorCode) {
            case 'RATE_LIMIT_EXCEEDED':
                return 60; // 1 minute
            case 'SERVICE_UNAVAILABLE':
                return 300; // 5 minutes
            case 'VOICE_SYNTHESIS_FAILED':
                return 30; // 30 seconds
            case 'AI_SERVICE_ERROR':
                return 120; // 2 minutes
            default:
                return 60; // Default 1 minute
        }
    }

    /**
     * Get appropriate HTTP status code for error type
     */
    private static getStatusCodeForError(errorCode: string): number {
        switch (errorCode) {
            case 'CONFIGURATION_INVALID':
                return 400;
            case 'AUTHENTICATION_ERROR':
                return 401;
            case 'ACCESS_DENIED':
                return 403;
            case 'RESOURCE_NOT_FOUND':
                return 404;
            case 'RESOURCE_CONFLICT':
                return 409;
            case 'RATE_LIMIT_EXCEEDED':
                return 429;
            case 'SERVICE_UNAVAILABLE':
            case 'AI_SERVICE_ERROR':
            case 'VOICE_SYNTHESIS_FAILED':
                return 503;
            default:
                return 500;
        }
    }
}

/**
 * Middleware function to add error handling to API routes
 */
export function withPodcastErrorHandling(
    handler: (req: any, context: any) => Promise<any>,
    context: string
) {
    return async (req: any, routeContext: any) => {
        return PodcastApiErrorHandler.withErrorHandling(
            () => handler(req, routeContext),
            context
        );
    };
}