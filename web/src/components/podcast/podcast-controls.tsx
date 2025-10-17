"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  RotateCcw,
  FastForward,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils/audio-utils";
import type { AudioPlayerState, AudioPlayerControls } from "@/lib/hooks/use-audio-player";

interface PodcastControlsProps {
  state: AudioPlayerState;
  controls: AudioPlayerControls;
  className?: string;
  compact?: boolean;
}

export function PodcastControls({
  state,
  controls,
  className,
  compact = false,
}: PodcastControlsProps) {
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    isMuted,
    progressPercentage,
    bufferedPercentage,
    isReady,
    error,
  } = state;

  const {
    play,
    pause,
    toggle,
    seek,
    seekBy,
    seekToPercentage,
    setVolume,
    toggleMute,
    setPlaybackRate,
    restart,
  } = controls;

  // Handle progress bar click
  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isReady || duration === 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;
    seekToPercentage(Math.max(0, Math.min(100, percentage)));
  };

  // Handle volume change
  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
  };

  // Handle playback rate change
  const handlePlaybackRateChange = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    setPlaybackRate(rates[nextIndex]);
  };

  if (error) {
    return (
      <div className={cn("p-4 text-center", className)}>
        <p className="text-red-600 text-sm">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          size="sm"
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div
          className="relative h-2 bg-secondary/20 rounded-full cursor-pointer group"
          onClick={handleProgressClick}
          role="slider"
          aria-label="Podcast progress"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              seekBy(-5);
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              seekBy(5);
            }
          }}
        >
          {/* Buffered Progress */}
          <div
            className="absolute top-0 left-0 h-full bg-secondary/40 rounded-full transition-all duration-300"
            style={{ width: `${bufferedPercentage}%` }}
          />
          
          {/* Current Progress */}
          <div
            className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
          
          {/* Progress Handle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 "
            style={{ left: `calc(${progressPercentage}% - 8px)` }}
          />
        </div>
        
        {/* Time Display */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Controls */}
      <div className={cn(
        "flex items-center justify-center gap-2",
        compact ? "gap-1" : "gap-2"
      )}>
        {/* Restart Button */}
        <Button
          onClick={restart}
          disabled={!isReady}
          variant="ghost"
          size={compact ? "sm" : "default"}
          className="rounded-full"
          aria-label="Restart podcast from beginning"
          title="Restart podcast"
        >
          <RotateCcw className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
        </Button>

        {/* Skip Backward */}
        <Button
          onClick={() => seekBy(-15)}
          disabled={!isReady}
          variant="ghost"
          size={compact ? "sm" : "default"}
          className="rounded-full"
          aria-label="Skip backward 15 seconds"
          title="Skip backward 15 seconds"
        >
          <SkipBack className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
        </Button>

        {/* Play/Pause Button */}
        <Button
          onClick={toggle}
          disabled={!isReady}
          variant="default"
          size={compact ? "sm" : "lg"}
          className="rounded-full"
          aria-label={isPlaying ? "Pause podcast" : "Play podcast"}
          title={isPlaying ? "Pause podcast" : "Play podcast"}
        >
          {isPlaying ? (
            <Pause className={cn(compact ? "h-5 w-5" : "h-6 w-6")} />
          ) : (
            <Play className={cn(compact ? "h-5 w-5" : "h-6 w-6")} />
          )}
        </Button>

        {/* Skip Forward */}
        <Button
          onClick={() => seekBy(15)}
          disabled={!isReady}
          variant="ghost"
          size={compact ? "sm" : "default"}
          className="rounded-full"
          aria-label="Skip forward 15 seconds"
          title="Skip forward 15 seconds"
        >
          <SkipForward className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
        </Button>

        {/* Playback Rate */}
        <Button
          onClick={handlePlaybackRateChange}
          disabled={!isReady}
          variant="ghost"
          size={compact ? "sm" : "default"}
          className="rounded-full min-w-12"
          aria-label={`Change playback speed, currently ${playbackRate}x`}
          title={`Playback speed: ${playbackRate}x`}
        >
          <span className={cn("font-mono", compact ? "text-xs" : "text-sm")}>
            {playbackRate}x
          </span>
        </Button>
      </div>

      {/* Volume Controls */}
      {!compact && (
        <div className="flex items-center gap-3">
          <Button
            onClick={toggleMute}
            disabled={!isReady}
            variant="ghost"
            size="sm"
            className="rounded-full flex-shrink-0"
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          
          <div className="flex-1 max-w-24">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              disabled={!isReady}
              className="w-full h-2 bg-secondary/20 rounded-full appearance-none cursor-pointer slider"
              aria-label="Volume control"
              title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            />
          </div>
          
          <span className="text-xs text-muted-foreground min-w-8 text-right">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </span>
        </div>
      )}

      {/* Loading State */}
      {!isReady && !error && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading audio...
          </div>
        </div>
      )}
    </div>
  );
}