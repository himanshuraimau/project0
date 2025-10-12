"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
// ScrollArea not available, using regular div with overflow
import {
  FileText,
  Settings,
  RotateCcw,
  Sparkles,
  Clock,
  Hash,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranscriptSync } from "@/lib/hooks/use-transcript-sync";
import type { TextChunk } from "@/lib/types/podcast";
import { TranscriptSyncSkeleton } from "./podcast-skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TranscriptViewerProps {
  transcript: string;
  currentTime: number;
  audioDuration?: number;
  onTimeSeek?: (time: number) => void;
  className?: string;
  compact?: boolean;
  showTopics?: boolean;
  autoEnhance?: boolean;
  loading?: boolean;
}

export function TranscriptViewer({
  transcript,
  currentTime,
  audioDuration,
  onTimeSeek,
  className,
  compact = false,
  showTopics = true,
  autoEnhance = false,
  loading = false,
}: TranscriptViewerProps) {
  // State for UI controls
  const [showSettings, setShowSettings] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [fontSize, setFontSize] = useState('base');
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Refs for auto-scrolling
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const activeChunkRef = useRef<HTMLDivElement>(null);

  // Transcript synchronization hook
  const transcriptSync = useTranscriptSync({
    transcript,
    audioDuration,
    syncMode: 'simulated',
    autoEnhance,
    enableTopicExtraction: showTopics,
  });

  // Update current time in transcript sync
  useEffect(() => {
    transcriptSync.updateCurrentTime(currentTime);
  }, [currentTime, transcriptSync]);

  // Auto-scroll to active chunk
  useEffect(() => {
    if (autoScroll && activeChunkRef.current && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current;
      const activeElement = activeChunkRef.current;
      const containerRect = scrollContainer.getBoundingClientRect();
      const activeRect = activeElement.getBoundingClientRect();
      
      // Check if active element is outside viewport
      if (activeRect.top < containerRect.top || activeRect.bottom > containerRect.bottom) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [transcriptSync.activeChunk, autoScroll]);

  // Handle chunk click for seeking
  const handleChunkClick = useCallback((chunk: TextChunk) => {
    if (chunk.startTime !== undefined && onTimeSeek) {
      onTimeSeek(chunk.startTime);
    }
  }, [onTimeSeek]);

  // Handle topic navigation
  const handleTopicClick = useCallback((topicIndex: number) => {
    const timestamp = transcriptSync.jumpToTopic(topicIndex);
    if (timestamp !== null && onTimeSeek) {
      onTimeSeek(timestamp);
    }
  }, [transcriptSync, onTimeSeek]);

  // Toggle sync mode
  const handleSyncModeToggle = useCallback(() => {
    const newMode = transcriptSync.syncState.syncMode === 'realtime' ? 'simulated' : 'realtime';
    transcriptSync.setSyncMode(newMode);
  }, [transcriptSync]);

  // Get font size classes
  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm': return 'text-sm';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      default: return 'text-base';
    }
  };

  // Render transcript chunks with highlighting
  const renderTranscriptChunks = () => {
    if (!transcriptSync.syncData?.chunks) {
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div 
            className={cn("leading-relaxed", getFontSizeClass())}
            dangerouslySetInnerHTML={{ 
              __html: transcriptSync.highlightedText || transcript 
            }}
          />
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {transcriptSync.syncData.chunks.map((chunk, index) => {
          const isActive = transcriptSync.activeChunk?.id === chunk.id;
          const isPast = chunk.endTime !== undefined && currentTime > chunk.endTime;
          const isFuture = chunk.startTime !== undefined && currentTime < chunk.startTime;
          
          return (
            <div
              key={chunk.id}
              ref={isActive ? activeChunkRef : undefined}
              className={cn(
                "p-3 rounded-lg transition-all duration-300 cursor-pointer",
                "hover:bg-muted/50",
                {
                  "bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500": isActive,
                  "text-muted-foreground": isPast && transcriptSync.syncState.syncMode === 'simulated',
                  "opacity-50": isFuture && transcriptSync.syncState.syncMode === 'simulated',
                }
              )}
              onClick={() => handleChunkClick(chunk)}
            >
              <div className="flex items-start gap-3">
                {showTimestamps && chunk.startTime !== undefined && (
                  <div className="flex-shrink-0 text-xs text-muted-foreground font-mono mt-1">
                    {Math.floor(chunk.startTime / 60)}:{String(Math.floor(chunk.startTime % 60)).padStart(2, '0')}
                  </div>
                )}
                
                <div className="flex-1">
                  <div className={cn("leading-relaxed", getFontSizeClass())}>
                    {chunk.text}
                  </div>
                  
                  {chunk.speaker && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {chunk.speaker}
                    </Badge>
                  )}
                </div>
                
                <div className="flex-shrink-0 text-xs text-muted-foreground">
                  #{index + 1}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Show loading state
  if (loading || transcriptSync.isProcessing) {
    return compact ? (
      <Card className={cn("neomorphic border-0", className)}>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground animate-pulse" />
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            </div>
            <div className="space-y-1">
              <div className="h-3 w-full bg-muted animate-pulse rounded" />
              <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    ) : (
      <Card className={cn("neomorphic border-0", className)}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground animate-pulse" />
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-96 overflow-y-auto">
            <TranscriptSyncSkeleton />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact view for sidebar
  if (compact) {
    return (
      <Card className={cn("neomorphic border-0", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Transcript
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-6 w-6 p-0"
            >
              {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            </Button>
          </div>
          
          {!isCollapsed && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {transcriptSync.syncState.syncMode}
              </Badge>
              <span>{Math.round(transcriptSync.progress)}%</span>
            </div>
          )}
        </CardHeader>
        
        {!isCollapsed && (
          <CardContent className="pt-0">
            <div className="h-32 overflow-y-auto">
              <div className="text-xs leading-relaxed pr-2">
                {transcriptSync.activeChunk ? (
                  <div className="space-y-2">
                    <div className="font-medium text-primary">
                      {transcriptSync.activeChunk.text}
                    </div>
                    {transcriptSync.syncData?.chunks && transcriptSync.syncData.chunks.length > 1 && (
                      <div className="text-muted-foreground">
                        Chunk {transcriptSync.syncData.chunks.findIndex(c => c.id === transcriptSync.activeChunk?.id) + 1} of {transcriptSync.syncData.chunks.length}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    {transcript.substring(0, 150)}...
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  // Full transcript viewer
  return (
    <Card className={cn("neomorphic border-0", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Synchronized Transcript
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Progress indicator */}
            <Badge variant="outline" className="text-xs">
              {Math.round(transcriptSync.progress)}% Complete
            </Badge>
            
            {/* Sync mode indicator */}
            <Badge 
              variant={transcriptSync.syncState.syncMode === 'realtime' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {transcriptSync.syncState.syncMode}
            </Badge>
            
            {/* Processing indicator */}
            {transcriptSync.isProcessing && (
              <Badge variant="secondary" className="text-xs">
                Processing...
              </Badge>
            )}
            
            {/* Settings dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Display Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleSyncModeToggle}>
                  <Clock className="h-4 w-4 mr-2" />
                  Toggle Sync Mode
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => setShowTimestamps(!showTimestamps)}>
                  {showTimestamps ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {showTimestamps ? 'Hide' : 'Show'} Timestamps
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => setAutoScroll(!autoScroll)}>
                  <Hash className="h-4 w-4 mr-2" />
                  Auto-scroll: {autoScroll ? 'On' : 'Off'}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Font Size</DropdownMenuLabel>
                
                {['sm', 'base', 'lg', 'xl'].map((size) => (
                  <DropdownMenuItem 
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={fontSize === size ? 'bg-muted' : ''}
                  >
                    {size === 'sm' ? 'Small' : size === 'base' ? 'Normal' : size === 'lg' ? 'Large' : 'Extra Large'}
                  </DropdownMenuItem>
                ))}
                
                <DropdownMenuSeparator />
                
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
        {showTopics && transcriptSync.topics.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Topics</div>
            <div className="flex flex-wrap gap-2">
              {transcriptSync.topics.map((topic, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTopicClick(index)}
                  className="text-left h-auto py-1 px-2"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-xs">{topic.topic}</span>
                    <span className="text-xs text-muted-foreground">
                      {Math.floor(topic.timestamp / 60)}:{String(Math.floor(topic.timestamp % 60)).padStart(2, '0')}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {transcriptSync.error ? (
          <div className="text-red-600 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <p className="font-medium">Error processing transcript:</p>
            <p className="text-sm mt-1">{transcriptSync.error}</p>
            <div className="flex gap-2 mt-3">
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
        ) : (
          <div ref={scrollAreaRef} className="h-96 overflow-y-auto">
            <div className="pr-4">
              {renderTranscriptChunks()}
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
        
        {/* Sync information */}
        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="font-medium">Sync Mode</div>
              <div>{transcriptSync.syncState.syncMode}</div>
            </div>
            <div>
              <div className="font-medium">Chunks</div>
              <div>{transcriptSync.syncData?.chunks.length || 0}</div>
            </div>
            <div>
              <div className="font-medium">Topics</div>
              <div>{transcriptSync.topics.length}</div>
            </div>
            <div>
              <div className="font-medium">Progress</div>
              <div>{Math.round(transcriptSync.progress)}%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}