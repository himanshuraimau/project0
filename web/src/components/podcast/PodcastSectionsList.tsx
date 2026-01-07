"use client";

import React, { useRef, useEffect } from "react";

interface TranscriptItem {
  speaker: string;
  text: string;
  startTime?: number;
  endTime?: number;
}

interface PodcastSectionsListProps {
  transcript: TranscriptItem[];
  onSectionClick?: (time: number) => void;
  currentTime?: number;
}

// Helper to format seconds into MM:SS
function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function PodcastSectionsList({
  transcript,
  onSectionClick,
  currentTime = 0,
}: PodcastSectionsListProps) {
  const activeItemRef = useRef<HTMLDivElement>(null);

  if (!transcript || transcript.length === 0) {
    return (
      <div className="bg-[#F9FAFB] dark:bg-gray-800 rounded-lg p-8 border border-neutral-200 dark:border-gray-700 text-center">
        <p className="text-base font-normal text-muted-foreground">
          No transcript available for this podcast.
        </p>
      </div>
    );
  }

  // Group transcript into sections (1 item per section)
  const sections: { title: string; items: TranscriptItem[]; startTime: number; index: number }[] = [];
  const ITEMS_PER_SECTION = 1;

  for (let i = 0; i < transcript.length; i += ITEMS_PER_SECTION) {
    const chunk = transcript.slice(i, i + ITEMS_PER_SECTION);
    const sectionStartTime = chunk[0]?.startTime || 0;
    const sectionEndTime = chunk[chunk.length - 1]?.endTime || sectionStartTime;
    
    sections.push({
      title: `${formatTime(sectionStartTime)} - ${formatTime(sectionEndTime)}`,
      items: chunk,
      startTime: sectionStartTime,
      index: i
    });
  }

  // Find active section based on currentTime
  const activeSectionIndex = sections.findIndex((section, index) => {
    const nextSection = sections[index + 1];
    return currentTime >= section.startTime && (!nextSection || currentTime < nextSection.startTime);
  });

  // Auto-scroll to active section
  useEffect(() => {
    if (activeItemRef.current && activeSectionIndex >= 0) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeSectionIndex]);

  return (
    <div className="space-y-3">
      {sections.map((section, sectionIdx) => {
        const isActive = sectionIdx === activeSectionIndex;
        
        return (
          <div
            key={sectionIdx}
            ref={isActive ? activeItemRef : null}
            onClick={() => onSectionClick?.(section.startTime)}
            className={`border rounded-lg overflow-hidden transition-all cursor-pointer hover:shadow-md ${
              isActive
                ? 'border-purple-400 dark:border-purple-600 shadow-lg bg-purple-50 dark:bg-purple-900/10'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
            }`}
          >
            {/* Section Header */}
            <div className={`px-4 py-2.5 border-b transition-colors ${
              isActive 
                ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800' 
                : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-semibold ${
                  isActive 
                    ? 'text-purple-700 dark:text-purple-300' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {section.title}
                </h3>
                {isActive && (
                  <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">
                    Playing
                  </span>
                )}
              </div>
            </div>

            {/* Section Content */}
            <div className="p-3 space-y-2.5">
              {section.items.map((item, itemIdx) => (
                <div key={itemIdx} className="flex gap-2.5">
                  {/* Speaker Badge */}
                  <div className="shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-medium">
                      {item.speaker}
                    </span>
                    {item.startTime !== undefined && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 text-center">
                        {formatTime(item.startTime)}
                      </div>
                    )}
                  </div>

                  {/* Text Preview */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
