"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  File01Icon,
  Mic01Icon,
  Upload01Icon,
  Video01Icon,
  GlobeIcon,
  Loading01Icon,
  AlertDiamondIcon,
  RefreshIcon,
  Cancel01Icon,
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

const STAGE_CONFIG = {
  uploading: {
    percent: 25,
    message: (type: LoadingNoteForCard["type"]) =>
      type === "audio-record"
        ? "Recording your audio..."
        : type === "youtube" || type === "webpage"
        ? "Fetching your link..."
        : "Uploading your file...",
  },
  processing: {
    percent: 50,
    message: () => "Reading & analyzing content...",
  },
  generating: {
    percent: 85,
    message: () => "Writing your smart notes...",
  },
  completed: {
    percent: 100,
    message: () => "Almost there...",
  },
  error: {
    percent: 0,
    message: () => "Something went wrong",
  },
} as const;

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
  const isError = loadingNote.stage === "error";
  const config = STAGE_CONFIG[loadingNote.stage];
  const percent = config.percent;
  const message = config.message(loadingNote.type);
  const typeLabel = getTypeLabel(loadingNote.type);
  const IconComponent = getTypeIcon(loadingNote.type);

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
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <HugeiconsIcon
                  icon={Loading01Icon}
                  className="size-4 animate-spin shrink-0"
                />
                {message}
              </p>
              <div className="mt-3 space-y-1.5">
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="text-xs font-medium text-primary tabular-nums">
                  {percent}%
                </p>
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
    </div>
  );
}
