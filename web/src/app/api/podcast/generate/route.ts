import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuth } from '@/lib/auth-helper';
import { prisma } from '@/lib/prisma';

const PODCAST_API_URL = process.env.PODCAST_API_URL;
const PODCAST_API_KEY = process.env.PODCAST_API_KEY;

export async function POST(request: NextRequest) {
    try {   
        const userId = await getUserFromAuth(request);
        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { noteId, noteContent, duration = 'short' } = await request.json();

        // Validate input
        if (!noteId || !noteContent) {
            return NextResponse.json(
                { error: 'Missing required fields: noteId and noteContent' },
                { status: 400 }
            );
        }

        // Validate note exists and user has access
        const note = await prisma.note.findUnique({
            where: { id: noteId },
            select: { id: true, title: true, userId: true },
        });

        if (!note) {
            return NextResponse.json(
                { error: 'Note not found' },
                { status: 404 }
            );
        }

        if (note.userId && note.userId !== userId) {
            return NextResponse.json(
                { error: 'Unauthorized access to note' },
                { status: 403 }
            );
        }

        // Create initial database record
        const podcast = await prisma.podcast.create({
            data: {
                noteId,
                userId,
                status: 'GENERATING',
                progress: 0,
                title: `Podcast: ${note.title}`,
                description: `AI-generated podcast from note`,
            },
        });

        // Call microservice async endpoint (returns instantly!)
        const response = await fetch(`${PODCAST_API_URL}/generate/async`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': PODCAST_API_KEY!,
            },
            body: JSON.stringify({
                noteId,
                noteContent,
                userId,
                duration,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to start podcast generation');
        }

        const data = await response.json();

        // Update podcast with jobId
        await prisma.podcast.update({
            where: { id: podcast.id },
            data: { jobId: data.jobId },
        });

        return NextResponse.json({
            success: true,
            jobId: data.jobId,
            podcastId: podcast.id,
            status: data.status,
            message: 'Podcast generation started',
        });
    } catch (error: any) {
        console.error('Generate podcast error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate podcast' },
            { status: 500 }
        );
    }
}
