import { useState, useEffect, useCallback } from 'react';
import { podcastApi } from '@/lib/api';

interface PodcastJob {
    jobId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    progress: number;
    currentStep?: string;
    audioUrl?: string;
    audioDuration?: number;
    transcript?: any[];
    error?: string;
}

export function usePodcastGeneration() {
    const [job, setJob] = useState<PodcastJob | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Start podcast generation
    const generate = useCallback(async (
        noteId: string,
        noteContent: string,
        duration: 'short' | 'long' = 'short'
    ) => {
        try {
            setIsGenerating(true);

            const response = await podcastApi.generatePodcast({
                noteId,
                noteContent,
                duration,
            });

            setJob({
                jobId: response.jobId,
                status: response.status as any || 'queued',
                progress: 0,
            });

            return response.jobId;
        } catch (error) {
            console.error('Generation error:', error);
            setIsGenerating(false);
            throw error;
        }
    }, []);

    // Poll for job status
    useEffect(() => {
        if (!job?.jobId || job.status === 'completed' || job.status === 'failed') {
            setIsGenerating(false);
            return;
        }

        const interval = setInterval(async () => {
            try {
                const jobData = await podcastApi.getPodcastStatus(job.jobId);

                setJob({
                    jobId: job.jobId,
                    status: jobData.status,
                    progress: jobData.progress,
                    currentStep: jobData.currentStep,
                    audioUrl: jobData.audioUrl,
                    audioDuration: jobData.audioDuration,
                    transcript: jobData.transcript,
                    error: jobData.error,
                });

                if (jobData.status === 'completed' || jobData.status === 'failed') {
                    setIsGenerating(false);
                }
            } catch (error) {
                console.error('Status check error:', error);
            }
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(interval);
    }, [job?.jobId, job?.status]);

    const reset = useCallback(() => {
        setJob(null);
        setIsGenerating(false);
    }, []);

    return {
        job,
        isGenerating,
        generate,
        reset,
    };
}
