'use client';

import React from 'react';
import { PodcastSection } from './types';
import { cn } from '@/lib/utils';

interface PodcastSectionCardProps {
  section: PodcastSection;
  onClick?: () => void;
  isActive?: boolean;
}

export function PodcastSectionCard({ section, onClick, isActive = false }: PodcastSectionCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-lg p-4 border transition-all cursor-pointer",
        isActive
          ? "bg-purple-50 dark:bg-purple-950/50 border-purple-300 dark:border-purple-700 shadow-md"
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-purple-600 dark:text-purple-400 font-medium text-base">
          {section.title}
        </h3>
        <span className="text-purple-600 dark:text-purple-400 text-sm font-medium ml-4 shrink-0">
          {section.timestamp}
        </span>
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        {section.description}
      </p>
    </div>
  );
}
