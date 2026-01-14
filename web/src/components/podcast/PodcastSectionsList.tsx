"use client";

import React from "react";

interface TranscriptItem {
  text: string;
  speaker?: string;
  startTime?: number;
  endTime?: number;
}

interface PodcastSectionsListProps {
  transcript: TranscriptItem[];
  onSectionClick?: (time: number) => void;
  currentTime?: number;
}

export function PodcastSectionsList({
  transcript,
  onSectionClick,
  currentTime = 0,
}: PodcastSectionsListProps) {
  if (!transcript || transcript.length === 0) {
    return (
      <div className="bg-[#F9FAFB] dark:bg-gray-800 rounded-lg p-8 border border-neutral-200 dark:border-gray-700 text-center">
        <p className="text-base font-normal text-muted-foreground">
          No transcript available for this audio.
        </p>
      </div>
    );
  }

  // Split transcript into readable sections
  const sections: { title: string; content: string; index: number }[] = [];

  transcript.forEach((item, idx) => {
    const text = item.text || '';

    // Split by paragraphs (double newlines) or sentences
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());

    if (paragraphs.length > 0) {
      paragraphs.forEach((paragraph, pIdx) => {
        // Split long paragraphs into smaller chunks (every 3-4 sentences)
        const sentences = paragraph.split(/(?<=[.!?])\s+/).filter(s => s.trim());
        const SENTENCES_PER_SECTION = 4;

        for (let i = 0; i < sentences.length; i += SENTENCES_PER_SECTION) {
          const chunk = sentences.slice(i, i + SENTENCES_PER_SECTION).join(' ');
          if (chunk.trim()) {
            // Create a title from first few words
            const words = chunk.trim().split(/\s+/);
            const titleWords = words.slice(0, 6).join(' ');
            const title = titleWords.length < chunk.length
              ? `${titleWords}...`
              : titleWords;

            sections.push({
              title: title,
              content: chunk.trim(),
              index: sections.length
            });
          }
        }
      });
    } else {
      // Fallback: just use the text as-is
      sections.push({
        title: `Section ${idx + 1}`,
        content: text,
        index: idx
      });
    }
  });

  // For single-narrator audio, display sections
  return (
    <div className="space-y-3">
      {sections.map((section, sectionIdx) => (
        <div
          key={sectionIdx}
          className="border rounded-lg overflow-hidden border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        >
          {/* Section Header */}
          <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {section.title}
            </h3>
          </div>

          {/* Section Content */}
          <div className="p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {section.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
