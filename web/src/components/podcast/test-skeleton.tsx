// Simple test file to verify skeleton components work
import React from 'react';
import { PodcastSkeleton } from './podcast-skeleton';

export function TestSkeletonComponents() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Generator Skeleton</h2>
        <PodcastSkeleton variant="generator" />
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Player Skeleton</h2>
        <PodcastSkeleton variant="player" />
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Layout Skeleton</h2>
        <PodcastSkeleton variant="layout" />
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Form Skeleton</h2>
        <PodcastSkeleton variant="form" />
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Compact Skeleton</h2>
        <PodcastSkeleton variant="compact" />
      </div>
    </div>
  );
}