import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuth } from '@/lib/auth-helper';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ noteId: string }> }
) {
    try {
        const authUserId = await getUserFromAuth(request);
        if (!authUserId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { noteId } = await params;

        // Get podcasts for this note
        const podcasts = await prisma.podcast.findMany({
            where: {
                noteId,
                // Optional: verify user has access to this note
                note: {
                    OR: [
                        { userId: authUserId },
                        { userId: null } // Public notes
                    ]
                }
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
                status: true,
                progress: true,
                errorMessage: true,
                title: true,
                description: true,
                createdAt: true,
                completedAt: true,
            },
        });

        return NextResponse.json({ success: true, podcasts });
    } catch (error: any) {
        console.error('Get note podcasts error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get podcasts' },
            { status: 500 }
        );
    }
}
