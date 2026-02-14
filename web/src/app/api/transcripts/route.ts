import { NextRequest, NextResponse } from 'next/server';
import { TranscriptService } from '@/lib/transcript-service';
import { getUserFromAuth } from '@/lib/auth-helper';
import { ApiResponse, ApiSuccessResponse, ApiErrorResponse, YouTubeProcessRequest } from '@/lib/types';
import { FeatureGateService } from '@/lib/feature-gate-service';

const transcriptService = new TranscriptService();

// GET /api/transcripts - Get user's transcripts
export async function GET(request: NextRequest) {
    try {
        const userId = await getUserFromAuth(request);

        if (!userId) {
            const errorResponse: ApiErrorResponse = {
                success: false,
                error: 'Authentication required'
            };
            return NextResponse.json(errorResponse, { status: 401 });
        }

        const transcripts = await transcriptService.getTranscriptsByUser(userId);

        const response: ApiSuccessResponse = {
            success: true,
            data: transcripts,
        };
        return NextResponse.json(response);

    } catch (error) {
        console.error('Error fetching transcripts:', error);

        const errorResponse: ApiErrorResponse = {
            success: false,
            error: 'Failed to fetch transcripts',
            message: error instanceof Error ? error.message : 'Unknown error'
        };
        return NextResponse.json(errorResponse, { status: 500 });
    }
}

// POST /api/transcripts - Create a new transcript from YouTube URL
export async function POST(request: NextRequest) {
    try {
        const userId = await getUserFromAuth(request);

        if (!userId) {
            const errorResponse: ApiErrorResponse = {
                success: false,
                error: 'Authentication required'
            };
            return NextResponse.json(errorResponse, { status: 401 });
        }

        const body: YouTubeProcessRequest = await request.json();
        const { url: videoUrl } = body;

        if (!videoUrl) {
            const errorResponse: ApiErrorResponse = {
                success: false,
                error: 'Video URL is required'
            };
            return NextResponse.json(errorResponse, { status: 400 });
        }

        // Validate YouTube URL format
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)/;
        if (!youtubeRegex.test(videoUrl)) {
            const errorResponse: ApiErrorResponse = {
                success: false,
                error: 'Invalid YouTube URL format'
            };
            return NextResponse.json(errorResponse, { status: 400 });
        }

        // Check note creation access (allows free tier: 1 note from any source including YouTube/website)
        const accessCheck = await FeatureGateService.checkNoteCreationAccess();
        if (!accessCheck.allowed) {
            const errorResponse = {
                success: false,
                error: accessCheck.error || 'Unable to create note',
                message: accessCheck.message || 'Unable to create note',
                ...(accessCheck.error === 'FREE_TIER_LIMIT_REACHED' && {
                    notesUsed: accessCheck.notesUsed,
                    notesLimit: accessCheck.notesLimit,
                    upgradeUrl: accessCheck.upgradeUrl || '/pricing',
                }),
            };
            return NextResponse.json(errorResponse, { status: accessCheck.statusCode });
        }

        // Process and save the transcript
        const transcript = await transcriptService.processYoutubeTranscript(
            videoUrl,
            userId
        );

        // Increment video processing usage counter after successful processing
        await FeatureGateService.incrementVideoUsage(userId);

        const response: ApiSuccessResponse = {
            success: true,
            data: transcript,
            message: 'Transcript created successfully',
        };
        return NextResponse.json(response);

    } catch (error) {
        console.error('YouTube transcript processing error:', error);
        
        // Handle specific error types
        if (error instanceof Error) {
            const errorMessage = error.message;
            
            // Timeout errors
            if (errorMessage.includes('timed out') || errorMessage.includes('timeout')) {
                const apiErrorResponse: ApiErrorResponse = {
                    success: false,
                    error: 'TIMEOUT',
                    message: 'YouTube processing is taking longer than expected. The video transcript is being processed in the background and should appear in 5-10 minutes. Please check back shortly.'
                };
                return NextResponse.json(apiErrorResponse, { status: 408 });
            }
            
            // API-specific errors
            if (errorMessage.includes('not have captions') || errorMessage.includes('Video not found')) {
                const apiErrorResponse: ApiErrorResponse = {
                    success: false,
                    error: 'NO_CAPTIONS',
                    message: errorMessage
                };
                return NextResponse.json(apiErrorResponse, { status: 400 });
            }
            
            // Service unavailable
            if (errorMessage.includes('temporarily unavailable') || errorMessage.includes('service is slow')) {
                const apiErrorResponse: ApiErrorResponse = {
                    success: false,
                    error: 'SERVICE_UNAVAILABLE',
                    message: errorMessage
                };
                return NextResponse.json(apiErrorResponse, { status: 503 });
            }
            
            // Rate limiting
            if (errorMessage.includes('Too many requests')) {
                const apiErrorResponse: ApiErrorResponse = {
                    success: false,
                    error: 'RATE_LIMITED',
                    message: errorMessage
                };
                return NextResponse.json(apiErrorResponse, { status: 429 });
            }
            
            // Connection issues
            if (errorMessage.includes('Cannot connect') || errorMessage.includes('Network Error')) {
                const networkErrorResponse: ApiErrorResponse = {
                    success: false,
                    error: 'NETWORK_ERROR',
                    message: errorMessage
                };
                return NextResponse.json(networkErrorResponse, { status: 503 });
            }
            
            // Generic API error
            if (errorMessage.includes('API error') || errorMessage.includes('API Error')) {
                const apiErrorResponse: ApiErrorResponse = {
                    success: false,
                    error: 'EXTERNAL_API_ERROR',
                    message: errorMessage
                };
                return NextResponse.json(apiErrorResponse, { status: 502 });
            }
        }

        // Fallback error response
        const errorResponse: ApiErrorResponse = {
            success: false,
            error: 'PROCESSING_FAILED',
            message: error instanceof Error ? error.message : 'Failed to process YouTube video. Please try again.'
        };
        return NextResponse.json(errorResponse, { status: 500 });
    }
}

// DELETE /api/transcripts - Delete a transcript
export async function DELETE(request: NextRequest) {
    try {
        const userId = await getUserFromAuth(request);

        if (!userId) {
            const errorResponse: ApiErrorResponse = {
                success: false,
                error: 'Authentication required'
            };
            return NextResponse.json(errorResponse, { status: 401 });
        }

        const url = new URL(request.url);
        const transcriptId = url.searchParams.get('id');

        if (!transcriptId) {
            const errorResponse: ApiErrorResponse = {
                success: false,
                error: 'Transcript ID is required'
            };
            return NextResponse.json(errorResponse, { status: 400 });
        }

        // First check if transcript belongs to user
        const transcript = await transcriptService.getTranscript(transcriptId);

        if (!transcript) {
            const errorResponse: ApiErrorResponse = {
                success: false,
                error: 'Transcript not found'
            };
            return NextResponse.json(errorResponse, { status: 404 });
        }

        if (transcript.userId !== userId) {
            const errorResponse: ApiErrorResponse = {
                success: false,
                error: 'Access denied'
            };
            return NextResponse.json(errorResponse, { status: 403 });
        }

        await transcriptService.deleteTranscript(transcriptId);

        const response: ApiResponse = {
            success: true,
            message: 'Transcript deleted successfully',
        };
        return NextResponse.json(response);

    } catch (error) {
        console.error('Error deleting transcript:', error);

        const errorResponse: ApiErrorResponse = {
            success: false,
            error: 'Failed to delete transcript',
            message: error instanceof Error ? error.message : 'Unknown error'
        };
        return NextResponse.json(errorResponse, { status: 500 });
    }
}