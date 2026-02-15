"use client";

import React, { useEffect, useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  File01Icon,
  Upload01Icon,
  Mic01Icon,
  Video01Icon,
  GlobeIcon,
  AlertDiamondIcon,
  Cancel01Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

export interface LoadingNoteForCard {
  id: string;
  type: "pdf" | "audio" | "audio-record" | "youtube" | "webpage";
  timestamp: number;
  stage: "uploading" | "processing" | "generating" | "completed" | "error";
  error?: string;
  retryCount?: number;
}

interface GeneratingNoteCardProps {
  loadingNote: LoadingNoteForCard;
  onRetry?: (loadingNote: LoadingNoteForCard) => void;
  onDismiss?: (loadingNote: LoadingNoteForCard) => void;
}

// Progress phases determine the message shown based on actual progress percentage
const PROGRESS_PHASES = [
  { min: 0, max: 14, label: "Starting..." },
  { min: 15, max: 29, label: "Extracting PDF..." },
  { min: 30, max: 49, label: "Parsing PDF..." },
  { min: 50, max: 69, label: "Indexing..." },
  { min: 70, max: 89, label: "Chunking..." },
  { min: 90, max: 100, label: "Finishing..." },
] as const;

interface NoteProgressSocketMessage {
  jobId?: string;
  id?: string;
  progress?: number;
  percent?: number;
  stage?: LoadingNoteForCard["stage"];
  message?: string;
  currentStep?: string;
}

function getTypeIcon(type: LoadingNoteForCard["type"]) {
  switch (type) {
    case "pdf":
      return File01Icon;
    case "audio-record":
      return Mic01Icon;
    case "audio":
      return Upload01Icon;
    case "youtube":
      return Video01Icon;
    case "webpage":
      return GlobeIcon;
    default:
      return File01Icon;
  }
}

function getTypeLabel(type: LoadingNoteForCard["type"]): string {
  switch (type) {
    case "pdf":
      return "PDF";
    case "audio":
      return "Audio";
    case "audio-record":
      return "Recording";
    case "youtube":
      return "YouTube";
    case "webpage":
      return "Webpage";
    default:
      return "Note";
  }
}

export function GeneratingNoteCard({
  loadingNote,
  onRetry,
  onDismiss,
}: GeneratingNoteCardProps) {
  const [socketProgress, setSocketProgress] = useState<number | null>(null);
  const [socketStage, setSocketStage] =
    useState<LoadingNoteForCard["stage"] | null>(null);
  const [socketMessage, setSocketMessage] = useState<string | null>(null);
  // Always start from 0 for smooth animation
  const [animatedProgress, setAnimatedProgress] = useState<number>(0);

  const effectiveStage = socketStage ?? loadingNote.stage;
  const isError = effectiveStage === "error";
  
  const targetPercent = useMemo(() => {
    if (isError) {
      return 0;
    }

    // IMPORTANT: Only use socketProgress when available
    // Don't use STAGE_CONFIG as fallback to prevent jumping from 40 to 15
    if (typeof socketProgress === "number" && Number.isFinite(socketProgress)) {
      return Math.max(0, Math.min(100, Math.round(socketProgress)));
    }

    // If no socket progress yet, stay at 0 to wait for real data
    // This prevents jumping backward when WebSocket sends initial progress
    return 0;
  }, [isError, socketProgress]);

  // Smooth progress animation
  useEffect(() => {
    if (isError) {
      setAnimatedProgress(0);
      return;
    }

    const startProgress = animatedProgress;
    const endProgress = targetPercent;
    const duration = 800; // 800ms animation
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic function for smooth deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentProgress = startProgress + (endProgress - startProgress) * easeProgress;
      
      setAnimatedProgress(currentProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [targetPercent, isError]);

  const percent = Math.round(animatedProgress);
  const phaseMessage = useMemo(() => {
    // If we haven't received any socket progress yet, show appropriate waiting message
    if (socketProgress === null) {
      return "Starting...";
    }
    
    const matchedPhase = PROGRESS_PHASES.find(
      (phase) => percent >= phase.min && percent <= phase.max
    );
    // If no phase matches (percent < 15), use the first phase message
    return matchedPhase?.label ?? PROGRESS_PHASES[0].label;
  }, [percent, socketProgress]);
  const message = socketMessage || phaseMessage;
  const typeLabel = getTypeLabel(loadingNote.type);
  const IconComponent = getTypeIcon(loadingNote.type);

  useEffect(() => {
    // Only reset when it's a completely new note (ID changes), not when stage changes
    setSocketProgress(null);
    setSocketStage(null);
    setSocketMessage(null);
    // Always reset to 0 for new notes
    setAnimatedProgress(0);
  }, [loadingNote.id]);

  useEffect(() => {
    if (loadingNote.stage === "completed" || loadingNote.stage === "error") {
      return;
    }

    const configuredBaseUrl = process.env.NEXT_PUBLIC_NOTES_PROGRESS_WS_URL;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const fallbackBaseUrl = `${protocol}//${window.location.host}/api/notes/progress/ws`;
    const wsBaseUrl = configuredBaseUrl?.trim()
      ? configuredBaseUrl.replace(/\/$/, "")
      : fallbackBaseUrl;
    const wsUrl = `${wsBaseUrl}?jobId=${encodeURIComponent(loadingNote.id)}`;

    let socket: WebSocket | null = null;
    let cancelled = false;

    const connect = async () => {
      // For internal endpoint, ensure WS upgrade hook is registered first.
      if (!configuredBaseUrl) {
        try {
          const response = await fetch("/api/notes/progress/ws", { cache: "no-store" });
          if (!response.ok) {
            console.error('[WebSocket] Failed to register upgrade handler:', response.status);
          }
        } catch (error) {
          console.error('[WebSocket] Bootstrap error:', error);
          // Continue anyway - socket connection might still work
        }
      }

      if (cancelled) {
        return;
      }

      console.log('[WebSocket] Connecting to:', wsUrl);
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('[WebSocket] Connected successfully for job:', loadingNote.id);
      };

      socket.onerror = (error) => {
        console.error('[WebSocket] Connection error:', error);
        console.error('[WebSocket] Failed to connect to:', wsUrl);
      };

      socket.onclose = (event) => {
        console.log('[WebSocket] Connection closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        
        // Attempt reconnection after 2 seconds if not cancelled and not completed
        if (!cancelled && loadingNote.stage !== 'completed' && loadingNote.stage !== 'error') {
          console.log('[WebSocket] Scheduling reconnection in 2s...');
          setTimeout(() => {
            if (!cancelled) {
              console.log('[WebSocket] Reconnecting...');
              void connect();
            }
          }, 2000);
        }
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as NoteProgressSocketMessage;

          if (
            payload.jobId &&
            payload.jobId !== loadingNote.id &&
            payload.id !== loadingNote.id
          ) {
            return;
          }

          const nextProgress = payload.progress ?? payload.percent;
          if (typeof nextProgress === "number") {
            setSocketProgress(nextProgress);
          }

          if (payload.stage) {
            setSocketStage(payload.stage);
          }

          const nextMessage = payload.message ?? payload.currentStep;
          if (nextMessage) {
            setSocketMessage(nextMessage);
          }
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
          // Continue using fallback UI
        }
      };
    };

    void connect();

    return () => {
      cancelled = true;
      socket?.close();
    };
  }, [loadingNote.id, loadingNote.stage]);

  return (
    <div
      className={`w-full rounded-2xl  p-4 sm:p-5 transition-all duration-300 ${
        isError
          ? "border-destructive/30 bg-destructive/5 dark:bg-destructive/10"
          : "border-border bg-card dark:bg-card/80"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Left: type icon */}
        <div
          className={`flex shrink-0 items-center justify-center size-12 rounded-xl ${
            isError
              ? "bg-destructive/15 text-destructive"
              : "bg-primary/15 text-primary"
          }`}
        >
          {isError ? (
            <HugeiconsIcon icon={AlertDiamondIcon} className="size-6" />
          ) : (
            <HugeiconsIcon icon={IconComponent} className="size-6" />
          )}
        </div>

        {/* Center: title, message, progress */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground text-lg leading-tight">
            {isError
              ? "Couldn’t create note"
              : `Creating note from ${typeLabel}`}
          </h3>

          {!isError && (
            <>
              <p className="text-sm text-muted-foreground mt-1">
                {message}
              </p>
              <div className="mt-3 space-y-1.5">
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden relative">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-primary/90 to-primary transition-all duration-700 ease-out relative overflow-hidden"
                    style={{ width: `${percent}%` }}
                  >
                    {/* Animated shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full animate-progress-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-primary tabular-nums">
                    {percent}%
                  </p>
                  {percent < 100 && (
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {isError && loadingNote.error && (
            <p className="text-sm text-destructive/90 mt-1">
              {loadingNote.error}
            </p>
          )}

          {isError && (onRetry || onDismiss) && (
            <div className="flex items-center gap-2 mt-3">
              {onRetry && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onRetry(loadingNote)}
                  className="gap-1.5 h-8 cursor-pointer bg-primary hover:bg-primary/90"
                >
                  <HugeiconsIcon icon={RefreshIcon} className="size-3.5" />
                  Retry
                </Button>
              )}
              {onDismiss && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDismiss(loadingNote)}
                  className="gap-1.5 h-8 cursor-pointer text-muted-foreground"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes progress-shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
        .animate-progress-shimmer {
          animation: progress-shimmer 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
