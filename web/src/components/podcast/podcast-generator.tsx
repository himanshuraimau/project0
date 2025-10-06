"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Trash2, Brain } from "lucide-react";
import { toast } from "sonner";
import { PodcastWithTranscript, PodcastConfigurationInline } from "./";
import { Podcast, PodcastConfig, PodcastSegment } from "@/lib/types/podcast.types";
import { LoadingState } from "@/components/ui/loading-spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PodcastGeneratorProps {
  noteId: string;
  onClose?: () => void;
}

export function PodcastGenerator({ noteId }: PodcastGeneratorProps) {
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [segments, setSegments] = useState<PodcastSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPodcastConfig, setShowPodcastConfig] = useState(false);

  const generatePodcast = async (config: PodcastConfig) => {
    setLoading(true);
    setError(null);
    setShowPodcastConfig(false);

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
        // Fetch the updated podcast with segments
        fetchExistingPodcast();
        toast.success("Podcast generated successfully!");
      } else {
        throw new Error(data.error || "Failed to generate podcast");
      }
    } catch (error) {
      console.error("Error generating podcast:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate podcast";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingPodcast = useCallback(async () => {
    try {
      const response = await fetch(`/api/notes/${noteId}/podcast`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setPodcast(data.data.podcast);
          setSegments(data.data.segments || []);
        }
        // Don't automatically show config modal - let user click Generate button
      }
      // If no podcast exists, just show the generation UI without opening modal
    } catch (error) {
      console.error("Error fetching existing podcast:", error);
      // Don't show error for this - just means no podcast exists yet
    }
  }, [noteId]);

  const deletePodcast = async () => {
    if (!podcast) return;

    try {
      const response = await fetch(`/api/notes/${noteId}/podcast`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete podcast");
      }

      setPodcast(null);
      setSegments([]);
      toast.success("Podcast deleted successfully");
    } catch (error) {
      console.error("Error deleting podcast:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete podcast";
      toast.error(errorMessage);
    }
  };

  // Check for existing podcast on component mount
  React.useEffect(() => {
    fetchExistingPodcast();
  }, [fetchExistingPodcast]);

  // If we have a podcast, show the player
  if (podcast && podcast.audioUrl) {
    return (
      <div className="h-screen flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Podcast</h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowPodcastConfig(true)}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <Mic className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Podcast</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this podcast? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deletePodcast}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="flex-1">
          <PodcastWithTranscript
            podcast={podcast}
            segments={segments}
          />
        </div>

        {showPodcastConfig && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-hidden">
            <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden relative">
              <button
                onClick={() => setShowPodcastConfig(false)}
                className="absolute top-2 right-2 z-10 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                aria-label="Close popup"
              >
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="p-6 overflow-y-auto max-h-[80vh]">
                <PodcastConfigurationInline
                  noteId={noteId}
                  onGenerate={generatePodcast}
                  loading={loading}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show configuration form inline
  return (
    <div className="px-6 py-8 my-8 max-w-6xl mx-auto min-h-[70vh]">
      <div className="space-y-8">
        {/* Generate Podcast Section */}
        <div className="text-center min-h-[78vh] flex items-center justify-center">
          <Card className="bg-transparent border-none w-full">
            <CardContent className="flex flex-col items-center justify-center py-12 px-8">
              <h3 className="text-3xl font-medium text-stone-900 dark:text-stone-100 mb-3">
                Generate Podcast
              </h3>
              <p className="text-stone-600 dark:text-stone-400 text-base text-center mb-6 max-w-md">
                Transform your notes into an engaging podcast that helps you understand the relationships between key concepts.
              </p>
              
              <Button
                onClick={() => setShowPodcastConfig(true)}
                disabled={loading}
                className="flex items-center gap-2 bg-accent hover:bg-accent/90 cursor-pointer text-accent-foreground text-base px-6 py-3 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <Brain className="h-4 w-4" />
                {loading ? "Generating..." : "Generate Podcast"}
              </Button>

              {loading && (
                <div className="mt-4">
                  <LoadingState
                    message="Generating Podcast"
                    submessage="This may take a few minutes. Creating script, synthesizing voices, and processing audio..."
                    variant="ai"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Podcast Configuration Popup */}
      {showPodcastConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-hidden">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden relative">
            <button
              onClick={() => setShowPodcastConfig(false)}
              className="absolute top-2 right-4 z-10 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              aria-label="Close popup"
            >
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="p-6 overflow-y-auto max-h-[80vh]">
              <PodcastConfigurationInline
                noteId={noteId}
                onGenerate={generatePodcast}
                loading={loading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}