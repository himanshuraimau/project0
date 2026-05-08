"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  File01Icon,
  Globe02Icon,
  YoutubeIcon,
  Mic01Icon,
  TextAlignLeftIcon,
  Delete01Icon,
  RefreshIcon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  Loading03Icon,
  Image01Icon,
} from "@hugeicons/core-free-icons";
import type { SourceKind, SourceStatus } from "@/lib/sources/types";

export interface QueueRowModel {
  clientId: string;
  transcriptId?: string;
  kind: SourceKind;
  title: string;
  subtitle?: string;
  status: SourceStatus;
  progress: number;
  message?: string;
  errorCode?: string | null;
}

const KIND_ICON: Record<SourceKind, typeof File01Icon> = {
  pdf: File01Icon,
  docx: File01Icon,
  txt: File01Icon,
  md: File01Icon,
  pptx: File01Icon,
  csv: File01Icon,
  image: Image01Icon,
  text: TextAlignLeftIcon,
  url: Globe02Icon,
  youtube: YoutubeIcon,
  audio: Mic01Icon,
};

const STATUS_LABEL: Record<SourceStatus, string> = {
  queued: "Queued",
  uploading: "Uploading",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
  skipped: "Skipped",
};

const STATUS_STYLES: Record<SourceStatus, string> = {
  queued: "bg-muted text-muted-foreground",
  uploading: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  processing: "bg-primary/10 text-primary",
  ready: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  failed: "bg-destructive/10 text-destructive",
  skipped: "bg-amber-500/10 text-amber-600 dark:text-amber-500",
};

interface Props {
  row: QueueRowModel;
  onRemove?: () => void;
  onRetry?: () => void;
  disabled?: boolean;
}

export function SourceQueueRow({ row, onRemove, onRetry, disabled }: Props) {
  const Icon = KIND_ICON[row.kind] ?? File01Icon;
  const isProcessing =
    row.status === "processing" || row.status === "uploading";
  const statusIcon =
    row.status === "ready" ? CheckmarkCircle02Icon
    : row.status === "failed" ? AlertCircleIcon
    : isProcessing ? Loading03Icon
    : null;

  return (
    <div className="flex flex-col gap-2 px-3 py-2.5 rounded-lg border border-border/70 bg-background/50">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <HugeiconsIcon icon={Icon} className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {row.title}
          </p>
          {row.subtitle && (
            <p className="truncate text-xs text-muted-foreground">
              {row.subtitle}
            </p>
          )}
        </div>
        <div
          className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[row.status]}`}
        >
          {statusIcon && (
            <HugeiconsIcon
              icon={statusIcon}
              className={`size-3 ${isProcessing ? "animate-spin" : ""}`}
            />
          )}
          {STATUS_LABEL[row.status]}
        </div>
        {row.status === "failed" && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={disabled}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Retry"
          >
            <HugeiconsIcon icon={RefreshIcon} className="size-4" />
          </button>
        )}
        {(row.status === "queued" || row.status === "failed" || row.status === "skipped") &&
          onRemove && (
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Remove"
            >
              <HugeiconsIcon icon={Delete01Icon} className="size-4" />
            </button>
          )}
      </div>

      {isProcessing && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-[width] duration-300"
            style={{ width: `${Math.max(4, row.progress)}%` }}
          />
        </div>
      )}

      {row.status === "failed" && row.message && (
        <p className="text-xs text-destructive">{row.message}</p>
      )}
      {row.status === "skipped" && row.message && (
        <p className="text-xs text-amber-600 dark:text-amber-500">{row.message}</p>
      )}
    </div>
  );
}
