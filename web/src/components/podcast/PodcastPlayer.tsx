"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlayIcon,
  PauseIcon,
  GoBackward10SecIcon,
  GoForward10SecIcon,
  VolumeHighIcon,
  VolumeOffIcon,
  Download01Icon,
  Share07Icon,
} from "@hugeicons/core-free-icons";
import { PodcastAskInput } from "./PodcastAskInput";
import { PodcastSpeaker } from "./types";

interface PodcastPlayerProps {
  audioUrl: string;
  title: string;
  speakers?: PodcastSpeaker[];
  coverImage?: string;
  duration: number;
  onAskQuestion?: (question: string) => void;
  onShare?: () => void;
  onDownload?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  seekTo?: number; // External control for seeking to a specific time
}

export function PodcastPlayer({
  audioUrl,
  title,
  speakers = [
    { name: 'Leo', avatar: '' },
    { name: 'Maya', avatar: '' }
  ],
  coverImage,
  duration,
  onAskQuestion,
  onShare,
  onDownload,
  onTimeUpdate,
  seekTo,
}: PodcastPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [audioError, setAudioError] = useState<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e: Event) => {
      console.error("Audio playback error:", e);
      setIsPlaying(false);
      setAudioError('Unable to load or play this audio file. Please check the audio URL.');
    };

    const handleCanPlay = () => {
      setAudioError(null);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [onTimeUpdate]);

  // Handle external seek requests (from section clicks)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || seekTo === undefined) return;

    audio.currentTime = seekTo;
    setCurrentTime(seekTo);
    
    // Auto-play when seeking from section click
    if (!isPlaying) {
      audio.play();
      setIsPlaying(true);
    }
  }, [seekTo]);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Playback error:", error);
      setIsPlaying(false);
      setAudioError('Unable to play audio. Please check your internet connection or try again.');
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const skipTime = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  };

  const toggleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 1.75, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
      return;
    }

    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_podcast.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-border bg-card shadow-sm p-5 sm:p-6">
      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous">
        {audioUrl && (
          <>
            <source src={audioUrl} type="audio/mpeg" />
            <source src={audioUrl} type="audio/mp3" />
            <source src={audioUrl} type="audio/wav" />
            <source src={audioUrl} type="audio/ogg" />
          </>
        )}
        Your browser does not support the audio element.
      </audio>

      {/* Cover Image */}
      <div className="relative mb-4 rounded-xl overflow-hidden bg-linear-to-br from-primary/90 via-primary to-primary/80">
        {coverImage ? (
            <img
              src={coverImage}
              alt={title}
              className="w-full h-64 object-cover"
            />
        ) : (
          <div className="w-full h-64 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-white">
              <div className="h-16 w-16 rounded-2xl bg-black/25 flex items-center justify-center backdrop-blur-sm">
                <Image
                  src="/bento-icons/Flinote MIc.png"
                  alt="Podcast microphone"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <p className="text-xs opacity-80">Flinote podcast</p>
            </div>
          </div>
        )}

        {/* Share Icon Overlay */}
        <button
          onClick={onShare}
          className="absolute top-3 right-3 rounded-full bg-white/85 dark:bg-background/80 backdrop-blur-sm p-2 shadow-sm hover:bg-white dark:hover:bg-background transition-colors"
        >
          <HugeiconsIcon
            icon={Share07Icon}
            className="size-4 text-foreground"
          />
        </button>
      </div>

      {/* Title */}
      <h2 className="text-center text-[17px] font-medium leading-tight mb-3 line-clamp-2 text-foreground">
        {title}
      </h2>

      {/* Error Message */}
      {audioError && (
        <div className="mb-4 p-3 rounded-lg border border-destructive/40 bg-destructive/5">
          <p className="text-xs text-destructive text-center">
            {audioError}
          </p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-5 flex flex-col items-center">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="appearance-none bg-transparent cursor-pointer"
          style={{
            height: "4px",
            width: "60%",
          }}
        />
        <style jsx>{`
          input[type="range"] {
            -webkit-appearance: none;
          }
          input[type="range"]::-webkit-slider-runnable-track {
            width: 100%;
            height: 4px;
            background: linear-gradient(to right, #9CA3AF 0%, #9CA3AF ${(currentTime / (duration || 1)) * 100}%, #E5E7EB ${(currentTime / (duration || 1)) * 100}%, #E5E7EB 100%);
            border-radius: 2px;
          }
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 12px;
            width: 12px;
            border-radius: 50%;
            background: #9CA3AF;
            cursor: pointer;
            margin-top: -4px;
          }
          input[type="range"]::-moz-range-track {
            width: 100%;
            height: 4px;
            background: #E5E7EB;
            border-radius: 2px;
          }
          input[type="range"]::-moz-range-progress {
            height: 4px;
            background: #9CA3AF;
            border-radius: 2px;
          }
          input[type="range"]::-moz-range-thumb {
            height: 12px;
            width: 12px;
            border-radius: 50%;
            background: #9CA3AF;
            cursor: pointer;
            border: none;
          }
        `}</style>
        <div
          className="flex items-center justify-between mt-2"
          style={{ width: "60%" }}
        >
          <span className="text-xs tabular-nums text-muted-foreground">
            {formatTime(currentTime)}
          </span>
          <span className="text-xs tabular-nums text-muted-foreground">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Control Cluster */}
      <div className="flex items-center justify-center gap-4 mb-5">
        {/* Volume Button */}
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => setVolume(volume > 0 ? 0 : 1)}
          className="h-9 w-9 rounded-full border-border text-muted-foreground hover:text-foreground"
        >
          <HugeiconsIcon
            icon={volume > 0 ? VolumeHighIcon : VolumeOffIcon}
            className="size-4"
          />
        </Button>

        {/* Previous/Skip Back Button */}
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => skipTime(-10)}
          className="h-9 w-9 rounded-full border-border text-muted-foreground hover:text-foreground"
        >
          <HugeiconsIcon icon={GoBackward10SecIcon} className="size-4" />
        </Button>

        {/* Play Button (Primary) */}
        <Button
          type="button"
          size="icon"
          onClick={togglePlayPause}
          className="h-12 w-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
        >
          {isPlaying ? (
            <HugeiconsIcon icon={PauseIcon} className="size-6" />
          ) : (
            <HugeiconsIcon icon={PlayIcon} className="size-6" />
          )}
        </Button>

        {/* Next/Skip Forward Button */}
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => skipTime(10)}
          className="h-9 w-9 rounded-full border-border text-muted-foreground hover:text-foreground"
        >
          <HugeiconsIcon icon={GoForward10SecIcon} className="size-4" />
        </Button>

        {/* Speed Button */}
        <Button
          type="button"
          variant="outline"
          onClick={toggleSpeed}
          className="rounded-full px-3 py-2 text-xs font-medium border-border text-muted-foreground hover:text-foreground"
        >
          {playbackSpeed}×
        </Button>
      </div>

      {/* Download Button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleDownload}
        className="mt-1 w-full h-10 rounded-lg border-border text-sm font-medium text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
      >
        <HugeiconsIcon icon={Download01Icon} className="size-4" />
        <span>Download podcast</span>
      </Button>
    </div>
  );
}
