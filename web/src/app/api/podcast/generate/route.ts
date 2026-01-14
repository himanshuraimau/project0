import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuth } from '@/lib/auth-helper';
import { prisma } from '@/lib/prisma';
import { generateVoiceTranscript } from '@/lib/services/transcript-generator';
import { getUnrealSpeechService } from '@/lib/services/unreal-speech';

export async function POST(request: NextRequest) {
    try {
        const userId = await getUserFromAuth(request);
        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { noteId, noteContent } = await request.json();

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

        // Check if podcast already exists for this note
        const existingPodcast = await prisma.podcast.findFirst({
            where: {
                noteId,
                status: 'COMPLETED'
            },
        });

        if (existingPodcast) {
            return NextResponse.json({
                success: true,
                jobId: existingPodcast.id,
                podcastId: existingPodcast.id,
                status: 'completed',
                audioUrl: existingPodcast.audioUrl,
                message: 'Podcast already exists',
            });
        }

        // Create initial database record
        const podcast = await prisma.podcast.create({
            data: {
                noteId,
                userId,
                status: 'GENERATING',
                progress: 10,
                title: `Audio: ${note.title}`,
                description: `AI-generated audio narration from note`,
            },
        });

        try {
            // Step 1: Generate voice-friendly transcript from notes
            await prisma.podcast.update({
                where: { id: podcast.id },
                data: { progress: 20 },
            });


            const transcriptResult = await generateVoiceTranscript(noteContent, note.title);

            // Step 2: Generate audio using Unreal Speech
            await prisma.podcast.update({
                where: { id: podcast.id },
                data: { progress: 50 },
            });

            const unrealService = getUnrealSpeechService();
            const { audioUrl, response } = await unrealService.generateAndDownloadAudio(
                transcriptResult.transcript,
                { VoiceId: 'Sierra' }
            );

            // Step 3: Update database with completed status
            // Note: Using Unreal Speech URL directly (expires in 90 days)
            await prisma.podcast.update({
                where: { id: podcast.id },
                data: { progress: 90 },
            });

            const completedPodcast = await prisma.podcast.update({
                where: { id: podcast.id },
                data: {
                    status: 'COMPLETED',
                    progress: 100,
                    audioUrl: audioUrl,
                    duration: transcriptResult.estimatedDurationSeconds,
                    transcript: JSON.stringify([{ text: transcriptResult.transcript }]),
                    completedAt: new Date(),
                },
            });

            return NextResponse.json({
                success: true,
                jobId: podcast.id,
                podcastId: podcast.id,
                status: 'completed',
                audioUrl: audioUrl,
                audioDuration: transcriptResult.estimatedDurationSeconds,
                message: 'Audio generated successfully',
            });

        } catch (generationError: any) {
            // Mark as failed if generation errors
            await prisma.podcast.update({
                where: { id: podcast.id },
                data: {
                    status: 'FAILED',
                    errorMessage: generationError.message || 'Generation failed',
                },
            });

            throw generationError;
        }

    } catch (error: any) {
        console.error('Generate audio error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate audio' },
            { status: 500 }
        );
    }
}
