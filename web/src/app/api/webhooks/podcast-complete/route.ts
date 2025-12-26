import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        // 1. Verify webhook secret for security
        const secret = request.headers.get('x-webhook-secret');
        if (secret !== process.env.WEBHOOK_SECRET) {
            console.error('❌ Invalid webhook secret');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse webhook payload
        const payload = await request.json();
        console.log('📥 Webhook received:', payload.event, payload.jobId);

        // 3. Handle completion event
        if (payload.event === 'podcast.completed') {
            // Save to database
            await prisma.podcast.upsert({
                where: { jobId: payload.jobId },
                create: {
                    noteId: payload.noteId,
                    userId: payload.userId,
                    jobId: payload.jobId,
                    podcastId: payload.podcastId,
                    audioUrl: payload.audioUrl,
                    duration: payload.audioDuration,
                    transcript: payload.transcript || [],
                    status: 'COMPLETED',
                    progress: 100,
                    title: `Podcast: ${payload.noteTitle || 'Untitled'}`,
                    description: `AI-generated podcast`,
                    completedAt: new Date(),
                },
                update: {
                    podcastId: payload.podcastId,
                    audioUrl: payload.audioUrl,
                    duration: payload.audioDuration,
                    transcript: payload.transcript || [],
                    status: 'COMPLETED',
                    progress: 100,
                    errorMessage: null,
                    completedAt: new Date(),
                },
            });

            console.log(`✅ Podcast saved for note ${payload.noteId}`);
        }

        // 4. Handle failure event
        else if (payload.event === 'podcast.failed') {
            await prisma.podcast.upsert({
                where: { jobId: payload.jobId },
                create: {
                    noteId: payload.noteId,
                    userId: payload.userId,
                    jobId: payload.jobId,
                    status: 'FAILED',
                    errorMessage: payload.error,
                    title: `Podcast: ${payload.noteTitle || 'Untitled'}`,
                },
                update: {
                    status: 'FAILED',
                    errorMessage: payload.error,
                },
            });

            console.error(`❌ Podcast failed for note ${payload.noteId}: ${payload.error}`);

            // Optional: Notify user of failure
            // await sendNotification(payload.userId, {
            //   title: 'Podcast Generation Failed',
            //   body: 'Please try again',
            // });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
