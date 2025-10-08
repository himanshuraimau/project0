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
  const [initialLoading, setInitialLoading] = useState(true);

  const generatePodcast = async (config: PodcastConfig) => {
    setLoading(true);
    setError(null);
    setShowPodcastConfig(false);

    const loadingToast = toast.loading("Generating podcast...", {
      description: "This may take a few minutes. Creating script, synthesizing voices, and processing audio...",
    });

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
        // Don't show success immediately - podcast is still generating
        // Start polling for completion status instead
        toast.dismiss(loadingToast);
        toast.success("Podcast generation started!", {
          description: "Your podcast is being generated. This may take a few minutes...",
        });
        
        // Start polling for status updates
        pollPodcastStatus(data.data.id);
      } else {
        throw new Error(data.error || "Failed to generate podcast");
      }
    } catch (error) {
      console.error("Error generating podcast:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate podcast";
      setError(errorMessage);
      
      // Dismiss loading toast and show error
      toast.dismiss(loadingToast);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const pollPodcastStatus = async (podcastId: string) => {
    const maxPollingTime = 10 * 60 * 1000; // 10 minutes max
    const pollInterval = 5000; // 5 seconds
    const startTime = Date.now();
    
    const poll = async () => {
      try {
        const response = await fetch(`/api/podcasts/${podcastId}/progress`);
        const data = await response.json();
        
        if (data.success) {
          const { status, stage, message } = data.data;
          
          if (status === 'completed') {
            await fetchExistingPodcast();
            toast.success("Podcast generated successfully!", {
              description: "Your podcast is ready to play!",
            });
            return;
          }
          
          if (status === 'failed') {
            toast.error("Podcast generation failed", {
              description: data.data.error || "Please try again later",
            });
            return;
          }
          
          // Continue polling if still in progress
          if (status === 'generating' || status === 'pending') {
            if (Date.now() - startTime < maxPollingTime) {
              setTimeout(poll, pollInterval);
            } else {
              toast.error("Podcast generation timeout", {
                description: "The generation is taking longer than expected. Please check back later.",
              });
            }
          }
        }
      } catch (error) {
        console.error("Error polling podcast status:", error);
        if (Date.now() - startTime < maxPollingTime) {
          setTimeout(poll, pollInterval);
        }
      }
    };
    
    poll();
  };

  const fetchExistingPodcast = useCallback(async () => {
    setInitialLoading(true);
    try {
      const response = await fetch(`/api/notes/${noteId}/podcast`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setPodcast(data.data.podcast);
          setSegments(data.data.segments || []);
        }
   
      }
      
    } catch (error) {
      console.error("Error fetching existing podcast:", error);
    } finally {
      setInitialLoading(false);
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

  // Show loading state while checking for existing podcast
  if (initialLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] w-full flex items-center justify-center bg-background px-6">
        <div className="neomorphic rounded-3xl p-12 bg-background border-0 max-w-2xl w-full">
          <div className="flex flex-col items-center gap-8">
            {/* Neomorphic Animated Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative neomorphic-icon w-20 h-20 rounded-2xl flex items-center justify-center">
                <Mic className="h-10 w-10 text-primary animate-pulse" />
              </div>
            </div>

            {/* Loading Text */}
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-semibold text-foreground">Loading Podcast</h3>
              <p className="text-muted-foreground leading-relaxed">Checking for existing content...</p>
            </div>

            {/* Neomorphic Loading Bar */}
            <div className="w-64 h-2 neomorphic rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full animate-loading-bar" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state if podcast is generating
  if (podcast && podcast.generationStatus === 'generating') {
    return (
      <div className="h-screen flex items-center justify-center px-6">
        <div className="neomorphic rounded-3xl p-12 bg-background border-0 max-w-2xl w-full">
          <div className="text-center space-y-8">
            {/* Neomorphic Icon with Animation */}
            <div className="neomorphic-icon w-20 h-20 rounded-2xl flex items-center justify-center mx-auto">
              <Brain className="h-10 w-10 text-primary animate-pulse" />
            </div>
            
            <div className="space-y-6">
              <LoadingState
                message="Generating Podcast"
                submessage="This may take a few minutes. Creating script, synthesizing voices, and processing audio..."
                variant="ai"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if podcast generation failed
  if (podcast && podcast.generationStatus === 'failed') {
    return (
      <div className="h-screen flex items-center justify-center px-6">
        <div className="neomorphic rounded-3xl p-12 bg-background border-0 max-w-2xl w-full">
          <div className="text-center space-y-6">
            <div className="neomorphic-icon w-16 h-16 rounded-2xl flex items-center justify-center mx-auto bg-red-50 dark:bg-red-950/20">
              <span className="text-3xl">⚠️</span>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-2xl font-semibold text-foreground">Podcast Generation Failed</h3>
              <p className="text-muted-foreground leading-relaxed">
                {podcast.generationError || "An error occurred while generating the podcast"}
              </p>
            </div>
            
            <div className="flex gap-4 justify-center pt-4">
              <Button 
                onClick={() => setShowPodcastConfig(true)} 
                disabled={loading}
                className="neomorphic border-0 bg-background hover:bg-background text-foreground shadow-none px-6 py-3 h-auto rounded-xl transition-all duration-300"
              >
                <div className="neomorphic-icon w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                  <Mic className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium">Try Again</span>
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    className="neomorphic border-0 bg-background hover:bg-background text-red-600 shadow-none px-6 py-3 h-auto rounded-xl transition-all duration-300"
                  >
                    <div className="neomorphic-icon w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="font-medium">Delete</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Failed Podcast</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this failed podcast attempt?
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
        </div>

        {showPodcastConfig && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-hidden">
            <div className="neomorphic bg-background/100 rounded-3xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden relative border-0">
              <button
                onClick={() => setShowPodcastConfig(false)}
                className="absolute top-4 right-4 z-10 neomorphic-icon w-10 h-10 rounded-xl flex items-center justify-center hover:scale-105 transition-all duration-300 cursor-pointer"
                aria-label="Close popup"
              >
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="p-8 overflow-y-auto max-h-[80vh] bg-background">
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

  // If we have a completed podcast with audio, show the player
  if (podcast && podcast.audioUrl && podcast.generationStatus === 'completed') {
    return (
      <div className="h-screen flex flex-col">
        {/* Neomorphic Header */}
        <div className="neomorphic mx-6 mt-6 mb-4 rounded-2xl bg-background">
          <div className="flex items-center justify-between px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="neomorphic-icon w-12 h-12 rounded-xl flex items-center justify-center">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Podcast</h2>
                <p className="text-sm text-muted-foreground mt-1">AI-generated audio content</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowPodcastConfig(true)}
                disabled={loading}
                className="neomorphic border-0 bg-background hover:bg-background text-foreground shadow-none px-4 py-2 h-auto rounded-xl transition-all duration-300"
              >
                <div className="neomorphic-icon w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                  <Mic className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium">Regenerate</span>
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="neomorphic border-0 bg-background hover:bg-background text-red-600 shadow-none px-4 py-2 h-auto rounded-xl transition-all duration-300"
                  >
                    <div className="neomorphic-icon w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="font-medium">Delete</span>
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
        </div>

        <div className="flex-1 px-6 pb-6">
          <PodcastWithTranscript
            podcast={podcast}
            segments={segments}
          />
        </div>

        {showPodcastConfig && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-hidden">
            <div className="neomorphic bg-background/100 rounded-3xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden relative border-0">
              <button
                onClick={() => setShowPodcastConfig(false)}
                className="absolute top-4 right-4 z-10 neomorphic-icon w-10 h-10 rounded-xl flex items-center justify-center hover:scale-105 transition-all duration-300 cursor-pointer"
                aria-label="Close popup"
              >
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="p-8 overflow-y-auto max-h-[80vh] bg-background">
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
    <div className="px-6 py-8 w-full min-h-[70vh] bg-background">
      <div className="space-y-8">
        {/* Generate Podcast Section */}
        <div className="text-center min-h-[78vh] flex items-center justify-center">
          <div className="neomorphic rounded-3xl p-12 bg-background border-0 w-full max-w-2xl">
            <div className="flex flex-col items-center justify-center space-y-8">
              {/* Neomorphic Icon Container */}
              <div className="neomorphic-icon w-20 h-20 rounded-2xl flex items-center justify-center">
                <Brain className="h-10 w-10 text-primary" />
              </div>
              
              <div className="text-center space-y-4">
                <h3 className="text-3xl font-semibold text-foreground">
                  Generate Podcast
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                  Transform your notes into an engaging podcast that helps you understand the relationships between key concepts.
                </p>
              </div>
              
              <Button
                onClick={() => setShowPodcastConfig(true)}
                disabled={loading}
                className="neomorphic border-0 bg-background hover:bg-background text-foreground shadow-none px-16 py-6 h-auto rounded-2xl transition-all duration-300 group w-full max-w-xl"
              >
                <div className="neomorphic-icon w-10 h-10 rounded-xl flex items-center justify-center mr-4 group-hover:scale-105 transition-transform duration-300">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xl font-medium">
                  {loading ? "Generating..." : "Generate Podcast"}
                </span>
              </Button>

              {loading && (
                <div className="mt-6">
                  <LoadingState
                    message="Generating Podcast"
                    submessage="This may take a few minutes. Creating script, synthesizing voices, and processing audio..."
                    variant="ai"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Podcast Configuration Popup */}
      {showPodcastConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-hidden">
          <div className="neomorphic bg-background/100 rounded-3xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden relative border-0">
            <button
              onClick={() => setShowPodcastConfig(false)}
              className="absolute top-4 right-4 z-10 neomorphic-icon w-10 h-10 rounded-xl flex items-center justify-center hover:scale-105 transition-all duration-300 cursor-pointer"
              aria-label="Close popup"
            >
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="p-8 overflow-y-auto max-h-[80vh] bg-background">
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