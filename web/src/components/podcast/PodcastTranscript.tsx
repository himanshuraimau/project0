'use client';

import React, { useEffect, useRef } from 'react';

interface TranscriptItem {
  speaker: string;
  text: string;
  startTime?: number; // In seconds
  endTime?: number; // In seconds
}

interface PodcastTranscriptProps {
  transcript: TranscriptItem[];
  title: string;
  currentTime?: number;
}

// Parse timestamp - already in seconds from backend
function parseTimestamp(startTime?: number): number {
  return startTime || 0;
}

export function PodcastTranscript({ transcript, title, currentTime = 0 }: PodcastTranscriptProps) {
  const activeItemRef = useRef<HTMLDivElement>(null);
  
  if (!transcript || transcript.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          No transcript available for this podcast.
        </p>
      </div>
    );
  }

  // Find the current active transcript item based on startTime
  const activeIndex = transcript.findIndex((item, index) => {
    const itemTime = parseTimestamp(item.startTime);
    const nextItemTime = index < transcript.length - 1 
      ? parseTimestamp(transcript[index + 1].startTime)
      : Infinity;
    return currentTime >= itemTime && currentTime < nextItemTime;
  });

  // Auto-scroll to active item
  useEffect(() => {
    if (activeItemRef.current && activeIndex >= 0) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  // Group transcript into sections (chunks of ~5-8 items)
  const sections: { title: string; items: typeof transcript; sectionNumber: number; startTime: number }[] = [];
  const ITEMS_PER_SECTION = 6;
  
  for (let i = 0; i < transcript.length; i += ITEMS_PER_SECTION) {
    const chunk = transcript.slice(i, i + ITEMS_PER_SECTION);
    const firstSpeaker = chunk[0]?.speaker || 'Speaker';
    const sectionNumber = Math.floor(i / ITEMS_PER_SECTION) + 1;
    const sectionStartTime = chunk[0]?.startTime || 0;
    
    sections.push({
      title: `Section ${sectionNumber} - ${firstSpeaker} (${formatTimeFromSeconds(sectionStartTime)})`,
      items: chunk,
      sectionNumber,
      startTime: sectionStartTime
    });
  }

  // Helper to format seconds into MM:SS
  function formatTimeFromSeconds(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-900 rounded-lg p-4 mb-6 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
          <span>📝</span>
          {title} - Transcript
        </h2>
      </div>

      {/* Transcript Sections */}
      <div className="space-y-4">
        {sections.map((section, sectionIndex) => {
          // Check if any item in this section is active
          const hasActiveItem = section.items.some((_, idx) => {
            const globalIndex = sectionIndex * ITEMS_PER_SECTION + idx;
            return globalIndex === activeIndex;
          });

          return (
            <div 
              key={sectionIndex} 
              className={`border rounded-lg overflow-hidden transition-all ${
                hasActiveItem 
                  ? 'border-purple-400 dark:border-purple-600 shadow-lg' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {/* Section Header */}
              <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {section.title}
                </h3>
              </div>
              
              {/* Section Content */}
              <div className="p-4 space-y-4">
                {section.items.map((item, idx) => {
                  const globalIndex = sectionIndex * ITEMS_PER_SECTION + idx;
                  const isActive = globalIndex === activeIndex;
                  
                  return (
                    <div 
                      key={globalIndex}
                      ref={isActive ? activeItemRef : null}
                      className={`flex gap-3 p-2 rounded-lg transition-all ${
                        isActive 
                          ? 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 -ml-1 pl-3' 
                          : ''
                      }`}
                    >
                      {/* Speaker Label */}
                      <div className="shrink-0">
                        <span 
                          className="inline-block px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-medium cursor-default"
                          title={item.speaker}
                        >
                          {item.speaker}
                        </span>
                        {item.startTime !== undefined && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center">
                            {formatTimeFromSeconds(item.startTime)}
                          </div>
                        )}
                      </div>

                      {/* Text Content */}
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
