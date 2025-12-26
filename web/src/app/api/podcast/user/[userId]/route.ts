import { NextRequest, NextResponse  } from 'next/server';
import { getUserFromAuth } from '@/lib/auth-helper';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const authUserId = await getUserFromAuth(request);
        if (!authUserId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { userId } = params;

        // Verify user can only access their own podcasts
        if (authUserId !== userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Get completed podcasts from database
        const podcasts = await prisma.podcast.findMany({
            where: {
                userId,
                status: 'COMPLETED'
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                noteId: true,
                jobId: true,
                podcastId: true,
                audioUrl: true,
                duration: true,
                transcript: true,
                title: true,
                description: true,
                createdAt: true,
                completedAt: true,
            },
        });

        return NextResponse.json({ success: true, podcasts });
    } catch (error: any) {
        console.error('Get user podcasts error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get podcasts' },
            { status: 500 }
        );
    }
}
