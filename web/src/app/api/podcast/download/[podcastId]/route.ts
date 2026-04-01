import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuth } from '@/lib/auth-helper';
import { prisma } from '@/lib/prisma';
import { getPlayableAudioUrl } from '@/lib/s3-audio';

/**
 * Download podcast audio file
 * This endpoint provides a secure way to download podcast audio files
 * with proper authentication and CORS handling
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ podcastId: string }> }
) {
    try {
        const userId = await getUserFromAuth(request);
        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { podcastId } = await params;

        // Get podcast and verify access
        const podcast = await prisma.podcast.findUnique({
            where: { id: podcastId },
            select: {
                id: true,
                audioUrl: true,
                title: true,
                userId: true,
                status: true,
            },
        });

        if (!podcast) {
            return NextResponse.json(
                { error: 'Podcast not found' },
                { status: 404 }
            );
        }

        // Verify user has access
        if (podcast.userId !== userId) {
            return NextResponse.json(
                { error: 'Unauthorized access to podcast' },
                { status: 403 }
            );
        }

        // Check if podcast is completed
        if (podcast.status !== 'COMPLETED' || !podcast.audioUrl) {
            return NextResponse.json(
                { error: 'Podcast audio not available' },
                { status: 400 }
            );
        }

        // Resolve presigned URL if stored as s3:// key
        const resolvedUrl = await getPlayableAudioUrl(podcast.audioUrl);

        // Fetch the audio file
        const audioResponse = await fetch(resolvedUrl);
        
        if (!audioResponse.ok) {
            throw new Error('Failed to fetch audio file');
        }

        const audioBuffer = await audioResponse.arrayBuffer();

        // Return the audio file with proper headers
        return new NextResponse(audioBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': `attachment; filename="${podcast.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_podcast.mp3"`,
                'Content-Length': audioBuffer.byteLength.toString(),
            },
        });
    } catch (error: any) {
        console.error('Download podcast error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to download podcast' },
            { status: 500 }
        );
    }
}
