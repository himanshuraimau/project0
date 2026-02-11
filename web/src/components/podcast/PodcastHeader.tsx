"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Share07Icon,
  Download01Icon,
  StarIcon,
} from "@hugeicons/core-free-icons";

interface PodcastHeaderProps {
  title: string;
  noteId: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
}

export function PodcastHeader({
  title,
  noteId,
  isFavorite = false,
  onToggleFavorite,
  onShare,
  onDownload,
}: PodcastHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border/50 bg-sidebar/95 backdrop-blur supports-backdrop-filter:bg-sidebar/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={`/notes/${noteId}`}
            className="flex items-center gap-2 shrink-0 font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
            <span>Back to note</span>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              disabled={!onDownload}
              className="h-9 rounded-lg border-border text-muted-foreground hover:text-foreground gap-1.5"
            >
              <HugeiconsIcon icon={Download01Icon} className="size-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onShare}
              disabled={!onShare}
              className="h-9 rounded-lg border-border text-muted-foreground hover:text-foreground gap-1.5"
            >
              <HugeiconsIcon icon={Share07Icon} className="size-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFavorite}
              className={`h-9 w-9 rounded-lg ${
                isFavorite
                  ? "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <HugeiconsIcon
                icon={StarIcon}
                className={`size-5 ${isFavorite ? "fill-current" : ""}`}
              />
            </Button>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 min-w-0 text-foreground">
          <div className="h-7 w-7 rounded-lg border border-border bg-background/60 flex items-center justify-center shrink-0">
            <Image
              src="/bento-icons/Flinote MIc.png"
              alt="Podcast microphone"
              width={18}
              height={18}
              className="opacity-90"
            />
          </div>
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        </div>
      </div>
    </header>
  );
}
