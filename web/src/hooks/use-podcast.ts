"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Podcast, PodcastSegment, PodcastConfig } from "@/lib/types/podcast.types";

interface UsePodcastReturn {
  podcast: Podcast | null;
  segments: PodcastSegment[];
  loading: boolean;
  error: string | null;
  generatePodcast: (noteId: string, config: PodcastConfig) => Promise<void>;
  getPodcast: (noteId: string) => Promise<Podcast | null>;
  deletePodcast: (noteId: string) => Promise<void>;
  refreshPodcast: (noteId: string) => Promise<void>;
}

export function usePodcast(): UsePodcastReturn {
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [segments, setSegments] = useState<PodcastSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePodcast = useCallback(async (noteId: string, config: PodcastConfig) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/notes/${noteId}/podcast/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate podcast");
      }

      if (data.success) {
        toast.success("Podcast generation started! This may take a few minutes.");
        
        // Poll for completion
        const pollForCompletion = async () => {
          let attempts = 0;
          const maxAttempts = 60; // 5 minutes with 5-second intervals
          
          const poll = async () => {
            attempts++;
            
            try {
              const statusResponse = await fetch(`/api/notes/${noteId}/podcast`);
              const statusData = await statusResponse.json();
              
              if (statusData.success && statusData.data) {
                const podcastData = statusData.data;
                
                if (podcastData.generationStatus === 'completed') {
                  setPodcast(podcastData);
                  
                  // Fetch segments if available
                  if (podcastData.id) {
                    const segmentsResponse = await fetch(`/api/podcasts/${podcastData.id}`);
                    const segmentsData = await segmentsResponse.json();
                    
                    if (segmentsData.success && segmentsData.data.segments) {
                      setSegments(segmentsData.data.segments);
                    }
                  }
                  
                  toast.success("Podcast generated successfully!");
                  return;
                } else if (podcastData.generationStatus === 'failed') {
                  throw new Error(podcastData.generationError || "Podcast generation failed");
                } else if (attempts < maxAttempts) {
                  // Still generating, continue polling
                  setTimeout(poll, 5000);
                } else {
                  throw new Error("Podcast generation timed out");
                }
              } else if (attempts < maxAttempts) {
                setTimeout(poll, 5000);
              } else {
                throw new Error("Failed to check podcast generation status");
              }
            } catch (pollError) {
              console.error("Error polling podcast status:", pollError);
              setError(pollError instanceof Error ? pollError.message : "Failed to generate podcast");
              toast.error("Podcast generation failed");
            }
          };
          
          poll();
        };
        
        pollForCompletion();
      } else {
        throw new Error(data.error || "Failed to start podcast generation");
      }
    } catch (err) {
      console.error("Error generating podcast:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to generate podcast";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPodcast = useCallback(async (noteId: string): Promise<Podcast | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/notes/${noteId}/podcast`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          // No podcast exists for this note
          setPodcast(null);
          setSegments([]);
          return null;
        }
        throw new Error(data.error || "Failed to fetch podcast");
      }

      if (data.success && data.data) {
        const podcastData = data.data;
        setPodcast(podcastData);

        // Fetch detailed segments if podcast exists and is completed
        if (podcastData.id && podcastData.generationStatus === 'completed') {
          try {
            const segmentsResponse = await fetch(`/api/podcasts/${podcastData.id}`);
            const segmentsData = await segmentsResponse.json();
            
            if (segmentsData.success && segmentsData.data.segments) {
              setSegments(segmentsData.data.segments);
            }
          } catch (segmentError) {
            console.error("Error fetching podcast segments:", segmentError);
            // Don't fail the whole operation if segments can't be fetched
          }
        }

        return podcastData;
      }

      return null;
    } catch (err) {
      console.error("Error fetching podcast:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch podcast";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePodcast = useCallback(async (noteId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/notes/${noteId}/podcast`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete podcast");
      }

      if (data.success) {
        setPodcast(null);
        setSegments([]);
        toast.success("Podcast deleted successfully");
      } else {
        throw new Error(data.error || "Failed to delete podcast");
      }
    } catch (err) {
      console.error("Error deleting podcast:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to delete podcast";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPodcast = useCallback(async (noteId: string) => {
    await getPodcast(noteId);
  }, [getPodcast]);

  return {
    podcast,
    segments,
    loading,
    error,
    generatePodcast,
    getPodcast,
    deletePodcast,
    refreshPodcast,
  };
}