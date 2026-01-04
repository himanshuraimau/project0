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
    <div className="mb-6 pb-6 border-b border-transparent" style={{
      boxShadow: '0 1px 0 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
    }}>
      {/* Breadcrumb with Actions */}
      <nav className="mb-4">
        <div className="flex items-center justify-between">
          <ol className="flex items-center space-x-2 text-[19px] font-normal text-muted-foreground">
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

          {/* Share and Star Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-2 rounded-none"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFavorite}
              className="text-yellow-500 hover:text-yellow-600 rounded-none"
            >
              <Star
                className="h-5 w-5"
                fill="currentColor"
              />
            </Button>
          </div>
        </div>
      </nav>

      {/* Title */}
      <div>
        <h1 className="text-[19px] font-bold text-foreground leading-tight">
          {title}
        </h1>
      </div>
    </div>
  );
}
