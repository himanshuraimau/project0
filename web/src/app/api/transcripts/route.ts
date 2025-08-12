import { NextRequest, NextResponse } from 'next/server';
import { TranscriptService } from '@/lib/transcript-service';
import { auth } from '@clerk/nextjs/server';

const transcriptService = new TranscriptService();

// GET /api/transcripts - Get user's transcripts
export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const transcripts = await transcriptService.getTranscriptsByUser(userId);

        return NextResponse.json({
            success: true,
            data: transcripts,
        });

    } catch (error) {
        console.error('Error fetching transcripts:', error);

        return NextResponse.json(
            {
                error: 'Failed to fetch transcripts',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// POST /api/transcripts - Create a new transcript from YouTube URL
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { videoUrl } = body;

        if (!videoUrl) {
            return NextResponse.json(
                { error: 'Video URL is required' },
                { status: 400 }
            );
        }

        // Validate YouTube URL format
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)/;
        if (!youtubeRegex.test(videoUrl)) {
            return NextResponse.json(
                { error: 'Invalid YouTube URL format' },
                { status: 400 }
            );
        }

        // Process and save the transcript
        const transcript = await transcriptService.processYoutubeTranscript(
            videoUrl,
            userId
        );

        return NextResponse.json({
            success: true,
            data: transcript,
            message: 'Transcript created successfully',
        });

    } catch (error) {
        console.error('Error creating transcript:', error);

        // Handle specific error types
        if (error instanceof Error) {
            if (error.message.includes('API Error')) {
                return NextResponse.json(
                    {
                        error: 'External API error',
                        message: error.message
                    },
                    { status: 502 }
                );
            }

            if (error.message.includes('Network Error')) {
                return NextResponse.json(
                    {
                        error: 'Network error',
                        message: 'Unable to reach the transcript service'
                    },
                    { status: 503 }
                );
            }
        }

        return NextResponse.json(
            {
                error: 'Failed to create transcript',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// DELETE /api/transcripts - Delete a transcript
export async function DELETE(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const url = new URL(request.url);
        const transcriptId = url.searchParams.get('id');

        if (!transcriptId) {
            return NextResponse.json(
                { error: 'Transcript ID is required' },
                { status: 400 }
            );
        }

        // First check if transcript belongs to user
        const transcript = await transcriptService.getTranscript(transcriptId);

        if (!transcript) {
            return NextResponse.json(
                { error: 'Transcript not found' },
                { status: 404 }
            );
        }

        if (transcript.userId !== userId) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        await transcriptService.deleteTranscript(transcriptId);

        return NextResponse.json({
            success: true,
            message: 'Transcript deleted successfully',
        });

    } catch (error) {
        console.error('Error deleting transcript:', error);

        return NextResponse.json(
            {
                error: 'Failed to delete transcript',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}