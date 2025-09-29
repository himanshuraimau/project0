"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Trash2, Brain } from "lucide-react";
import { toast } from "sonner";
import { PodcastWithTranscript, PodcastConfigurationInline } from "./";
import { Podcast, PodcastConfig, PodcastSegment } from "@/lib/types/podcast.types";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPodcastConfig, setShowPodcastConfig] = useState(false);
  const [showPodcastForm, setShowPodcastForm] = useState(false);

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
        setPodcast(data.data);
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
          setPodcast(data.data);
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
      <div className="space-y-4 px-6 py-4 mx-4 my-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Podcast</h2>
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

        <PodcastWithTranscript
          podcast={podcast}
          segments={[]} // You might need to fetch segments separately
        />

        {showPodcastConfig && (
          <PodcastConfigurationInline
            noteId={noteId}
            onGenerate={generatePodcast}
            loading={loading}
          />
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
                onClick={() => {
                  setShowPodcastForm(true);
                  // Scroll down to show the podcast configuration form
                  setTimeout(() => {
                    window.scrollBy({
                      top: window.innerHeight * 0.8, // Scroll down by 80% of viewport height
                      behavior: 'smooth'
                    });
                  }, 100); // Small delay to ensure the form is rendered
                }}
                disabled={loading}
                className="flex items-center gap-2 bg-accent hover:bg-accent/90 cursor-pointer text-accent-foreground text-base px-6 py-3 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <Brain className="h-4 w-4" />
                Generate Podcast
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Generate Podcast Section - Only show when button is clicked */}
        {showPodcastForm && (
          <>
            <div className="text-center">
              <h2 className="text-3xl font-medium text-stone-900 dark:text-stone-100 mb-3">
                Generate Podcast
              </h2>
              <p className="text-stone-600 dark:text-stone-400 text-base max-w-2xl mx-auto">
                Configure your podcast settings to transform your notes into an engaging conversation between two AI hosts.
              </p>
            </div>

            {error && (
              <div className="text-red-600 text-base mb-4 text-center bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                {error}
              </div>
            )}

            {/* Show the inline configuration form */}
            <PodcastConfigurationInline
              noteId={noteId}
              onGenerate={generatePodcast}
              loading={loading}
            />
          </>
        )}
      </div>
    </div>
  );
}