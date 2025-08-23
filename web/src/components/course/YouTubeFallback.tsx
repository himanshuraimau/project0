"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Play, Youtube } from 'lucide-react';

interface YouTubeFallbackProps {
  videoId: string;
  title?: string;
  className?: string;
}

export function YouTubeFallback({ videoId, title, className }: YouTubeFallbackProps) {
  if (!videoId) {
    return null;
  }

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="relative aspect-video bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
            <div className="text-white text-center">
              <Youtube className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Video Content Available</h3>
              <p className="text-sm opacity-90">
                {title || "Watch this chapter's video content"}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Video embedding is restricted. Click below to watch on YouTube.
            </p>
            <Button
              asChild
              className="w-full"
              size="lg"
            >
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Watch on YouTube
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default YouTubeFallback;