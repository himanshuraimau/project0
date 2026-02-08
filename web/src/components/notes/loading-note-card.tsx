"use client";

import React from "react";
import { Loader2, AlertCircle, RefreshCw, FileText, Music, Globe, Video, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoadingNote {
  id: string;
  type: 'pdf' | 'audio' | 'audio-record' | 'youtube' | 'webpage';
  timestamp: number;
  transcriptId?: string;
  noteId?: string;
  stage: 'uploading' | 'processing' | 'generating' | 'completed' | 'error';
  error?: string;
  retryCount?: number;
}

interface LoadingNoteCardProps {
  loadingNote: LoadingNote;
  onRetry?: (loadingNote: LoadingNote) => void;
  onDismiss?: (loadingNote: LoadingNote) => void;
}

export function LoadingNoteCard({ loadingNote, onRetry, onDismiss }: LoadingNoteCardProps) {
  const getIcon = () => {
    switch (loadingNote.type) {
      case 'pdf':
        return <FileText className="h-5 w-5" />;
      case 'audio':
        return <Music className="h-5 w-5" />;
      case 'audio-record':
        return <Mic className="h-5 w-5" />;
      case 'youtube':
        return <Video className="h-5 w-5" />;
      case 'webpage':
        return <Globe className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getStageText = () => {
    switch (loadingNote.stage) {
      case 'uploading':
        return loadingNote.type === 'audio-record' ? 'Recording...' : 'Uploading...';
      case 'processing':
        return 'Processing content...';
      case 'generating':
        return 'Generating AI notes...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Failed';
      default:
        return 'Processing...';
    }
  };

  const getTypeLabel = () => {
    switch (loadingNote.type) {
      case 'pdf':
        return 'PDF';
      case 'audio':
        return 'Audio';
      case 'audio-record':
        return 'Recorded Audio';
      case 'youtube':
        return 'YouTube Video';
      case 'webpage':
        return 'Webpage';
      default:
        return 'Content';
    }
  };

  const isError = loadingNote.stage === 'error';
  const isCompleted = loadingNote.stage === 'completed';

  return (
    <div className={`w-full border rounded-lg p-6 ${
      isError 
        ? 'bg-red-50/80 dark:bg-red-950/20 border-red-200 dark:border-red-900' 
        : 'bg-slate-50/80 dark:bg-black border-black/10 dark:border-border/50'
    }`}>
      <div className="flex items-start justify-between gap-4">
        {/* Left section - Icon and Content */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Icon */}
          <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
            isError 
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              : 'bg-accent text-accent-foreground'
          }`}>
            {isError ? <AlertCircle className="h-5 w-5" /> : getIcon()}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="font-semibold text-foreground mb-1">
              {isError ? 'Processing Failed' : `Processing ${getTypeLabel()}`}
            </h3>
            
            {/* Stage/Status */}
            <div className="flex items-center gap-2 mb-2">
              {!isError && !isCompleted && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <p className={`text-sm ${
                isError 
                  ? 'text-red-600 dark:text-red-400 font-medium' 
                  : 'text-muted-foreground'
              }`}>
                {getStageText()}
              </p>
            </div>

            {/* Stage Progress Indicator */}
            {!isError && !isCompleted && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground/80 mb-2">
                <span className={loadingNote.stage === 'uploading' ? 'text-accent font-semibold' : ''}>
                  uploading
                </span>
                <span>→</span>
                <span className={loadingNote.stage === 'processing' ? 'text-accent font-semibold' : ''}>
                  processing
                </span>
                <span>→</span>
                <span className={loadingNote.stage === 'generating' ? 'text-accent font-semibold' : ''}>
                  generating
                </span>
              </div>
            )}

            {/* Error message */}
            {isError && loadingNote.error && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2 mb-3">
                {loadingNote.error}
              </p>
            )}

            {/* Retry count */}
            {loadingNote.retryCount && loadingNote.retryCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Retry attempt {loadingNote.retryCount}
              </p>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
              {loadingNote.transcriptId && (
                <span className="px-2 py-1 bg-muted rounded">
                  Transcript: {loadingNote.transcriptId.substring(0, 8)}...
                </span>
              )}
              {loadingNote.noteId && (
                <span className="px-2 py-1 bg-muted rounded">
                  Note: {loadingNote.noteId.substring(0, 8)}...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right section - Actions */}
        {isError && (
          <div className="flex flex-col gap-2 shrink-0">
            {onRetry && (
              <Button
                onClick={() => onRetry(loadingNote)}
                variant="outline"
                size="sm"
                className="h-8 px-3"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Retry
              </Button>
            )}
            {onDismiss && (
              <Button
                onClick={() => onDismiss(loadingNote)}
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs"
              >
                Dismiss
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
