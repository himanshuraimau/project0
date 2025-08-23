"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { YouTubePlayer } from './YouTubePlayer';
import { YouTubeFallback } from './YouTubeFallback';
import { LoadingState } from '@/components/ui/loading-spinner';
import { BookOpen, Play, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Chapter } from '@prisma/client';
import axios from 'axios';
import { toast } from 'sonner';

interface ChapterViewProps {
    chapter: Chapter;
    onComplete?: () => void;
}

interface ChapterData extends Chapter {
    summary?: string;
    videoId?: string;
}

export function ChapterView({ chapter, onComplete }: ChapterViewProps) {
    const [chapterData, setChapterData] = useState<ChapterData>(chapter);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCompleted, setIsCompleted] = useState(false);

    const loadChapterContent = async () => {
        if (chapterData.videoId && chapterData.summary) {
            return; // Already loaded
        }

        try {
            setIsLoading(true);
            setError(null);

            const response = await axios.post("/api/chapter/getInfo", {
                chapterId: chapter.id,
            });

            if (response.data.success) {
                // Refetch the chapter data to get updated videoId and summary
                const updatedResponse = await axios.get(`/api/chapter/${chapter.id}`);
                setChapterData(updatedResponse.data);
            } else {
                throw new Error(response.data.error || 'Failed to load chapter content');
            }
        } catch (error: any) {
            console.error('Error loading chapter content:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Failed to load chapter content';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsCompleted = () => {
        setIsCompleted(true);
        onComplete?.();
        toast.success('Chapter completed!');
    };

    useEffect(() => {
        loadChapterContent();
    }, []);

    if (isLoading) {
        return (
            <Card className="w-full">
                <CardContent className="p-6">
                    <LoadingState message="Loading chapter content..." />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Chapter Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                {chapterData.name}
                            </CardTitle>
                            {chapterData.youtubeSearchQuery && (
                                <Badge variant="secondary" className="text-xs">
                                    {chapterData.youtubeSearchQuery}
                                </Badge>
                            )}
                        </div>
                        {isCompleted && (
                            <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                            </Badge>
                        )}
                    </div>
                </CardHeader>
            </Card>

            {/* Error State */}
            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-red-700">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">{error}</span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadChapterContent}
                            className="mt-2"
                        >
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Video Player */}
            {chapterData.videoId && (
                <YouTubePlayer
                    videoId={chapterData.videoId}
                    title={chapterData.name}
                />
            )}

            {/* Chapter Summary */}
            {chapterData.summary && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="h-4 w-4" />
                            Chapter Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground leading-relaxed">
                            {chapterData.summary}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Completion Button */}
            {chapterData.videoId && chapterData.summary && !isCompleted && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium">Ready to continue?</h4>
                                <p className="text-sm text-muted-foreground">
                                    Mark this chapter as completed to track your progress.
                                </p>
                            </div>
                            <Button onClick={markAsCompleted}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Complete
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Loading State for Missing Content */}
            {!chapterData.videoId && !error && (
                <Card className="border-dashed">
                    <CardContent className="p-6 text-center">
                        <Play className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground">
                            Video content will be loaded automatically
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default ChapterView;