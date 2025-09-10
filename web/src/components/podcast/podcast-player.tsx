"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  Bookmark,
  BookmarkCheck,
  Menu,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Podcast, PodcastSegment } from '@/lib/types/podcast.types';

interface Bookmark {
  id: string;
  time: number;
  label: string;
  createdAt: Date;
}

interface ChapterMarker {
  time: number;
  title: string;
  speaker: 'host1' | 'host2';
}

interface PodcastPlayerProps {
  podcast: Podcast;
  segments: PodcastSegment[];
  onTimeUpdate?: (currentTime: number) => void;
  className?: string;
  compact?: boolean;
}

interface WaveformProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  segments: PodcastSegment[];
  bookmarks: Bookmark[];
  className?: string;
}

// Waveform visualization component with chapter markers and bookmarks
const Waveform: React.FC<WaveformProps> = ({ 
  audioRef, 
  duration, 
  currentTime, 
  onSeek,
  segments,
  bookmarks,
  className 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverTime, setHoverTime] = useState(0);
  const [hoverContent, setHoverContent] = useState<string>('');

  // Generate mock waveform data (in a real implementation, this would come from audio analysis)
  const generateWaveformData = useCallback(() => {
    const points = 200;
    return Array.from({ length: points }, () => Math.random() * 0.8 + 0.1);
  }, []);

  const waveformData = generateWaveformData();

  // Generate chapter markers from segments
  const chapterMarkers: ChapterMarker[] = segments
    .filter(segment => segment.startTime !== undefined)
    .map(segment => ({
      time: segment.startTime!,
      title: segment.content.substring(0, 50) + (segment.content.length > 50 ? '...' : ''),
      speaker: segment.speaker
    }));

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

    // Draw waveform
    const barWidth = width / waveformData.length;
    
    waveformData.forEach((amplitude, index) => {
      const barHeight = amplitude * height * 0.6; // Leave space for markers
      const x = index * barWidth;
      const y = (height - barHeight) / 2 + 10; // Offset for top markers
      
      // Determine bar color based on progress
      const barProgress = index / waveformData.length;
      let color = '#e5e7eb'; // Default gray
      
      if (barProgress <= progress) {
        color = '#3b82f6'; // Blue for played portion
      } else if (isHovering && barProgress <= hoverProgress) {
        color = '#93c5fd'; // Light blue for hover preview
      }
      
      ctx.fillStyle = color;
      ctx.fillRect(x, y, Math.max(barWidth - 1, 1), barHeight);
    });

    // Draw chapter markers
    chapterMarkers.forEach(marker => {
      if (duration > 0) {
        const markerX = (marker.time / duration) * width;
        ctx.fillStyle = marker.speaker === 'host1' ? '#f59e0b' : '#10b981';
        ctx.fillRect(markerX - 1, 5, 2, height - 10);
        
        // Draw small triangle at top
        ctx.beginPath();
        ctx.moveTo(markerX, 0);
        ctx.lineTo(markerX - 3, 5);
        ctx.lineTo(markerX + 3, 5);
        ctx.closePath();
        ctx.fill();
      }
    });

    // Draw bookmarks
    bookmarks.forEach(bookmark => {
      if (duration > 0) {
        const bookmarkX = (bookmark.time / duration) * width;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(bookmarkX - 1, 0, 2, height);
        
        // Draw bookmark icon
        ctx.beginPath();
        ctx.moveTo(bookmarkX - 3, 0);
        ctx.lineTo(bookmarkX + 3, 0);
        ctx.lineTo(bookmarkX + 3, 8);
        ctx.lineTo(bookmarkX, 5);
        ctx.lineTo(bookmarkX - 3, 8);
        ctx.closePath();
        ctx.fill();
      }
    });

    // Draw progress indicator
    const progressX = progress * width;
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(progressX - 1, 0, 2, height);

    // Draw hover indicator
    if (isHovering) {
      const hoverX = hoverProgress * width;
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(hoverX - 1, 0, 2, height);
    }
  }, [currentTime, duration, hoverTime, isHovering, waveformData, chapterMarkers, bookmarks]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    const time = progress * duration;
    
    setHoverTime(Math.max(0, Math.min(time, duration)));

    // Find content at hover time for tooltip
    const currentSegment = segments.find(segment => 
      segment.startTime !== undefined && 
      segment.endTime !== undefined &&
      time >= segment.startTime && 
      time <= segment.endTime
    );
    
    if (currentSegment) {
      const speakerName = currentSegment.speaker === 'host1' ? 'Host 1' : 'Host 2';
      const preview = currentSegment.content.substring(0, 100) + (currentSegment.content.length > 100 ? '...' : '');
      setHoverContent(`${speakerName}: ${preview}`);
    } else {
      setHoverContent('');
    }
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
        width={800}
        height={60}
        className="w-full h-15 cursor-pointer rounded-md"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={handleClick}
      />
      {isHovering && (
        <div 
          className="absolute -top-16 bg-black text-white text-xs px-3 py-2 rounded max-w-xs pointer-events-none z-10"
          style={{ 
            left: `${(hoverTime / duration) * 100}%`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="font-medium">{formatTime(hoverTime)}</div>
          {hoverContent && (
            <div className="mt-1 text-gray-300 leading-tight">{hoverContent}</div>
          )}
        </div>
      )}
    </div>
  );
};

// Speaker identification component
const SpeakerCard: React.FC<{
  speaker: 'host1' | 'host2';
  voiceName: string;
  isActive: boolean;
  className?: string;
}> = ({ speaker, voiceName, isActive, className }) => {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
      isActive 
        ? "bg-primary/10 border-primary text-primary" 
        : "bg-muted/50 border-border text-muted-foreground",
      className
    )}>
      <div className={cn(
        "w-2 h-2 rounded-full transition-all",
        isActive ? "bg-primary animate-pulse" : "bg-muted-foreground/50"
      )} />
      <span className="text-sm font-medium">
        {speaker === 'host1' ? 'Host 1' : 'Host 2'}: {voiceName}
      </span>
    </div>
  );
};

// Utility function to format time
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const PodcastPlayer: React.FC<PodcastPlayerProps> = ({
  podcast,
  segments,
  onTimeUpdate,
  className,
  compact = false
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentSpeaker, setCurrentSpeaker] = useState<'host1' | 'host2' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!compact);

  // Find current segment and speaker
  useEffect(() => {
    const currentSegment = segments.find(segment => 
      segment.startTime !== undefined && 
      segment.endTime !== undefined &&
      currentTime >= segment.startTime && 
      currentTime <= segment.endTime
    );
    setCurrentSpeaker(currentSegment?.speaker || null);
  }, [currentTime, segments]);

  // Audio event handlers
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleLoadStart = () => {
    setIsLoading(true);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
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

  // Bookmark functionality
  const addBookmark = () => {
    const newBookmark: Bookmark = {
      id: Date.now().toString(),
      time: currentTime,
      label: `Bookmark at ${formatTime(currentTime)}`,
      createdAt: new Date()
    };
    setBookmarks(prev => [...prev, newBookmark].sort((a, b) => a.time - b.time));
  };

  const removeBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(bookmark => bookmark.id !== id));
  };

  const jumpToBookmark = (time: number) => {
    handleSeek(time);
  };

  const isBookmarked = bookmarks.some(bookmark => 
    Math.abs(bookmark.time - currentTime) < 1
  );

  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // Responsive breakpoint detection
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Compact mode for mobile or embedded use
  if (compact && !isExpanded) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-4">
          <audio
            ref={audioRef}
            src={podcast.audioUrl}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onLoadStart={handleLoadStart}
            onCanPlay={handleCanPlay}
            preload="metadata"
          />
          
          {/* Compact header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{podcast.title}</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                {currentSpeaker && (
                  <span className="text-primary">
                    {currentSpeaker === 'host1' ? podcast.host1VoiceName : podcast.host2VoiceName}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Compact waveform */}
          <div className="mb-4">
            <Waveform
              audioRef={audioRef}
              duration={duration}
              currentTime={currentTime}
              onSeek={handleSeek}
              segments={segments}
              bookmarks={bookmarks}
              className="h-8"
            />
          </div>

          {/* Compact controls */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={skipBackward}
              disabled={isLoading}
            >
              <SkipBack className="h-3 w-3" />
            </Button>
            
            <Button
              onClick={togglePlayPause}
              disabled={isLoading || !podcast.audioUrl}
              className="w-10 h-10"
            >
              {isLoading ? (
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={skipForward}
              disabled={isLoading}
            >
              <SkipForward className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className={cn("p-6", isMobile && "p-4")}>
        {/* Audio element */}
        <audio
          ref={audioRef}
          src={podcast.audioUrl}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onLoadStart={handleLoadStart}
          onCanPlay={handleCanPlay}
          preload="metadata"
        />

        {/* Header with expand/collapse for compact mode */}
        {compact && (
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{podcast.title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Podcast title and info */}
        {!compact && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">{podcast.title}</h3>
            {podcast.description && (
              <p className="text-sm text-muted-foreground mb-4">{podcast.description}</p>
            )}
          </div>
        )}
        
        {/* Speaker cards - responsive layout */}
        <div className={cn(
          "flex gap-3 mb-4",
          isMobile ? "flex-col" : "flex-row"
        )}>
          <SpeakerCard
            speaker="host1"
            voiceName={podcast.host1VoiceName}
            isActive={currentSpeaker === 'host1'}
            className={isMobile ? "flex-1" : ""}
          />
          <SpeakerCard
            speaker="host2"
            voiceName={podcast.host2VoiceName}
            isActive={currentSpeaker === 'host2'}
            className={isMobile ? "flex-1" : ""}
          />
        </div>

        {/* Waveform with chapter markers and bookmarks */}
        <div className="mb-6">
          <Waveform
            audioRef={audioRef}
            duration={duration}
            currentTime={currentTime}
            onSeek={handleSeek}
            segments={segments}
            bookmarks={bookmarks}
          />
          
          {/* Time display and bookmark controls */}
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-muted-foreground">{formatTime(currentTime)}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={addBookmark}
                disabled={isBookmarked}
                className="text-xs"
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-3 w-3" />
                ) : (
                  <Bookmark className="h-3 w-3" />
                )}
                {!isMobile && (isBookmarked ? 'Bookmarked' : 'Bookmark')}
              </Button>
              {bookmarks.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBookmarks(!showBookmarks)}
                  className="text-xs"
                >
                  <Menu className="h-3 w-3" />
                  {!isMobile && `${bookmarks.length} bookmarks`}
                </Button>
              )}
            </div>
            <span className="text-sm text-muted-foreground">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Bookmarks list */}
        {showBookmarks && bookmarks.length > 0 && (
          <div className="mb-6 p-3 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Bookmarks</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {bookmarks.map(bookmark => (
                <div key={bookmark.id} className="flex items-center justify-between text-sm">
                  <button
                    onClick={() => jumpToBookmark(bookmark.time)}
                    className="flex-1 text-left hover:text-primary transition-colors"
                  >
                    <span className="font-mono">{formatTime(bookmark.time)}</span>
                    <span className="ml-2">{bookmark.label}</span>
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBookmark(bookmark.id)}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main controls - responsive layout */}
        <div className={cn(
          "flex items-center justify-center gap-4 mb-6",
          isMobile && "gap-2"
        )}>
          <Button
            variant="outline"
            size={isMobile ? "sm" : "icon"}
            onClick={restart}
            disabled={isLoading}
          >
            <RotateCcw className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
          </Button>
          
          <Button
            variant="outline"
            size={isMobile ? "sm" : "icon"}
            onClick={skipBackward}
            disabled={isLoading}
          >
            <SkipBack className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
          </Button>
          
          <Button
            size={isMobile ? "default" : "lg"}
            onClick={togglePlayPause}
            disabled={isLoading || !podcast.audioUrl}
            className={cn("w-12 h-12", isMobile && "w-10 h-10")}
          >
            {isLoading ? (
              <div className={cn(
                "w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin",
                isMobile && "w-3 h-3"
              )} />
            ) : isPlaying ? (
              <Pause className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
            ) : (
              <Play className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
            )}
          </Button>
          
          <Button
            variant="outline"
            size={isMobile ? "sm" : "icon"}
            onClick={skipForward}
            disabled={isLoading}
          >
            <SkipForward className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
          </Button>
          
          <Button
            variant="outline"
            size={isMobile ? "sm" : "icon"}
            onClick={handleDownload}
            disabled={!podcast.audioUrl}
          >
            <Download className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
          </Button>
        </div>

        {/* Secondary controls - responsive layout */}
        <div className={cn(
          "flex items-center justify-between",
          isMobile && "flex-col gap-4"
        )}>
          {/* Volume control */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className={cn(
                "h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer",
                isMobile ? "w-32" : "w-20"
              )}
            />
            {!isMobile && (
              <span className="text-xs text-muted-foreground w-8">
                {Math.round(volume * 100)}%
              </span>
            )}
          </div>

          {/* Speed control */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Speed:</span>
            <select
              value={playbackRate}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="text-sm bg-background border border-border rounded px-2 py-1"
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
  );
};

export default PodcastPlayer;