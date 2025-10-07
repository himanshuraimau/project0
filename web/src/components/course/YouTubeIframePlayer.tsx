"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getYouTubeWatchUrl, getCleanVideoId } from '@/lib/youtube-utils';

interface YouTubeIframePlayerProps {
  videoId: string | null | undefined;
  title?: string;
  className?: string;
}

export function YouTubeIframePlayer({ videoId, title, className }: YouTubeIframePlayerProps) {
  // Extract and validate video ID
  const cleanVideoId = getCleanVideoId(videoId);

  // Return null if no valid video ID
  if (!cleanVideoId) {
    if (videoId) {
      console.warn('YouTubeIframePlayer: Invalid video ID provided:', videoId);
    }
    return null;
  }

  const watchUrl = getYouTubeWatchUrl(cleanVideoId);
  const embedUrl = `https://www.youtube-nocookie.com/embed/${cleanVideoId}?rel=0&modestbranding=1&controls=1`;

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
          <iframe
            src={embedUrl}
            title={title || "YouTube video"}
            className="w-full h-full rounded-t-lg border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        {title && (
          <div className="p-4 flex items-center justify-between">
            <h3 className="font-medium text-sm">{title}</h3>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-3 w-3" />
                Watch on YouTube
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default YouTubeIframePlayer;