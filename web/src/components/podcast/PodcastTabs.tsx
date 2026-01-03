'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PodcastTabsProps {
  activeTab: 'sections' | 'transcript';
  onTabChange: (tab: 'sections' | 'transcript') => void;
}

export function PodcastTabs({ activeTab, onTabChange }: PodcastTabsProps) {
  return (
    <div className="mb-6">
      <div className="flex gap-2">
        <button
          onClick={() => onTabChange('sections')}
          className={cn(
            'px-6 py-2 rounded-lg text-sm font-medium transition-all',
            'border-2',
            activeTab === 'sections'
              ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
              : 'border-transparent bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
        >
          Sections
        </button>

        <button
          onClick={() => onTabChange('transcript')}
          className={cn(
            'px-6 py-2 rounded-lg text-sm font-medium transition-all',
            'border-2',
            activeTab === 'transcript'
              ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
              : 'border-transparent bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
        >
          Full Transcript
        </button>
      </div>
    </div>
  );
}
