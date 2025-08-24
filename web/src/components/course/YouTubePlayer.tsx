"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Play, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface YouTubePlayerProps {
  videoId: string;
  title?: string;
  className?: string;
}

export function YouTubePlayer({ videoId, title, className }: YouTubePlayerProps) {
  if (!videoId) {
    return null;
  }

  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="relative aspect-video bg-gray-100">
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

export default YouTubePlayer;