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
        "rounded-lg p-5 border-2 transition-all cursor-pointer",
        isActive
          ? "bg-background border-purple-600 dark:border-purple-400 shadow-sm"
          : "bg-background border-border hover:border-purple-600 dark:hover:border-purple-400"
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <h3 className="text-[19px] font-semibold text-purple-600 dark:text-purple-400 leading-snug flex-1">
          {section.title}
        </h3>
        <span className="text-[19px] font-normal text-purple-600 dark:text-purple-400 mt-0.5 shrink-0 tabular-nums">
          {section.timestamp}
        </span>
      </div>
      <p className="text-[19px] font-normal text-muted-foreground leading-relaxed">
        {section.description}
      </p>
    </div>
  );
}
