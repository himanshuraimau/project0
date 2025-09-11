"use client";

import React, { useState } from 'react';
import { PodcastPlayer } from './podcast-player';
import { TranscriptViewer } from './transcript-viewer';
import { Podcast, PodcastSegment } from '@/lib/types/podcast.types';

interface PodcastWithTranscriptProps {
  podcast: Podcast;
  segments: PodcastSegment[];
  className?: string;
}

/**
 * Combined component that integrates PodcastPlayer with TranscriptViewer
 * Provides synchronized playback and transcript highlighting
 */
export const PodcastWithTranscript: React.FC<PodcastWithTranscriptProps> = ({
  podcast,
  segments,
  className
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = React.useRef<{ seek: (time: number) => void } | null>(null);

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    // Seek the audio player if ref is available
    if (playerRef.current?.seek) {
      playerRef.current.seek(time);
    }
  };

  return (
    <div className={`space-y-6 ${className || ''}`} role="region" aria-label="Podcast player with transcript">
      {/* Audio Player */}
      <PodcastPlayer
        ref={playerRef}
        podcast={podcast}
        segments={segments}
        onTimeUpdate={handleTimeUpdate}
      />
      
      {/* Synchronized Transcript */}
      <TranscriptViewer
        segments={segments}
        currentTime={currentTime}
        onSeek={handleSeek}
        host1Name={podcast.host1VoiceName}
        host2Name={podcast.host2VoiceName}
        showSpeakerNames={true}
        autoScroll={true}
      />
    </div>
  );
};

export default PodcastWithTranscript;