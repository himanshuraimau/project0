"use client";

import React from "react";
import { PodcastSection } from "./types";
import { PodcastSectionCard } from "./PodcastSectionCard";

interface PodcastSectionsListProps {
  sections: PodcastSection[];
  onSectionClick?: (timestamp: string) => void;
  currentTime?: number; // Current playback time in seconds
}

// Helper function to parse timestamp string to seconds
function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(":").map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

export function PodcastSectionsList({
  sections,
  onSectionClick,
  currentTime = 0,
}: PodcastSectionsListProps) {
  if (!sections || sections.length === 0) {
    return (
      <div className="bg-[#F9FAFB] dark:bg-gray-800 rounded-lg p-8 border border-neutral-200 dark:border-gray-700 text-center">
        <p className="text-base font-normal text-muted-foreground">
          No sections available for this podcast.
        </p>
      </div>
    );
  }

  // Determine which section is currently playing
  const getActiveSectionIndex = (): number => {
    for (let i = sections.length - 1; i >= 0; i--) {
      const sectionTime = parseTimestamp(sections[i].timestamp);
      if (currentTime >= sectionTime) {
        return i;
      }
    }
    return 0;
  };

  const activeSectionIndex = getActiveSectionIndex();

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <PodcastSectionCard
          key={index}
          section={section}
          isActive={index === activeSectionIndex}
          onClick={() => onSectionClick?.(section.timestamp)}
        />
      ))}
    </div>
  );
}
