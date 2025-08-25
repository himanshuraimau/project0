"use client";

import React, { useState } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getYouTubeWatchUrl, getCleanVideoId } from '@/lib/youtube-utils';
import { YouTubeIframePlayer } from './YouTubeIframePlayer';

interface YouTubePlayerProps {
  videoId: string | null | undefined;
  title?: string;
  className?: string;
}

export function YouTubePlayer({ videoId, title, className }: YouTubePlayerProps) {
  const [error, setError] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [useIframeFallback, setUseIframeFallback] = useState(false);

  // Extract and validate video ID
  const cleanVideoId = getCleanVideoId(videoId);

  // Check if YouTube API is available
  React.useEffect(() => {
    if (!cleanVideoId) return; // Don't run effect if no valid video ID
    const checkYouTubeAPI = () => {
      if (typeof window !== 'undefined' && (window as any).YT && (window as any).YT.Player) {
        setApiLoaded(true);
      } else {
        // Try to load the API if it's not available
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
          const script = document.createElement('script');
          script.src = 'https://www.youtube.com/iframe_api';
          script.async = true;
          script.onload = () => {
            // Wait for YT object to be available
            const waitForYT = () => {
              if ((window as any).YT && (window as any).YT.Player) {
                setApiLoaded(true);
              } else {
                setTimeout(waitForYT, 100);
              }
            };
            waitForYT();
          };
          script.onerror = () => {
            console.warn('YouTube API script failed to load, using iframe fallback');
            setUseIframeFallback(true);
          };
          document.head.appendChild(script);
        }

        // Fallback timeout
        setTimeout(() => {
          if (!apiLoaded) {
            console.warn('YouTube API timeout, using iframe fallback');
            setUseIframeFallback(true);
          }
        }, 5000);
      }
    };

    checkYouTubeAPI();
  }, [apiLoaded, cleanVideoId]);

  // Return null if no valid video ID
  if (!cleanVideoId) {
    if (videoId) {
      console.warn('YouTubePlayer: Invalid video ID provided:', videoId);
    }
    return null;
  }

  const watchUrl = getYouTubeWatchUrl(cleanVideoId);

  // Use iframe fallback if API fails or CSP blocks it
  if (useIframeFallback) {
    return (
      <YouTubeIframePlayer
        videoId={cleanVideoId}
        title={title}
        className={className}
      />
    );
  }

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 1,
      rel: 0,
      modestbranding: 1,
      fs: 1,
      cc_load_policy: 0,
      iv_load_policy: 3,
      autohide: 0,
    },
  };

  const onReady: YouTubeProps['onReady'] = (event) => {
    // Access to player in all event handlers via event.target
    setIsReady(true);
    event.target.pauseVideo();
  };

  const onError: YouTubeProps['onError'] = (event) => {
    const errorCode = event?.data;
    console.error('YouTube Player Error:', errorCode);
    console.error('Error details:', {
      videoId: cleanVideoId,
      errorCode: errorCode,
      timestamp: new Date().toISOString(),
      apiLoaded: typeof window !== 'undefined' && !!(window as any).YT
    });

    // Common YouTube error codes:
    // 2 - Invalid parameter (bad video ID)
    // 5 - HTML5 player error
    // 100 - Video not found or private
    // 101 - Video not allowed to be played in embedded players
    // 150 - Video not allowed to be played in embedded players

    if (errorCode === 101 || errorCode === 150) {
      console.warn('Video embedding restricted, showing fallback');
    }

    setError(true);
  };

  if (error || !apiLoaded) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center aspect-video bg-gray-100 rounded-lg">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                {!apiLoaded ? 'YouTube API not available' : 'Unable to load video'}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                This might be due to Content Security Policy restrictions
              </p>
              <Button variant="outline" asChild>
                <a
                  href={watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Watch on YouTube
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="relative aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
          {!isReady && apiLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="text-sm text-gray-600">Loading video...</span>
              </div>
            </div>
          )}
          {apiLoaded && (
            <YouTube
              videoId={cleanVideoId}
              opts={opts}
              onReady={onReady}
              onError={onError}
              className="w-full h-full"
              iframeClassName="w-full h-full rounded-t-lg"
            />
          )}
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