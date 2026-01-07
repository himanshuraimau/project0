'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Share2, Download, Play, Pause, SkipBack, SkipForward, Volume2, User, UserRound, X } from 'lucide-react';
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
      console.error('Audio playback error:', e);
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
      console.error('Playback error:', error);
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
      console.error('Download failed:', error);
    }
  };

  return (
    <div 
      className="rounded-[28px] w-full h-fit bg-gray-100 dark:bg-gray-900"
      style={{
        boxShadow: '0px 12px 30px rgba(0,0,0,0.08), 0px 4px 10px rgba(0,0,0,0.04)',
        padding: '24px 24px 28px 24px'
      }}
    >
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
      <div className="relative mb-4 rounded-[18px] overflow-hidden bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600">
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className="w-full h-80 object-cover"
          />
        ) : (
          <div className="w-full h-80 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-6xl mb-2">🎙️</div>
              <p className="text-sm opacity-75">Podcast Cover</p>
            </div>
          </div>
        )}

        {/* Share Icon Overlay */}
        <button
          onClick={onShare}
          className="absolute top-4 right-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-800/90 rounded-full p-2.5 transition-all"
          style={{
            boxShadow: '0px 2px 8px rgba(0,0,0,0.1), inset 0px 1px 2px rgba(255,255,255,0.5)'
          }}
        >
          <Share2 className="h-4 w-4 text-gray-700 dark:text-gray-200" />
        </button>
      </div>

      {/* Title */}
      <h2 
        className="text-center font-medium leading-tight mb-3 line-clamp-2 text-gray-900 dark:text-gray-100"
        style={{
          fontSize: '17px'
        }}
      >
        {title}
      </h2>

      {/* Speakers/Hosts */}
      <div className="flex items-center justify-center gap-4 mb-5">
        {speakers.map((speaker, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={speaker.avatar} alt={speaker.name} />
                <AvatarFallback 
                  className="flex items-center justify-center bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                >
                  {speaker.name.toLowerCase() === 'leo' ? (
                    <User className="h-5 w-5" />
                  ) : (
                    <UserRound className="h-5 w-5" />
                  )}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {speaker.name}
              </span>
            </div>
            {index < speakers.length - 1 && (
              <X className="h-4 w-4 text-gray-400 dark:text-gray-600" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Error Message */}
      {audioError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300 text-center">
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
            height: '4px',
            width: '50%'
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
        <div className="flex items-center justify-between mt-2" style={{ width: '50%' }}>
          <span className="text-xs tabular-nums text-gray-400 dark:text-gray-500">
            {formatTime(currentTime)}
          </span>
          <span className="text-xs tabular-nums text-gray-400 dark:text-gray-500">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Control Cluster */}
      <div className="flex items-center justify-center gap-4 mb-5">
        {/* Volume Button */}
        <button
          onClick={() => setVolume(volume > 0 ? 0 : 1)}
          className="rounded-full p-2.5 transition-all bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
          style={{
            boxShadow: '0px 2px 6px rgba(0,0,0,0.08)'
          }}
        >
          <Volume2 className="h-4 w-4" />
        </button>

        {/* Previous/Skip Back Button */}
        <button
          onClick={() => skipTime(-10)}
          className="rounded-full p-2.5 transition-all bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
          style={{
            boxShadow: '0px 2px 6px rgba(0,0,0,0.08)'
          }}
        >
          <SkipBack className="h-4 w-4" />
        </button>

        {/* Play Button (Primary) */}
        <button
          onClick={togglePlayPause}
          className="rounded-full p-4 transition-all bg-gray-900 dark:bg-purple-600 text-white"
          style={{
            boxShadow: '0px 4px 12px rgba(0,0,0,0.2)'
          }}
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" fill="currentColor" />
          ) : (
            <Play className="h-6 w-6" fill="currentColor" />
          )}
        </button>

        {/* Next/Skip Forward Button */}
        <button
          onClick={() => skipTime(10)}
          className="rounded-full p-2.5 transition-all bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
          style={{
            boxShadow: '0px 2px 6px rgba(0,0,0,0.08)'
          }}
        >
          <SkipForward className="h-4 w-4" />
        </button>

        {/* Speed Button */}
        <button
          onClick={toggleSpeed}
          className="rounded-full px-3 py-2 transition-all bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
          style={{
            boxShadow: '0px 2px 6px rgba(0,0,0,0.08)',
            fontSize: '13px',
            fontWeight: 500
          }}
        >
          {playbackSpeed}×
        </button>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        className="w-full py-3 rounded-xl transition-all flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
        style={{
          boxShadow: '0px 2px 6px rgba(0,0,0,0.08)',
          fontSize: '14px',
          fontWeight: 500
        }}
      >
        <Download className="h-4 w-4" />
        Download Podcast
      </button>

      {/* AI Input (Separate Component Below) */}
      {onAskQuestion && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <PodcastAskInput onSubmit={onAskQuestion} />
        </div>
      )}
    </div>
  );
}
