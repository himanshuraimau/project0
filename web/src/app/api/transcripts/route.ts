import { NextRequest, NextResponse } from 'next/server';
import { TranscriptService } from '@/lib/transcript-service';
import { auth } from '@clerk/nextjs/server';
import { ApiResponse, ApiSuccessResponse, ApiErrorResponse, YouTubeProcessRequest } from '@/lib/types';
import { UserService } from '@/lib/user-service';

const transcriptService = new TranscriptService();

// GET /api/transcripts - Get user's transcripts
export async function GET() {
    try {
        const { userId } = await auth();

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
        const { userId } = await auth();

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

        // Check if user has enough credits (1 credit for YouTube transcription)
        const hasEnoughCredits = await UserService.hasEnoughCredits(userId, 1);
        if (!hasEnoughCredits) {
            const errorResponse: ApiErrorResponse = {
                success: false,
                error: 'Insufficient credits. You need 1 credit to process YouTube videos.'
            };
            return NextResponse.json(errorResponse, { status: 402 });
        }

        // Process and save the transcript
        const transcript = await transcriptService.processYoutubeTranscript(
            videoUrl,
            userId
        );

        // Deduct 1 credit for YouTube transcription
        await UserService.deductCredits('youtube_transcription', 1, transcript.id);

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
        const { userId } = await auth();

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