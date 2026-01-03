'use client';

import React from 'react';

interface TranscriptItem {
  speaker: string;
  text: string;
  timestamp?: string;
}

interface PodcastTranscriptProps {
  transcript: TranscriptItem[];
  title: string;
}

export function PodcastTranscript({ transcript, title }: PodcastTranscriptProps) {
  if (!transcript || transcript.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          No transcript available for this podcast.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-900 rounded-lg p-4 mb-6 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
          <span>📝</span>
          {title} - Transcript
        </h2>
      </div>

      {/* Transcript Content */}
      <div className="space-y-6">
        {transcript.map((item, index) => (
          <div key={index} className="flex gap-4">
            {/* Speaker Label */}
            <div className="shrink-0">
              <span className="inline-block px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-sm font-medium">
                {item.speaker}
              </span>
              {item.timestamp && (
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center">
                  {item.timestamp}
                </div>
              )}
            </div>

            {/* Text Content */}
            <div className="flex-1">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {item.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
