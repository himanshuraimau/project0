"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { YouTubePlayer } from "./YouTubePlayer";
import { LoadingState } from "@/components/ui/loading-spinner";
import { BookOpen, Play, FileText, CheckCircle } from "lucide-react";
import { Chapter } from "@prisma/client";
import { useChapterProgress } from "@/hooks/use-chapter-progress";
import {
  displayError,
  fetchWithErrorHandling,
} from "@/lib/utils/client-error-handler";
import { InlineErrorDisplay } from "@/components/ui/error-components";
import { LexicalViewer } from "@/components/shared/LexicalViewer";

interface ChapterViewProps {
  chapter: Chapter;
  onComplete?: () => void;
}

interface ChapterResponse {
  success: boolean;
  data?: Chapter;
  message?: string;
}

export function ChapterView({ chapter, onComplete }: ChapterViewProps) {
  const [chapterData, setChapterData] = useState<Chapter>(chapter);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    progress: chapterProgress,
    updating: chapterUpdating,
    toggleCompletion,
  } = useChapterProgress(chapter.id);

  const loadChapterContent = useCallback(async () => {
    if (chapterData.videoId && chapterData.notes) {
      return; // Already loaded
    }

    // Don't try to load content if there's no search query
    if (!chapterData.youtubeSearchQuery) {
      setError("No content available for this chapter yet.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchWithErrorHandling<ChapterResponse>(
        "/api/chapter/info",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ chapterId: chapter.id }),
        },
        {
          showToast: true,
        }
      );

      if (response?.success) {
        // Refetch the chapter data to get updated videoId and summary
        const updatedResponse = await fetchWithErrorHandling<Chapter>(
          `/api/chapter/${chapter.id}`,
          undefined,
          {
            showToast: false,
          }
        );

        if (updatedResponse) {
          setChapterData(updatedResponse);
        }
      } else {
        setError("Failed to load chapter content");
      }
    } catch (err) {
      const errorInfo = displayError(err, { showToast: false });
      setError(errorInfo.userMessage);
    } finally {
      setIsLoading(false);
    }
  }, [
    chapter.id,
    chapterData.videoId,
    chapterData.notes,
    chapterData.youtubeSearchQuery,
  ]);

  const markAsCompleted = async () => {
    await toggleCompletion();
    onComplete?.();
  };

  useEffect(() => {
    loadChapterContent();
  }, [loadChapterContent]);

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
            {chapterProgress.isCompleted && (
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
        <InlineErrorDisplay
          error={error}
          onRetry={() => loadChapterContent()}
          className="mb-4"
        />
      )}

      {/* Video Player */}
      {chapterData.videoId && (
        <YouTubePlayer videoId={chapterData.videoId} title={chapterData.name} />
      )}

      {/* Chapter Notes */}
      {chapterData.notes && (
        <div>
          <div className="mb-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <FileText className="h-4 w-4" />
              Chapter Notes
            </h3>
          </div>
          <LexicalViewer
            content={chapterData.notes}
            title={chapterData.name}
            showToolbar={false}
            minHeight="400px"
          />
        </div>
      )}

      {/* Completion Button */}
      {chapterData.videoId && chapterData.notes && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">
                  {chapterProgress.isCompleted
                    ? "Chapter Completed!"
                    : "Ready to continue?"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {chapterProgress.isCompleted
                    ? "You can undo completion if needed."
                    : "Mark this chapter as completed to track your progress."}
                </p>
              </div>
              <Button
                onClick={markAsCompleted}
                disabled={chapterUpdating}
                variant={chapterProgress.isCompleted ? "outline" : "default"}
              >
                {chapterUpdating ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                ) : chapterProgress.isCompleted ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {chapterProgress.isCompleted
                  ? "Undo Complete"
                  : "Mark Complete"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State for Missing Content */}
      {!chapterData.videoId && !error && !isLoading && (
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
