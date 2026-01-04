'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PodcastTabsProps {
  activeTab: 'sections' | 'transcript';
  onTabChange: (tab: 'sections' | 'transcript') => void;
}

export function PodcastTabs({ activeTab, onTabChange }: PodcastTabsProps) {
  return (
    <div>
      <div className="flex gap-4">
        <button
          onClick={() => onTabChange('sections')}
          className={cn(
            'flex-1 px-8 py-3.5 text-[19px] font-semibold transition-all',
            'border-2',
            activeTab === 'sections'
              ? 'border-purple-600 bg-purple-50 text-purple-700 dark:border-purple-400 dark:bg-purple-950 dark:text-purple-300'
              : 'border-transparent bg-background text-muted-foreground hover:text-purple-600 hover:border-purple-600 hover:bg-purple-50 dark:hover:text-purple-400 dark:hover:border-purple-400 dark:hover:bg-purple-950'
          )}
        >
          Sections
        </button>

        <button
          onClick={() => onTabChange('transcript')}
          className={cn(
            'flex-1 px-8 py-3.5 text-[19px] font-semibold transition-all',
            'border-2',
            activeTab === 'transcript'
              ? 'border-purple-600 bg-purple-50 text-purple-700 dark:border-purple-400 dark:bg-purple-950 dark:text-purple-300'
              : 'border-transparent bg-background text-muted-foreground hover:text-purple-600 hover:border-purple-600 hover:bg-purple-50 dark:hover:text-purple-400 dark:hover:border-purple-400 dark:hover:bg-purple-950'
          )}
        >
          Full Transcript
        </button>
      </div>
    </div>
  );
}
