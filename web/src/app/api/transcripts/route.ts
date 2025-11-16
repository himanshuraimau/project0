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
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)/;
        if (!youtubeRegex.test(videoUrl)) {
            const errorResponse: ApiErrorResponse = {
                success: false,
                error: 'Invalid YouTube URL format'
            };
            return NextResponse.json(errorResponse, { status: 400 });
        }

        // Check subscription access
        const accessCheck = await FeatureGateService.checkAccessForAPI();
        if (!accessCheck.allowed) {
            const errorResponse: ApiErrorResponse = {
                success: false,
                error: accessCheck.message || 'Subscription required',
            };
            return NextResponse.json(errorResponse, { status: accessCheck.statusCode });
        }

        // Process and save the transcript
        const transcript = await transcriptService.processYoutubeTranscript(
            videoUrl,
            userId
        );

        // No credit deduction needed - subscription system handles access

        const response: ApiSuccessResponse = {
            success: true,
            data: transcript,
            message: 'Transcript created successfully',
        };
        return NextResponse.json(response);

    } catch (error) {
        console.error('Error creating transcript:', error);

        // Handle specific error types
        if (error instanceof Error) {
            if (error.message.includes('API Error')) {
                const apiErrorResponse: ApiErrorResponse = {
                    success: false,
                    error: 'External API error',
                    message: error.message
                };
                return NextResponse.json(apiErrorResponse, { status: 502 });
            }

            if (error.message.includes('Network Error')) {
                const networkErrorResponse: ApiErrorResponse = {
                    success: false,
                    error: 'Network error',
                    message: 'Unable to reach the transcript service'
                };
                return NextResponse.json(networkErrorResponse, { status: 503 });
            }
        }

        const errorResponse: ApiErrorResponse = {
            success: false,
            error: 'Failed to create transcript',
            message: error instanceof Error ? error.message : 'Unknown error'
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