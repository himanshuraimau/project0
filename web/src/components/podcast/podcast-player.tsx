"use client";

import React, { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  Download,
  FileText,
  RefreshCw,
  Trash2,
  Clock,
  Users,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils/audio-utils";
import { useAudioPlayer } from "@/lib/hooks/use-audio-player";
import { PodcastControls } from "./podcast-controls";
import { PodcastErrorBoundary } from "./podcast-error-boundary";
import { PodcastPlaybackError, PodcastErrorDisplay } from "./podcast-error-components";
import { usePodcastRetry } from "@/hooks/use-podcast-retry";
import type { Podcast } from "@/lib/types/podcast";
import { PodcastSkeleton } from "./podcast-skeleton";
import { displayPodcastError } from "@/lib/utils/podcast-error-handler";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PodcastPlayerProps {
  podcast: Podcast;
  transcript?: string;
  noteTitle?: string;
  onRegenerateClick: () => void;
  onDownloadClick: () => void;
  onViewTranscriptClick: () => void;
  onDeleteClick: () => void;
  className?: string;
  compact?: boolean;
  loading?: boolean;
}

function PodcastPlayerInner({
  podcast,
  transcript,
  noteTitle,
  onRegenerateClick,
  onDownloadClick,
  onViewTranscriptClick,
  onDeleteClick,
  className,
  compact = false,
  loading = false,
}: PodcastPlayerProps) {
  // Enhanced retry mechanism for playback operations
  const retryHook = usePodcastRetry(
    { operation: 'play', podcastId: podcast.id, noteId: podcast.noteId, timestamp: new Date() },
    {
      operation: 'playback',
      autoRetry: true,
      showToast: false, // We'll handle errors with custom UI
      onRetryStart: (retryCount) => {
        console.log(`Starting audio playback retry attempt ${retryCount}`);
      },
      onRetrySuccess: (retryCount) => {
        console.log(`Audio playback succeeded after ${retryCount} retries`);
      }
    }
  );

  // Audio player hook with enhanced error handling
  const { state, controls } = useAudioPlayer(podcast.audioUrl, {
    preload: 'metadata',
    onError: (error) => {
      console.error('Audio playback error:', error);
      
      // Display user-friendly error
      displayPodcastError(error, {
        operation: 'play',
        podcastId: podcast.id,
        noteId: podcast.noteId,
        timestamp: new Date()
      }, {
        showToast: false // We'll show inline error instead
      });
    },
    onTimeUpdate: (currentTime) => {
      // This could be used for transcript synchronization
      // Will be implemented when transcript sync is added
    },
  });

  // Handle download with enhanced error handling
  const handleDownload = useCallback(async () => {
    if (!podcast.audioUrl) return;
    
    const context = {
      operation: 'download' as const,
      podcastId: podcast.id,
      noteId: podcast.noteId,
      timestamp: new Date()
    };
    
    try {
      await retryHook.executeWithRetry(async () => {
        const link = document.createElement('a');
        link.href = podcast.audioUrl!;
        link.download = `${noteTitle || 'podcast'}-${podcast.id}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Verify download started (basic check)
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            document.body.removeChild(link);
            resolve();
          }, 100);
        });
      }, context);
      
      onDownloadClick();
    } catch (error) {
      console.error('Download error:', error);
      displayPodcastError(error, context, {
        showToast: true,
        onRetry: retryHook.canRetry() ? handleDownload : undefined
      });
    }
  }, [podcast.audioUrl, podcast.id, podcast.noteId, noteTitle, onDownloadClick, retryHook]);

  // Get podcast metadata
  const getPodcastMetadata = () => {
    const metadata = [];
    
    if (podcast.mode) {
      metadata.push({
        icon: podcast.mode === 'CONVERSATION' ? Users : User,
        label: podcast.mode === 'CONVERSATION' ? 'Conversation' : 'Bulletin',
        value: podcast.mode === 'CONVERSATION' ? 'Multi-voice' : 'Single voice',
      });
    }
    
    if (podcast.duration) {
      metadata.push({
        icon: Clock,
        label: 'Duration',
        value: formatTime(podcast.duration),
      });
    }
    
    if (podcast.qualityPreset) {
      metadata.push({
        icon: Mic,
        label: 'Quality',
        value: podcast.qualityPreset.toLowerCase().replace('_', ' '),
      });
    }
    
    return metadata;
  };

  const metadata = getPodcastMetadata();

  // Show loading state
  if (loading) {
    return compact ? (
      <PodcastSkeleton variant="compact" className={className} />
    ) : (
      <PodcastSkeleton variant="player" className={className} />
    );
  }

  if (compact) {
    return (
      <Card className={cn("neomorphic border-0", className)}>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="neomorphic-icon w-10 h-10 rounded-lg flex items-center justify-center">
                  <Mic className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm truncate">
                    {noteTitle || 'Podcast'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {podcast.mode === 'CONVERSATION' ? 'Conversation' : 'Bulletin'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  onClick={handleDownload}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Download className="h-3 w-3" />
                </Button>
                <Button
                  onClick={onViewTranscriptClick}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <FileText className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Controls */}
            <PodcastControls
              state={state}
              controls={controls}
              compact={true}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Podcast Player</h2>
          <p className="text-muted-foreground">
            {noteTitle || 'Generated from your notes'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={onRegenerateClick}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            onClick={onViewTranscriptClick}
            variant="outline"
            size="sm"
          >
            <FileText className="h-4 w-4 mr-2" />
            Transcript
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Podcast</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this podcast? This action
                  cannot be undone and will remove the audio file permanently.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDeleteClick}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Main Player Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audio Player Card */}
        <Card className="neomorphic border-0">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="neomorphic-icon w-12 h-12 rounded-xl flex items-center justify-center">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">
                  {noteTitle || 'Podcast'}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {podcast.mode === 'CONVERSATION' ? 'Conversation' : 'Bulletin'}
                  </Badge>
                  {podcast.qualityPreset && (
                    <Badge variant="outline" className="text-xs">
                      {podcast.qualityPreset.toLowerCase().replace('_', ' ')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Metadata */}
            {metadata.length > 0 && (
              <div className="grid grid-cols-1 gap-3">
                {metadata.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{item.label}:</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Audio Controls */}
            <PodcastControls
              state={state}
              controls={controls}
            />

            {/* Additional Info */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Created: {new Date(podcast.createdAt).toLocaleDateString()}</p>
              {podcast.fileSize && (
                <p>File size: {(podcast.fileSize / (1024 * 1024)).toFixed(1)} MB</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transcript Preview Card */}
        <Card className="neomorphic border-0">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Transcript Preview
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {transcript ? (
                <div className="max-h-64 overflow-y-auto">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {transcript.length > 500 
                        ? `${transcript.substring(0, 500)}...` 
                        : transcript
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    Transcript will be synchronized with audio playback
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click "Transcript" to view the full synchronized version
                  </p>
                </div>
              )}
              
              {transcript && transcript.length > 500 && (
                <Button
                  onClick={onViewTranscriptClick}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  View Full Transcript
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Audio Error Display */}
      {state.error && (
        <PodcastPlaybackError
          error={state.error}
          onRetry={() => {
            // Reload the audio element and attempt to play
            if (controls.play) {
              controls.play();
            }
          }}
          onDownload={handleDownload}
          audioUrl={podcast.audioUrl || undefined}
        />
      )}
    </div>
  );
}

// Wrap the component with error boundary
export function PodcastPlayer(props: PodcastPlayerProps) {
  const context = { 
    operation: 'play' as const, 
    podcastId: props.podcast.id,
    noteId: props.podcast.noteId,
    timestamp: new Date() 
  };

  return (
    <PodcastErrorBoundary
      context={context}
      onRetry={() => window.location.reload()}
      onRegenerate={props.onRegenerateClick}
      showRecoveryOptions={true}
    >
      <PodcastPlayerInner {...props} />
    </PodcastErrorBoundary>
  );
}