"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BatchProgressStepProps, UnitWithChapters, Chapter } from "@/lib/types/course.types";
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  AlertCircle,
  PlayCircle 
} from "lucide-react";
import { LoadingState } from "@/components/ui/loading-spinner";

/**
 * BatchProgressStep component displays real-time progress of chapter generation batches
 * Shows which units are completed, processing, and pending with visual indicators
 */
export function BatchProgressStep({
  courseTitle,
  units,
  batchState,
  errorState,
  onProcessNextBatch,
  onRetry,
  onComplete,
}: BatchProgressStepProps) {
  
  // Auto-process batches when not in error state
  useEffect(() => {
    if (!batchState.isProcessing || errorState.hasError) return;

    const processNextIfReady = async () => {
      if (batchState.currentBatchIndex < batchState.totalBatches && 
          batchState.processingChapters.length === 0) {
        try {
          await onProcessNextBatch();
        } catch (error) {
          // Error handling is done by the parent component
          console.error('Batch processing error:', error);
        }
      } else if (batchState.currentBatchIndex >= batchState.totalBatches) {
        // All batches completed
        onComplete();
      }
    };

    // Small delay to allow UI updates
    const timeoutId = setTimeout(processNextIfReady, 500);
    return () => clearTimeout(timeoutId);
  }, [
    batchState.currentBatchIndex, 
    batchState.isProcessing, 
    batchState.processingChapters.length,
    batchState.totalBatches,
    errorState.hasError,
    onProcessNextBatch,
    onComplete
  ]);

  // Helper function to get chapter status
  const getChapterStatus = (chapterId: string) => {
    if (batchState.completedChapters.includes(chapterId)) return 'completed';
    if (batchState.processingChapters.includes(chapterId)) return 'processing';
    return 'pending';
  };

  // Get all chapters across all units
  const allChapters: Array<{ chapter: Chapter; unitName: string; unitIndex: number; chapterIndex: number }> = [];
  units.forEach((unit, unitIndex) => {
    unit.chapters.forEach((chapter, chapterIndex) => {
      allChapters.push({
        chapter,
        unitName: unit.name,
        unitIndex,
        chapterIndex
      });
    });
  });

  const totalChapters = allChapters.length;

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  // Helper function to get status text color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'processing':
        return 'text-blue-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const isCompleted = batchState.processingProgress >= 100;
  const currentBatchText = batchState.currentBatchIndex + 1;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Generating Chapter Content
        </h2>
        <p className="text-muted-foreground">
          Fetching YouTube videos and generating content for your chapters in batches
        </p>
      </div>

      {/* Course Info Header */}
      <Card className="max-w-4xl mx-auto border-border/60 bg-card/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-accent/5 to-accent/10 border-b border-border/40">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <BookOpen className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">{courseTitle}</h3>
              <p className="text-sm text-muted-foreground font-normal">
                {units.length} units • {totalChapters} chapters • Processing in batches of {batchState.batchSize}
              </p>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Progress Overview */}
      <Card className="max-w-4xl mx-auto border-border/40 bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Content Generation Progress</h3>
            <div className="text-sm text-muted-foreground">
              {isCompleted ? (
                <span className="text-green-600 font-medium">Completed!</span>
              ) : (
                `Batch ${currentBatchText} of ${batchState.totalBatches}`
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{batchState.processingProgress}%</span>
            </div>
            <Progress value={batchState.processingProgress} className="h-3" />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-600">
                {batchState.completedChapters.length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-blue-600">
                {batchState.processingChapters.length}
              </div>
              <div className="text-sm text-muted-foreground">Processing</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-muted-foreground">
                {totalChapters - batchState.completedChapters.length - batchState.processingChapters.length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Processing Status */}
      {batchState.isProcessing && !isCompleted && (
        <Card className="max-w-4xl mx-auto">
          <CardContent className="pt-6">
            <LoadingState
              message={`Processing Batch ${currentBatchText}`}
              submessage={`Generating content for ${batchState.processingChapters.length} chapters...`}
              variant="ai"
              className="bg-blue-50 border border-blue-200 rounded-lg"
            />
          </CardContent>
        </Card>
      )}

      {/* Chapters List with Status */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <h3 className="text-lg font-semibold">Chapter Content Status</h3>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {allChapters.map((item, index) => {
              const status = getChapterStatus(item.chapter.id);
              const chapterNumber = `${item.unitIndex + 1}.${item.chapterIndex + 1}`;
              
              return (
                <div
                  key={item.chapter.id}
                  className={`flex items-center justify-between p-4 transition-colors ${
                    status === 'processing' ? 'bg-blue-50' : 
                    status === 'completed' ? 'bg-green-50' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex-shrink-0 w-12 h-8 bg-muted text-muted-foreground rounded flex items-center justify-center text-sm font-medium">
                      {chapterNumber}
                    </div>
                    
                    <div className="flex-1">
                      <h5 className="font-medium text-foreground">
                        {item.chapter.name}
                      </h5>
                      <p className="text-xs text-muted-foreground mb-1">
                        Unit: {item.unitName}
                      </p>
                      <div className="flex items-center space-x-2">
                        <PlayCircle className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {status === 'completed' 
                            ? 'Content generated successfully' 
                            : `Search: ${item.chapter.youtubeSearchQuery}`
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center space-x-2 ${getStatusColor(status)}`}>
                      {getStatusIcon(status)}
                      <span className="text-sm font-medium capitalize">
                        {status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {errorState.hasError && (
        <Card className="max-w-4xl mx-auto border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-destructive mb-2">
                  Batch Processing Error
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {errorState.error?.message || 'An error occurred while processing the current batch.'}
                </p>
                {errorState.error?.retryable && (
                  <Button 
                    onClick={onRetry}
                    variant="outline" 
                    size="sm"
                    className="border-destructive text-destructive hover:bg-destructive/10"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Current Batch
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion State */}
      {isCompleted && (
        <Card className="max-w-4xl mx-auto border-green-200/50 bg-gradient-to-br from-green-50/20 to-green-100/20 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="p-3 bg-green-100/20 rounded-full w-fit mx-auto">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2">
                  Chapter Content Generation Complete!
                </h3>
                <p className="text-green-600 dark:text-green-300">
                  All {totalChapters} chapters have been processed successfully. 
                  Your course is ready to navigate!
                </p>
              </div>
              <Button 
                onClick={onComplete}
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                size="lg"
              >
                Go to Course
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}