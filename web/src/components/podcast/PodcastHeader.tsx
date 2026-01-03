'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PodcastHeaderProps {
  title: string;
  noteId: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onShare?: () => void;
}

export function PodcastHeader({
  title,
  noteId,
  isFavorite = false,
  onToggleFavorite,
  onShare,
}: PodcastHeaderProps) {
  const router = useRouter();

  const handleShare = async () => {
    if (onShare) {
      onShare();
      return;
    }

    // Default share functionality
    try {
      const shareUrl = `${window.location.origin}/notes/${noteId}`;
      if (navigator.share) {
        await navigator.share({
          title: `Podcast: ${title}`,
          text: `Check out this AI-generated podcast!`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        // You can add a toast notification here
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <div className="mb-6">
      {/* Breadcrumb */}
      <nav className="mb-3">
        <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
          <li>
            <button
              onClick={() => router.push('/dashboard')}
              className="hover:text-foreground transition-colors"
            >
              My Podcasts
            </button>
          </li>
          <li>
            <span className="mx-2">&gt;</span>
          </li>
          <li className="text-foreground font-medium truncate max-w-[300px] sm:max-w-[500px]">
            {title}
          </li>
        </ol>
      </nav>

      {/* Title and Actions */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
          {title}
        </h1>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>

          {onToggleFavorite && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFavorite}
              className={isFavorite ? 'text-yellow-500' : ''}
            >
              <Star
                className="h-4 w-4"
                fill={isFavorite ? 'currentColor' : 'none'}
              />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
