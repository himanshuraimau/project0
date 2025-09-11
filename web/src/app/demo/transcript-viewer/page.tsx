"use client";

import React, { useState } from 'react';
import { TranscriptViewer } from '@/components/podcast/transcript-viewer';
import { PodcastSegment } from '@/lib/types/podcast.types';

const mockSegments: PodcastSegment[] = [
  {
    id: 1,
    podcastId: 'demo-podcast',
    speaker: 'host1',
    content: 'Welcome to our podcast about artificial intelligence and machine learning. Today we have an exciting discussion planned.',
    startTime: 0,
    endTime: 8,
    sequenceOrder: 1,
    createdAt: new Date()
  },
  {
    id: 2,
    podcastId: 'demo-podcast',
    speaker: 'host2',
    content: 'Thank you for having me! I\'m really excited to dive into the world of AI and explore how it\'s transforming various industries.',
    startTime: 8,
    endTime: 16,
    sequenceOrder: 2,
    createdAt: new Date()
  },
  {
    id: 3,
    podcastId: 'demo-podcast',
    speaker: 'host1',
    content: 'Let\'s talk about machine learning fundamentals first. Can you explain what neural networks are and how they work?',
    startTime: 16,
    endTime: 24,
    sequenceOrder: 3,
    createdAt: new Date()
  },
  {
    id: 4,
    podcastId: 'demo-podcast',
    speaker: 'host2',
    content: 'Absolutely! Neural networks are computational models inspired by biological neural networks. They consist of interconnected nodes that process information.',
    startTime: 24,
    endTime: 35,
    sequenceOrder: 4,
    createdAt: new Date()
  }
];

export default function TranscriptViewerDemo() {
  const [currentTime, setCurrentTime] = useState(0);

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    console.log('Seeking to:', time);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">TranscriptViewer Demo</h1>
      
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label>Current Time: {currentTime}s</label>
          <input
            type="range"
            min="0"
            max="35"
            value={currentTime}
            onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
            className="flex-1"
          />
        </div>
        
        <TranscriptViewer
          segments={mockSegments}
          currentTime={currentTime}
          onSeek={handleSeek}
          host1Name="Alice"
          host2Name="Bob"
          showSpeakerNames={true}
          autoScroll={true}
        />
      </div>
    </div>
  );
}