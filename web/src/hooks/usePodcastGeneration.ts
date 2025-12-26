'use client';

import { useState, useEffect, useCallback } from 'react';

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

            const response = await fetch('/api/podcast/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ noteId, noteContent, duration }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to start generation');
            }

            const data = await response.json();

            setJob({
                jobId: data.jobId,
                status: data.status || 'queued',
                progress: 0,
            });

            return data.jobId;
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
                const response = await fetch(`/api/podcast/status/${job.jobId}`);
                const data = await response.json();

                if (data.success && data.job) {
                    setJob(data.job);

                    if (data.job.status === 'completed' || data.job.status === 'failed') {
                        clearInterval(interval);
                        setIsGenerating(false);
                    }
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
