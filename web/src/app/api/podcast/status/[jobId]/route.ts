import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPlayableAudioUrl } from '@/lib/s3-audio';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const { jobId } = await params;

        // Get podcast status from database
        const podcast = await prisma.podcast.findFirst({
            where: {
                OR: [
                    { id: jobId },
                    { jobId: jobId },
                ],
            },
        });

        if (!podcast) {
            return NextResponse.json(
                { error: 'Podcast not found' },
                { status: 404 }
            );
        }

        // Map database status to API response
        const statusMap: Record<string, string> = {
            'GENERATING': 'processing',
            'COMPLETED': 'completed',
            'FAILED': 'failed',
        };

        // Generate a presigned URL if the audio is stored in S3
        const audioUrl = podcast.audioUrl
            ? await getPlayableAudioUrl(podcast.audioUrl)
            : null;

        return NextResponse.json({
            success: true,
            job: {
                jobId: podcast.id,
                status: statusMap[podcast.status] || 'processing',
                progress: podcast.progress || 0,
                currentStep: podcast.status === 'GENERATING' ? 'Generating audio...' : undefined,
                audioUrl,
                audioDuration: podcast.duration,
                transcript: podcast.transcript ? JSON.parse(podcast.transcript as string) : null,
                error: podcast.errorMessage,
            },
        });
    } catch (error: any) {
        console.error('Job status error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get job status' },
            { status: 500 }
        );
    }
}
