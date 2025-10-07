"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
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
  User,
  Maximize2,
  Minimize2,
  ChevronDown,
  Radio
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

// Enhanced Waveform Component with smooth animations
const EnhancedWaveform: React.FC<{
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  segments: PodcastSegment[];
  className?: string;
}> = ({ duration, currentTime, onSeek, segments, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverTime, setHoverTime] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 800, height: 80 });

  // Generate realistic waveform data
  const generateWaveformData = useCallback(() => {
    const points = 150;
    const data: number[] = [];
    
    // Create a more natural waveform with variations
    for (let i = 0; i < points; i++) {
      const t = i / points;
      // Combine sine waves for realistic audio visualization
      const amplitude = 
        Math.sin(t * Math.PI * 4) * 0.3 +
        Math.sin(t * Math.PI * 8) * 0.2 +
        Math.random() * 0.5;
      data.push(Math.abs(amplitude) * 0.8 + 0.2);
    }
    
    return data;
  }, []);

  const waveformData = useRef(generateWaveformData()).current;

  // Handle responsive canvas sizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height: 80 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Draw waveform with smooth animations
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const progress = duration > 0 ? currentTime / duration : 0;
    const hoverProgress = duration > 0 ? hoverTime / duration : 0;

    // Set canvas resolution for retina displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw waveform bars with gradient
    const barWidth = width / waveformData.length;
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    
    waveformData.forEach((amplitude, index) => {
      const barHeight = amplitude * height * 0.7;
      const x = index * barWidth;
      const y = (height - barHeight) / 2;
      
      const barProgress = index / waveformData.length;
      
      // Determine bar color with smooth gradients
      if (barProgress <= progress) {
        // Played portion - accent color
        ctx.fillStyle = 'hsl(var(--accent))';
      } else if (isHovering && barProgress <= hoverProgress) {
        // Hover preview - semi-transparent accent
        ctx.fillStyle = 'hsl(var(--accent) / 0.5)';
      } else {
        // Unplayed portion - muted
        ctx.fillStyle = 'hsl(var(--muted-foreground) / 0.3)';
      }
      
      // Draw rounded bar
      const cornerRadius = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, Math.max(barWidth - 2, 1), barHeight, cornerRadius);
      ctx.fill();
    });

    // Draw segment markers
    segments.forEach(segment => {
      if (segment.startTime !== undefined && duration > 0) {
        const markerX = (segment.startTime / duration) * width;
        const color = segment.speaker === 'host1' ? 
          'hsl(var(--primary))' : 
          'hsl(var(--secondary))';
        
        ctx.fillStyle = color;
        ctx.fillRect(markerX - 1, 0, 2, 8);
      }
    });

    // Draw progress indicator with glow effect
    const progressX = progress * width;
    const glowGradient = ctx.createRadialGradient(progressX, height / 2, 0, progressX, height / 2, 15);
    glowGradient.addColorStop(0, 'hsl(var(--accent))');
    glowGradient.addColorStop(1, 'hsl(var(--accent) / 0)');
    
    ctx.fillStyle = glowGradient;
    ctx.fillRect(progressX - 15, 0, 30, height);
    
    ctx.fillStyle = 'hsl(var(--accent))';
    ctx.fillRect(progressX - 2, 0, 4, height);

    // Draw hover indicator
    if (isHovering) {
      const hoverX = hoverProgress * width;
      ctx.fillStyle = 'hsl(var(--accent) / 0.6)';
      ctx.fillRect(hoverX - 1, 0, 2, height);
    }
  }, [currentTime, duration, hoverTime, isHovering, waveformData, dimensions, segments]);

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
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <canvas
        ref={canvasRef}
        className="w-full cursor-pointer rounded-xl bg-muted/20"
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
      <AnimatePresence>
        {isHovering && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-12 bg-popover border border-border text-foreground text-xs px-3 py-1.5 rounded-lg pointer-events-none z-10 shadow-lg"
            style={{ 
              left: `${(hoverTime / duration) * 100}%`,
              transform: 'translateX(-50%)'
            }}
          >
            {formatTime(hoverTime)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Enhanced Transcript Component with smooth scrolling and animations
const EnhancedTranscript: React.FC<{
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
  const lastScrollTime = useRef<number>(0);
  const isAutoScrolling = useRef(false);

  // Find the currently active segment with interpolation
  const findActiveSegment = useCallback(() => {
    if (!segments || segments.length === 0) return null;
    
    // Add buffer time for smoother transitions (0.3 seconds)
    const buffer = 0.3;
    
    return segments.find(segment => {
      const startTime = (segment.startTime ?? 0) - buffer;
      const endTime = (segment.endTime ?? Infinity) + buffer;
      return currentTime >= startTime && currentTime <= endTime;
    }) || null;
  }, [segments, currentTime]);

  const activeSegment = findActiveSegment();

  // Handle user scrolling detection with improved logic
  const handleScroll = useCallback(() => {
    const now = Date.now();
    
    // Only mark as user scrolling if it's not an auto-scroll
    if (!isAutoScrolling.current && now - lastScrollTime.current > 100) {
      setUserScrolling(true);
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Reset user scrolling after 4 seconds of no scrolling
      scrollTimeoutRef.current = setTimeout(() => {
        setUserScrolling(false);
      }, 4000);
    }
    
    lastScrollTime.current = now;
  }, []);

  // Smooth auto-scroll to active segment with easing
  useEffect(() => {
    if (!userScrolling && activeSegmentRef.current && containerRef.current) {
      isAutoScrolling.current = true;
      
      const container = containerRef.current;
      const activeElement = activeSegmentRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeElement.getBoundingClientRect();
      
      // Calculate offset with padding
      const containerMiddle = containerRect.top + containerRect.height / 2;
      const activeMiddle = activeRect.top + activeRect.height / 2;
      const scrollOffset = activeMiddle - containerMiddle;
      
      // Only scroll if element is not fully visible in the center third
      const threshold = containerRect.height / 3;
      
      if (Math.abs(scrollOffset) > threshold) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
      
      // Reset auto-scrolling flag after animation
      setTimeout(() => {
        isAutoScrolling.current = false;
      }, 500);
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
      <div className="flex items-center justify-center h-full text-muted-foreground bg-card rounded-2xl border border-border/50">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No transcript available</h3>
          <p className="text-sm">The transcript will appear here once the podcast is generated.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto bg-card rounded-2xl border border-border/50"
      onScroll={handleScroll}
    >
      {/* Sticky Header */}
      <motion.div 
        className="sticky top-0 bg-card/95 backdrop-blur-lg border-b border-border/50 p-6 z-10"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Radio className="w-5 h-5 text-accent" />
            Transcript
          </h3>
          <motion.div 
            className="text-xs font-mono text-accent bg-accent/10 px-3 py-1.5 rounded-full border border-accent/20"
            key={formatTime(currentTime)}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {formatTime(currentTime)}
          </motion.div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Click any line to jump to that moment. The current line is highlighted with <span className="text-accent font-medium">accent color</span>.
        </p>
        {/* Animated Progress bar */}
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <motion.div 
            className="h-full bg-accent rounded-full shadow-sm"
            initial={{ width: 0 }}
            animate={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </motion.div>
      
      {/* Transcript Lines with Framer Motion */}
      <div className="p-6 space-y-3">
        {segments.map((segment, index) => {
          const isActive = activeSegment?.id === segment.id;
          const speakerName = segment.speaker === 'host1' ? host1Name : host2Name;
          const speakerColor = segment.speaker === 'host1' ? 'primary' : 'secondary';
          
          return (
            <motion.div
              key={segment.id || index}
              ref={isActive ? activeSegmentRef : null}
              className={cn(
                "group p-4 rounded-xl border-l-4 cursor-pointer transition-all duration-300",
                "hover:shadow-md hover:scale-[1.01]",
                isActive 
                  ? "bg-accent/10 border-l-accent shadow-lg scale-[1.02]" 
                  : "bg-background border-l-border hover:bg-muted/30 hover:border-l-accent/50"
              )}
              onClick={() => {
                if (segment.startTime !== undefined) {
                  onSeek(segment.startTime);
                }
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.02 }}
              whileHover={{ x: 4 }}
            >
              <div className="flex gap-4">
                {/* Speaker indicator and timestamp */}
                <div className="flex flex-col items-start gap-2 min-w-0 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <motion.div 
                      className={cn(
                        "w-3 h-3 rounded-full transition-all duration-300",
                        speakerColor === 'primary' ? "bg-primary" : "bg-secondary"
                      )}
                      animate={isActive ? {
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.7, 1]
                      } : {}}
                      transition={{
                        duration: 1.5,
                        repeat: isActive ? Infinity : 0,
                        ease: "easeInOut"
                      }}
                    />
                    <span className={cn(
                      "text-xs font-semibold transition-colors duration-300",
                      isActive ? "text-accent" : speakerColor === 'primary' ? "text-primary" : "text-secondary"
                    )}>
                      {speakerName}
                    </span>
                  </div>
                  
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (segment.startTime !== undefined) {
                        onSeek(segment.startTime);
                      }
                    }}
                    className={cn(
                      "text-xs font-mono px-2.5 py-1 rounded-lg transition-all duration-300 flex items-center gap-1.5 font-medium",
                      isActive 
                        ? "bg-accent/20 text-accent border border-accent/40 shadow-sm" 
                        : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-transparent"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Clock className="w-3 h-3" />
                    {formatTime(segment.startTime || 0)}
                  </motion.button>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <motion.p 
                    className={cn(
                      "text-sm leading-relaxed transition-all duration-300",
                      isActive 
                        ? "text-foreground font-semibold" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    animate={isActive ? { opacity: [0.8, 1, 0.8] } : {}}
                    transition={{
                      duration: 2,
                      repeat: isActive ? Infinity : 0,
                      ease: "easeInOut"
                    }}
                  >
                    {segment.content}
                  </motion.p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Redesigned two-column podcast player with enhanced UI and smooth animations
 */
export const PodcastWithTranscriptRedesigned: React.FC<PodcastWithTranscriptProps> = ({
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Audio event handlers with error handling
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
    setAudioError('Failed to load audio. Please try again.');
  };

  // Playback controls
  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((error) => {
        console.error('Playback error:', error);
        setAudioError('Failed to play audio');
      });
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

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

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

      <div className="grid grid-cols-1 lg:grid-cols-2 h-full gap-6 p-6">
        {/* Left Column - Enhanced Transcript */}
        <motion.div 
          className="overflow-hidden"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <EnhancedTranscript
            segments={segments}
            currentTime={currentTime}
            onSeek={handleSeek}
            host1Name={podcast.host1VoiceName}
            host2Name={podcast.host2VoiceName}
            duration={duration}
          />
        </motion.div>

        {/* Right Column - Enhanced Player */}
        <motion.div 
          className="flex flex-col"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="w-full bg-card shadow-2xl rounded-3xl border border-border/50 overflow-hidden sticky top-6">
            <CardContent className="p-8">
              {/* Error display */}
              <AnimatePresence>
                {audioError && (
                  <motion.div 
                    className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <p className="text-sm text-destructive font-medium">{audioError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Podcast Info */}
              <motion.div 
                className="text-center mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {podcast.title}
                </h3>
                {podcast.description && (
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {podcast.description}
                  </p>
                )}
                
                {/* Host Tags */}
                <div className="flex justify-center gap-3 mb-4">
                  <motion.span 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-full font-medium border border-primary/20"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    {podcast.host1VoiceName}
                  </motion.span>
                  <motion.span 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 text-secondary text-xs rounded-full font-medium border border-secondary/20"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="w-2 h-2 bg-secondary rounded-full" />
                    {podcast.host2VoiceName}
                  </motion.span>
                </div>
              </motion.div>

              {/* Enhanced Waveform */}
              <motion.div 
                className="mb-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="bg-muted/10 rounded-2xl p-4 mb-4 border border-border/30">
                  <EnhancedWaveform
                    duration={duration}
                    currentTime={currentTime}
                    onSeek={handleSeek}
                    segments={segments}
                  />
                </div>
                
                {/* Enhanced Time display */}
                <div className="flex justify-between items-center">
                  <motion.div 
                    className="text-sm font-mono text-foreground bg-background px-3 py-1.5 rounded-lg border border-border shadow-sm"
                    key={`current-${formatTime(currentTime)}`}
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                  >
                    {formatTime(currentTime)}
                  </motion.div>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden shadow-inner">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-accent to-accent/80 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-mono text-muted-foreground bg-muted px-3 py-1.5 rounded-lg shadow-sm">
                    {formatTime(duration)}
                  </div>
                </div>
              </motion.div>

              {/* Main Controls */}
              <motion.div 
                className="flex items-center justify-center gap-4 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={restart}
                    disabled={isLoading}
                    className="w-11 h-11 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={skipBackward}
                    disabled={isLoading}
                    className="w-11 h-11 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    onClick={togglePlayPause}
                    disabled={isLoading || !podcast.audioUrl}
                    className="w-16 h-16 bg-accent hover:bg-accent/90 text-accent-foreground rounded-full shadow-xl hover:shadow-2xl transition-all duration-300"
                  >
                    <AnimatePresence mode="wait">
                      {isLoading ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1, rotate: 360 }}
                          exit={{ opacity: 0 }}
                          transition={{ rotate: { duration: 1, repeat: Infinity, ease: "linear" } }}
                          className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                        />
                      ) : isPlaying ? (
                        <motion.div
                          key="pause"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Pause className="h-6 w-6" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="play"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Play className="h-6 w-6 ml-0.5" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={skipForward}
                    disabled={isLoading}
                    className="w-11 h-11 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDownload}
                    disabled={!podcast.audioUrl}
                    className="w-11 h-11 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </motion.div>
              </motion.div>

              {/* Secondary Controls */}
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {/* Volume Control */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-muted-foreground hover:text-foreground rounded-lg p-2"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  <div className="relative flex-1 h-2">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer slider"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-10 font-medium text-right">
                    {Math.round(volume * 100)}%
                  </span>
                </div>

                {/* Speed Control */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground font-medium min-w-fit">Speed:</span>
                  <select
                    value={playbackRate}
                    onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                    className="flex-1 text-sm bg-muted border-0 rounded-lg px-3 py-2 text-foreground font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                  >
                    {speedOptions.map(speed => (
                      <option key={speed} value={speed}>
                        {speed}x
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: hsl(var(--accent));
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          transition: transform 0.2s ease;
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: hsl(var(--accent));
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          transition: transform 0.2s ease;
        }
        
        .slider::-moz-range-thumb:hover {
          transform: scale(1.2);
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

export default PodcastWithTranscriptRedesigned;
