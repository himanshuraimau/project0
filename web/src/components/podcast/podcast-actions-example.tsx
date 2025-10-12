/**
 * Example usage of Podcast Action Components
 * This demonstrates how to integrate the action components with the podcast service
 * Requirements: 4.2, 4.3, 4.4
 */

"use client";

import React from "react";
import { PodcastActions } from "./podcast-actions";
import { usePodcast } from "@/hooks/use-podcast";
import type { Podcast, PodcastGenerationOptions } from "@/lib/types/podcast";

interface PodcastActionsExampleProps {
  podcast: Podcast;
  noteId: string;
}

export function PodcastActionsExample({ 
  podcast, 
  noteId 
}: PodcastActionsExampleProps) {
  const { 
    regeneratePodcast, 
    deletePodcast, 
    loading 
  } = usePodcast(noteId);

  // Handle podcast regeneration
  const handleRegenerate = async (options: PodcastGenerationOptions) => {
    try {
      await regeneratePodcast(podcast.id, options);
    } catch (error) {
      console.error("Failed to regenerate podcast:", error);
      throw error; // Re-throw to let the component handle the error display
    }
  };

  // Handle podcast deletion
  const handleDelete = async () => {
    try {
      await deletePodcast(podcast.id);
    } catch (error) {
      console.error("Failed to delete podcast:", error);
      throw error; // Re-throw to let the component handle the error display
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Podcast Actions</h3>
      
      <PodcastActions
        podcast={podcast}
        onRegenerate={handleRegenerate}
        onDelete={handleDelete}
        disabled={loading}
        showDelete={true}
      />
      
      <div className="mt-4 text-sm text-muted-foreground">
        <p>Status: {podcast.status}</p>
        {podcast.duration && <p>Duration: {Math.floor(podcast.duration / 60)}m {podcast.duration % 60}s</p>}
        {podcast.audioUrl && <p>Audio available for download</p>}
      </div>
    </div>
  );
}

// Example of using individual action components
export function IndividualActionsExample({ 
  podcast, 
  noteId 
}: PodcastActionsExampleProps) {
  const { regeneratePodcast, deletePodcast, loading } = usePodcast(noteId);

  const handleRegenerate = async (options: PodcastGenerationOptions) => {
    await regeneratePodcast(podcast.id, options);
  };

  const handleDelete = async () => {
    await deletePodcast(podcast.id);
  };

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h3 className="text-lg font-semibold">Individual Action Components</h3>
      
      <div className="flex flex-wrap gap-2">
        {/* Import individual components */}
        {/* 
        <RegenerateButton 
          podcast={podcast} 
          onRegenerate={handleRegenerate}
          disabled={loading}
        />
        
        <DownloadButton 
          podcast={podcast}
          disabled={loading}
        />
        
        <ViewTranscriptButton 
          podcast={podcast}
          disabled={loading}
        />
        
        <DeletePodcastButton 
          podcast={podcast}
          onDelete={handleDelete}
          disabled={loading}
        />
        */}
      </div>
    </div>
  );
}