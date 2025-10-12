"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Mic,
  FileText,
  Download,
  RefreshCw,
  Trash2,
  Clock,
  Users,
  User,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Settings,
  Eye,
  EyeOff,
  Hash,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils/audio-utils";
import { useAudioPlayer } from "@/lib/hooks/use-audio-player";
import { useTranscriptSync } from "@/lib/hooks/use-transcript-sync";
import { PodcastControls } from "./podcast-controls";
import { TranscriptViewer } from "./transcript-viewer";
import { PodcastSkeleton, TranscriptSyncSkeleton } from "./podcast-skeleton";
import type { Podcast } from "@/lib/types/podcast";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PodcastLayoutProps {
  podcast: Podcast;
  noteTitle?: string;
  noteContent?: string;
  onRegenerateClick: () => void;
  onDownloadClick: () => void;
  onDeleteClick: () => void;
  className?: string;
}

export function PodcastLayout({
  podcast,
  noteTitle,
  noteContent,
  onRegenerateClick,
  onDownloadClick,
  onDeleteClick,
  className,
}: PodcastLayoutProps) {
  // State for UI controls
  const [showTranscriptViewer, setShowTranscriptViewer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Audio player hook
  const { state, controls } = useAudioPlayer(podcast.audioUrl, {
    preload: 'metadata',
    onError: (error) => {
      console.error('Audio playback error:', error);
    },
  });

  // Transcript synchronization hook
  const transcriptSync = useTranscriptSync({
    transcript: noteContent || '',
    audioDuration: state.duration,
    syncMode: 'simulated',
    autoEnhance: false,
    enableTopicExtraction: true,
  });

  // Update current time in transcript sync
  useEffect(() => {
    transcriptSync.updateCurrentTime(state.currentTime);
  }, [state.currentTime, transcriptSync]);

  // Handle download with proper filename
  const handleDownload = useCallback(() => {
    if (!podcast.audioUrl) return;
    
    try {
      const link = document.createElement('a');
      link.href = podcast.audioUrl;
      link.download = `${noteTitle || 'podcast'}-${podcast.id}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onDownloadClick();
    } catch (error) {
      console.error('Download error:', error);
    }
  }, [podcast.audioUrl, podcast.id, noteTitle, onDownloadClick]);

  // Handle time seeking from transcript
  const handleTimeSeek = useCallback((time: number) => {
    controls.seek(time);
  }, [controls]);

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

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Podcast</h2>
          <p className="text-muted-foreground">
            {noteTitle || 'Generated from your notes'}
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={onRegenerateClick}
            variant="outline"
            size="sm"
            className="flex-shrink-0"
          >
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Regenerate</span>
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="flex-shrink-0"
          >
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Download</span>
          </Button>
          <Button
            onClick={() => setShowTranscriptViewer(!showTranscriptViewer)}
            variant="outline"
            size="sm"
            className="flex-shrink-0 xl:hidden"
          >
            <FileText className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{showTranscriptViewer ? 'Hide' : 'Show'} Transcript</span>
          </Button>
          <Button
            onClick={toggleFullscreen}
            variant="outline"
            size="sm"
            className="flex-shrink-0 hidden sm:flex"
          >
            {isFullscreen ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {isFullscreen ? 'Exit' : 'Fullscreen'}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 flex-shrink-0"
              >
                <Trash2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Delete</span>
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

      {/* Main Two-Card Layout */}
      <div className={cn(
        "grid gap-6 transition-all duration-300",
        isFullscreen 
          ? "fixed inset-0 z-50 bg-background p-6 grid-cols-1 lg:grid-cols-2" 
          : "grid-cols-1 xl:grid-cols-2"
      )}>
        {/* Audio Player Card - Left Side */}
        <Card className="neomorphic border-0 flex flex-col min-h-[400px] xl:min-h-[600px]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="neomorphic-icon w-12 h-12 rounded-xl flex items-center justify-center">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate">
                  {noteTitle || 'Podcast'}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {podcast.mode === 'CONVERSATION' ? 'Conversation' : 'Bulletin'}
                  </Badge>
                  {podcast.qualityPreset && (
                    <Badge variant="outline" className="text-xs">
                      {podcast.qualityPreset.toLowerCase().replace('_', ' ')}
                    </Badge>
                  )}
                  {state.isPlaying && (
                    <Badge variant="default" className="text-xs animate-pulse">
                      Playing
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col space-y-6">
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
            <div className="flex-1 flex flex-col justify-center">
              <PodcastControls
                state={state}
                controls={controls}
              />
            </div>

            {/* Progress Information */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{formatTime(state.currentTime)}</span>
                <span>{formatTime(state.duration)}</span>
              </div>
              
              {/* Sync Progress */}
              {transcriptSync.progress > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Transcript Progress</span>
                    <span>{Math.round(transcriptSync.progress)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1">
                    <div 
                      className="bg-primary h-1 rounded-full transition-all duration-300"
                      style={{ width: `${transcriptSync.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Additional Info */}
            <Separator />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Created: {new Date(podcast.createdAt).toLocaleDateString()}</p>
              {podcast.fileSize && (
                <p>File size: {(podcast.fileSize / (1024 * 1024)).toFixed(1)} MB</p>
              )}
              {transcriptSync.syncData?.chunks && (
                <p>Transcript chunks: {transcriptSync.syncData.chunks.length}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transcript Card - Right Side */}
        <Card className="neomorphic border-0 flex flex-col min-h-[400px] xl:min-h-[600px]">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span className="hidden sm:inline">Synchronized Transcript</span>
                <span className="sm:hidden">Transcript</span>
              </CardTitle>
              
              <div className="flex items-center gap-2">
                {/* Sync mode indicator */}
                <Badge 
                  variant={transcriptSync.syncState.syncMode === 'realtime' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {transcriptSync.syncState.syncMode}
                </Badge>
                
                {/* Progress indicator */}
                <Badge variant="outline" className="text-xs">
                  {Math.round(transcriptSync.progress)}%
                </Badge>
                
                {/* Settings dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Transcript Settings</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={() => transcriptSync.setSyncMode(
                      transcriptSync.syncState.syncMode === 'realtime' ? 'simulated' : 'realtime'
                    )}>
                      <Clock className="h-4 w-4 mr-2" />
                      Toggle Sync Mode
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={transcriptSync.reprocessTranscript}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reprocess
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={transcriptSync.enhanceTranscript}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Enhance
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Topics navigation */}
            {transcriptSync.topics.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Topics</div>
                <div className="flex flex-wrap gap-2">
                  {transcriptSync.topics.slice(0, isFullscreen ? 6 : 2).map((topic, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const timestamp = transcriptSync.jumpToTopic(index);
                        if (timestamp !== null) {
                          handleTimeSeek(timestamp);
                        }
                      }}
                      className="text-left h-auto py-1 px-2 max-w-[120px] sm:max-w-none"
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-xs truncate w-full">{topic.topic}</span>
                        <span className="text-xs text-muted-foreground">
                          {Math.floor(topic.timestamp / 60)}:{String(Math.floor(topic.timestamp % 60)).padStart(2, '0')}
                        </span>
                      </div>
                    </Button>
                  ))}
                  {transcriptSync.topics.length > (isFullscreen ? 6 : 2) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTranscriptViewer(true)}
                      className="text-xs text-muted-foreground"
                    >
                      +{transcriptSync.topics.length - (isFullscreen ? 6 : 2)} more
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col">
            {transcriptSync.isProcessing ? (
              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto pr-2">
                  <TranscriptSyncSkeleton />
                </div>
              </div>
            ) : transcriptSync.error ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-red-600 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <p className="font-medium">Error processing transcript:</p>
                  <p className="text-sm mt-1">{transcriptSync.error}</p>
                  <div className="flex gap-2 mt-3 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={transcriptSync.reprocessTranscript}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={transcriptSync.enhanceTranscript}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Enhance
                    </Button>
                  </div>
                </div>
              </div>
            ) : noteContent ? (
              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                  {transcriptSync.syncData?.chunks ? (
                    <div className="space-y-2">
                      {transcriptSync.syncData.chunks.map((chunk, index) => {
                        const isActive = transcriptSync.activeChunk?.id === chunk.id;
                        const isPast = chunk.endTime !== undefined && state.currentTime > chunk.endTime;
                        const isFuture = chunk.startTime !== undefined && state.currentTime < chunk.startTime;
                        
                        return (
                          <div
                            key={chunk.id}
                            className={cn(
                              "p-3 rounded-lg transition-all duration-300 cursor-pointer",
                              "hover:bg-muted/50 active:bg-muted/70",
                              {
                                "bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500": isActive,
                                "text-muted-foreground": isPast && transcriptSync.syncState.syncMode === 'simulated',
                                "opacity-50": isFuture && transcriptSync.syncState.syncMode === 'simulated',
                              }
                            )}
                            onClick={() => {
                              if (chunk.startTime !== undefined) {
                                handleTimeSeek(chunk.startTime);
                              }
                            }}
                          >
                            <div className="flex items-start gap-2 sm:gap-3">
                              {chunk.startTime !== undefined && (
                                <div className="flex-shrink-0 text-xs text-muted-foreground font-mono mt-1 hidden sm:block">
                                  {Math.floor(chunk.startTime / 60)}:{String(Math.floor(chunk.startTime % 60)).padStart(2, '0')}
                                </div>
                              )}
                              
                              <div className="flex-1 min-w-0">
                                <div className="leading-relaxed text-sm break-words">
                                  {chunk.text}
                                </div>
                                
                                <div className="flex items-center justify-between mt-2">
                                  {chunk.speaker && (
                                    <Badge variant="secondary" className="text-xs">
                                      {chunk.speaker}
                                    </Badge>
                                  )}
                                  
                                  {chunk.startTime !== undefined && (
                                    <div className="text-xs text-muted-foreground font-mono sm:hidden">
                                      {Math.floor(chunk.startTime / 60)}:{String(Math.floor(chunk.startTime % 60)).padStart(2, '0')}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex-shrink-0 text-xs text-muted-foreground hidden sm:block">
                                #{index + 1}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div 
                        className="leading-relaxed text-sm break-words"
                        dangerouslySetInnerHTML={{ 
                          __html: transcriptSync.highlightedText || noteContent 
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    No transcript content available
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    The transcript will be synchronized with audio playback
                  </p>
                </div>
              </div>
            )}

            {/* Active chunk info */}
            {transcriptSync.activeChunk && (
              <>
                <Separator className="my-4" />
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>
                      Currently reading: 
                      <span className="font-medium ml-1">
                        Chunk {(transcriptSync.syncData?.chunks.findIndex(c => c.id === transcriptSync.activeChunk?.id) ?? -1) + 1}
                      </span>
                    </span>
                    {transcriptSync.activeChunk.speaker && (
                      <Badge variant="secondary" className="text-xs">
                        {transcriptSync.activeChunk.speaker}
                      </Badge>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Information */}
      {state.error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <div className="w-2 h-2 bg-red-600 rounded-full" />
              <span className="text-sm font-medium">Audio Error</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{state.error}</p>
          </CardContent>
        </Card>
      )}

      {/* Fullscreen Transcript Viewer Modal */}
      {showTranscriptViewer && noteContent && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto p-4 sm:p-6 h-full max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Full Transcript</h3>
              <Button
                onClick={() => setShowTranscriptViewer(false)}
                variant="outline"
                size="sm"
              >
                Close
              </Button>
            </div>
            <TranscriptViewer
              transcript={noteContent}
              currentTime={state.currentTime}
              audioDuration={state.duration}
              onTimeSeek={handleTimeSeek}
              className="h-[calc(100vh-100px)] sm:h-[calc(100vh-120px)]"
            />
          </div>
        </div>
      )}
    </div>
  );
}