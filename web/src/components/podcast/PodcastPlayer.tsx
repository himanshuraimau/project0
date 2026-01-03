'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Share2, Download, Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { PodcastAskInput } from './PodcastAskInput';
import { PodcastSpeaker } from './types';

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

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
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

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
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
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 sticky top-6">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Cover Image */}
      <div className="relative mb-4 rounded-lg overflow-hidden bg-linear-to-br from-purple-900 via-blue-900 to-pink-900">
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className="w-full h-64 object-cover"
          />
        ) : (
          <div className="w-full h-64 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-6xl mb-2">🎙️</div>
              <p className="text-sm opacity-75">Podcast Cover</p>
            </div>
          </div>
        )}

        {/* Share Icon Overlay */}
        <button
          onClick={onShare}
          className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full p-2 transition-colors"
        >
          <Share2 className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* Title */}
      <h2 className="text-lg font-semibold text-center mb-4 text-foreground">
        {title}
      </h2>

      {/* Speakers */}
      <div className="flex items-center justify-center gap-6 mb-6">
        {speakers.map((speaker, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <Avatar className="h-12 w-12">
              <AvatarImage src={speaker.avatar} alt={speaker.name} />
              <AvatarFallback className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                {speaker.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {speaker.name}
            </span>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-600 [&::-moz-range-thumb]:border-0"
        />
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setVolume(volume > 0 ? 0 : 1)}
          className="text-gray-600 dark:text-gray-400"
        >
          <Volume2 className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => skipTime(-10)}
          className="text-gray-600 dark:text-gray-400"
        >
          <SkipBack className="h-5 w-5" />
        </Button>

        <Button
          size="icon"
          onClick={togglePlayPause}
          className="h-12 w-12 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200"
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" fill="currentColor" />
          ) : (
            <Play className="h-6 w-6" fill="currentColor" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => skipTime(10)}
          className="text-gray-600 dark:text-gray-400"
        >
          <SkipForward className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSpeed}
          className="text-gray-600 dark:text-gray-400 font-medium min-w-[3rem]"
        >
          {playbackSpeed}x
        </Button>
      </div>

      {/* Download Button */}
      <Button
        variant="outline"
        onClick={handleDownload}
        className="w-full mb-4 gap-2"
      >
        <Download className="h-4 w-4" />
        Download Podcast
      </Button>

      {/* Ask Input */}
      {onAskQuestion && (
        <PodcastAskInput onSubmit={onAskQuestion} />
      )}
    </div>
  );
}
