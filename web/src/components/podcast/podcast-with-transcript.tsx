"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Download,
  RotateCcw,
  Clock,
  User
} from 'lucide-react';
import { Podcast, PodcastSegment } from '@/lib/types/podcast.types';

interface PodcastWithTranscriptProps {
  podcast: Podcast;
  segments: PodcastSegment[];
  className?: string;
}

// Utility function to format time
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Modern Waveform Component
const ModernWaveform: React.FC<{
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  className?: string;
}> = ({ duration, currentTime, onSeek, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverTime, setHoverTime] = useState(0);

  // Generate waveform data
  const generateWaveformData = useCallback(() => {
    const points = 120;
    return Array.from({ length: points }, () => Math.random() * 0.7 + 0.2);
  }, []);

  const waveformData = generateWaveformData();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const progress = duration > 0 ? currentTime / duration : 0;
    const hoverProgress = duration > 0 ? hoverTime / duration : 0;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw waveform bars
    const barWidth = width / waveformData.length;
    
    waveformData.forEach((amplitude, index) => {
      const barHeight = amplitude * height * 0.8;
      const x = index * barWidth;
      const y = (height - barHeight) / 2;
      
      // Determine bar color based on progress
      const barProgress = index / waveformData.length;
      let color = 'hsl(var(--muted-foreground))'; // Default muted color
      
      if (barProgress <= progress) {
        color = 'hsl(var(--accent))'; // Accent color for played portion
      } else if (isHovering && barProgress <= hoverProgress) {
        color = 'hsl(var(--accent) / 0.6)'; // Semi-transparent accent for hover preview
      }
      
      ctx.fillStyle = color;
      ctx.fillRect(x, y, Math.max(barWidth - 1, 1), barHeight);
    });

    // Draw progress indicator line
    const progressX = progress * width;
    ctx.fillStyle = 'hsl(var(--accent))';
    ctx.fillRect(progressX - 2, 0, 4, height);

    // Draw hover indicator
    if (isHovering) {
      const hoverX = hoverProgress * width;
      ctx.fillStyle = 'hsl(var(--accent) / 0.8)';
      ctx.fillRect(hoverX - 1, 0, 2, height);
    }
  }, [currentTime, duration, hoverTime, isHovering, waveformData]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    const time = progress * duration;
    
    setHoverTime(Math.max(0, Math.min(time, duration)));
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    const time = progress * duration;
    
    onSeek(Math.max(0, Math.min(time, duration)));
  };

  return (
    <div className={cn("relative", className)}>
      <canvas
        ref={canvasRef}
        width={400}
        height={60}
        className="w-full h-15 cursor-pointer rounded-lg"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={handleClick}
        role="slider"
        aria-label="Audio timeline"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
      />
      {isHovering && (
        <div 
          className="absolute -top-10 bg-card border border-border text-foreground text-xs px-2 py-1 rounded-lg pointer-events-none z-10 shadow-lg"
          style={{ 
            left: `${(hoverTime / duration) * 100}%`,
            transform: 'translateX(-50%)'
          }}
        >
          {formatTime(hoverTime)}
        </div>
      )}
    </div>
  );
};

// Modern Transcript Component
const ModernTranscript: React.FC<{
  segments: PodcastSegment[];
  currentTime: number;
  onSeek: (time: number) => void;
  host1Name: string;
  host2Name: string;
  duration: number;
}> = ({ segments, currentTime, onSeek, host1Name, host2Name, duration }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeSegmentRef = useRef<HTMLDivElement>(null);
  const [userScrolling, setUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Find the currently active segment based on current time
  const findActiveSegment = useCallback(() => {
    if (!segments || segments.length === 0) return null;
    
    return segments.find(segment => {
      const startTime = segment.startTime ?? 0;
      const endTime = segment.endTime ?? 0;
      return currentTime >= startTime && currentTime <= endTime;
    }) || null;
  }, [segments, currentTime]);

  const activeSegment = findActiveSegment();

  // Handle user scrolling detection
  const handleScroll = useCallback(() => {
    setUserScrolling(true);
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Reset user scrolling after 3 seconds of no scrolling
    scrollTimeoutRef.current = setTimeout(() => {
      setUserScrolling(false);
    }, 3000);
  }, []);

  // Auto-scroll to active segment (only if user isn't manually scrolling)
  useEffect(() => {
    if (!userScrolling && activeSegmentRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeElement = activeSegmentRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeElement.getBoundingClientRect();
      
      // Check if active element is not fully visible
      if (activeRect.top < containerRect.top + 100 || activeRect.bottom > containerRect.bottom - 100) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [activeSegment, userScrolling]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  if (!segments || segments.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground bg-card">
        <div className="text-center p-8">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No transcript available</h3>
          <p className="text-sm">The transcript will appear here once the podcast is generated with segments.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto bg-card"
      onScroll={handleScroll}
    >
      {/* Header */}
      <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border p-6 z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-foreground">
            Transcript
          </h3>
          <div className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
            {formatTime(currentTime)}
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Click any line to jump to that timestamp. The current line is highlighted in <span className="text-accent font-medium">yellow</span>.
        </p>
        {/* Progress bar in header */}
        <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
          <div 
            className="h-full bg-accent transition-all duration-300 rounded-full"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
      </div>
      
      {/* Transcript Lines */}
      <div className="p-6 space-y-2">
        {segments.map((segment, index) => {
          const isActive = activeSegment?.id === segment.id;
          const speakerName = segment.speaker === 'host1' ? host1Name : host2Name;
          const speakerColor = segment.speaker === 'host1' ? 'primary' : 'secondary';
          
          return (
            <div
              key={segment.id || index}
              ref={isActive ? activeSegmentRef : null}
              className={cn(
                "group p-4 rounded-2xl border-l-4 cursor-pointer transition-all duration-500",
                isActive 
                  ? "bg-accent/15 border-l-accent shadow-lg scale-[1.02] font-semibold" 
                  : index % 2 === 0 
                    ? "bg-background border-l-border hover:bg-muted/30 hover:border-l-accent/50" 
                    : "bg-muted/10 border-l-border hover:bg-muted/40 hover:border-l-accent/50"
              )}
              onClick={() => {
                if (segment.startTime !== undefined) {
                  onSeek(segment.startTime);
                }
              }}
            >
              <div className="flex gap-4">
                {/* Speaker indicator and timestamp */}
                <div className="flex flex-col items-start gap-2 min-w-0 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full transition-all duration-300",
                      speakerColor === 'primary' ? "bg-primary" : "bg-secondary",
                      isActive && "animate-pulse shadow-lg scale-125"
                    )} />
                    <span className={cn(
                      "text-xs font-semibold transition-colors duration-300",
                      isActive ? "text-accent" : speakerColor === 'primary' ? "text-primary" : "text-secondary"
                    )}>
                      {speakerName}
                    </span>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (segment.startTime !== undefined) {
                        onSeek(segment.startTime);
                      }
                    }}
                    className={cn(
                      "text-xs font-mono px-2 py-1 rounded-lg transition-all duration-300 flex items-center gap-1.5 font-medium",
                      isActive 
                        ? "bg-accent/25 text-accent border border-accent/40 shadow-md" 
                        : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Clock className="w-3 h-3" />
                    {formatTime(segment.startTime || 0)}
                  </button>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm leading-relaxed transition-all duration-300",
                    isActive 
                      ? "text-foreground font-bold" 
                      : "text-muted-foreground hover:text-foreground"
                  )}>
                    {segment.content}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Modern two-column podcast player with redesigned UI
 */
export const PodcastWithTranscript: React.FC<PodcastWithTranscriptProps> = ({
  podcast,
  segments,
  className
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Audio event handlers
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
      setAudioError(null);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleError = () => {
    setIsLoading(false);
    setAudioError('Failed to load audio');
  };

  // Playback controls
  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skipBackward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15);
  };

  const skipForward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 15);
  };

  const restart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
  };

  const handleSeek = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!audioRef.current) return;
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSpeedChange = (speed: number) => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = speed;
    setPlaybackRate(speed);
  };

  const handleDownload = () => {
    if (podcast.audioUrl) {
      const link = document.createElement('a');
      link.href = podcast.audioUrl;
      link.download = `${podcast.title}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div className={cn("w-full h-screen bg-background", className)}>
      {/* Audio element */}
      <audio
        ref={audioRef}
        src={podcast.audioUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
        preload="metadata"
        crossOrigin="anonymous"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
        {/* Left Column (50%) - Full Transcript */}
        <div className="border-r border-border bg-background">
          <ModernTranscript
            segments={segments}
            currentTime={currentTime}
            onSeek={handleSeek}
            host1Name={podcast.host1VoiceName}
            host2Name={podcast.host2VoiceName}
            duration={duration}
          />
        </div>

        {/* Right Column (50%) - Fixed Player Card at Top */}
        <div className="bg-background p-6 lg:p-8 flex flex-col">
          <Card className="w-full bg-card shadow-xl rounded-3xl border border-border/20 overflow-hidden sticky top-6">
            <CardContent className="p-6 lg:p-8">
              {/* Error display */}
              {audioError && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
                  <p className="text-sm text-destructive font-medium">{audioError}</p>
                </div>
              )}

              {/* Podcast Info */}
              <div className="text-center mb-6">
                <h3 className="text-lg lg:text-xl font-bold text-foreground mb-2">
                  {podcast.title}
                </h3>
                {podcast.description && (
                  <p className="text-xs lg:text-sm text-muted-foreground mb-4 leading-relaxed">
                    {podcast.description}
                  </p>
                )}
                
                {/* Host Tags */}
                <div className="flex justify-center gap-2 lg:gap-3 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium border border-primary/20">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    {podcast.host1VoiceName}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-secondary/10 text-secondary text-xs rounded-full font-medium border border-secondary/20">
                    <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                    {podcast.host2VoiceName}
                  </span>
                </div>
              </div>

              {/* Waveform */}
              <div className="mb-6">
                <div className="bg-muted/20 rounded-2xl p-3 lg:p-4 mb-3 border border-border/10">
                  <ModernWaveform
                    duration={duration}
                    currentTime={currentTime}
                    onSeek={handleSeek}
                  />
                </div>
                
                {/* Enhanced Time display */}
                <div className="flex justify-between items-center">
                  <div className="text-xs lg:text-sm font-mono text-foreground bg-background px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg border border-border">
                    {formatTime(currentTime)}
                  </div>
                  <div className="flex-1 mx-3 lg:mx-4">
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-full bg-accent transition-all duration-300 rounded-full"
                        style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-xs lg:text-sm font-mono text-muted-foreground bg-muted px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg">
                    {formatTime(duration)}
                  </div>
                </div>
              </div>

              {/* Main Controls */}
              <div className="flex items-center justify-center gap-3 lg:gap-4 mb-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={restart}
                  disabled={isLoading}
                  className="w-8 h-8 lg:w-10 lg:h-10 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
                >
                  <RotateCcw className="h-3 w-3 lg:h-4 lg:w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={skipBackward}
                  disabled={isLoading}
                  className="w-8 h-8 lg:w-10 lg:h-10 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
                >
                  <SkipBack className="h-3 w-3 lg:h-4 lg:w-4" />
                </Button>
                
                <Button
                  size="lg"
                  onClick={togglePlayPause}
                  disabled={isLoading || !podcast.audioUrl}
                  className="w-12 h-12 lg:w-16 lg:h-16 bg-accent hover:bg-accent/90 text-accent-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 lg:w-5 lg:h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-5 w-5 lg:h-6 lg:w-6" />
                  ) : (
                    <Play className="h-5 w-5 lg:h-6 lg:w-6 ml-0.5" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={skipForward}
                  disabled={isLoading}
                  className="w-8 h-8 lg:w-10 lg:h-10 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
                >
                  <SkipForward className="h-3 w-3 lg:h-4 lg:w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  disabled={!podcast.audioUrl}
                  className="w-8 h-8 lg:w-10 lg:h-10 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
                >
                  <Download className="h-3 w-3 lg:h-4 lg:w-4" />
                </Button>
              </div>

              {/* Secondary Controls */}
              <div className="space-y-3">
                {/* Volume Control */}
                <div className="flex items-center gap-2 lg:gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 lg:p-2"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-3 w-3 lg:h-4 lg:w-4" />
                    ) : (
                      <Volume2 className="h-3 w-3 lg:h-4 lg:w-4" />
                    )}
                  </Button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 lg:h-2 bg-muted rounded-full appearance-none cursor-pointer slider"
                  />
                  <span className="text-xs text-muted-foreground w-6 lg:w-8 font-medium">
                    {Math.round(volume * 100)}%
                  </span>
                </div>

                {/* Speed Control */}
                <div className="flex items-center gap-2 lg:gap-3">
                  <span className="text-xs lg:text-sm text-muted-foreground font-medium min-w-fit">Speed:</span>
                  <select
                    value={playbackRate}
                    onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                    className="flex-1 text-xs lg:text-sm bg-muted border-0 rounded-lg px-2 lg:px-3 py-1 lg:py-1.5 text-foreground font-medium"
                  >
                    {speedOptions.map(speed => (
                      <option key={speed} value={speed}>
                        {speed}x
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: hsl(var(--accent));
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        @media (min-width: 1024px) {
          .slider::-webkit-slider-thumb {
            height: 14px;
            width: 14px;
          }
        }
        
        .slider::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: hsl(var(--accent));
          cursor: pointer;
          border: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        @media (min-width: 1024px) {
          .slider::-moz-range-thumb {
            height: 14px;
            width: 14px;
          }
        }
        
        .slider::-webkit-slider-track {
          background: hsl(var(--muted));
          border-radius: 999px;
        }
        
        .slider::-moz-range-track {
          background: hsl(var(--muted));
          border-radius: 999px;
        }
      `}</style>
    </div>
  );
};

export default PodcastWithTranscript;