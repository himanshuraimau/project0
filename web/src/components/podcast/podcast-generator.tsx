"use client";

import React, { useState, useCallback, useEffect } from "react";
import "./podcast.css";
import { Button } from "@/components/ui/button";
import { Mic, Trash2, Download, FileText, RefreshCw, History, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PodcastForm } from "./podcast-form";
import { PodcastPlayer } from "./podcast-player";
import { PodcastLayout } from "./podcast-layout";
import { PodcastHistory } from "./podcast-history";
import { LoadingState } from "@/components/ui/loading-spinner";
import { PodcastSkeleton, PodcastGenerationSkeleton } from "./podcast-skeleton";
import { PodcastErrorBoundary } from "./podcast-error-boundary";
import { PodcastGenerationError, PodcastErrorDisplay } from "./podcast-error-components";
import { usePodcast } from "@/hooks/use-podcast";
import { usePodcastRetry } from "@/hooks/use-podcast-retry";
import type { PodcastGenerationForm } from "@/lib/types/podcast";
import { displayPodcastError, classifyPodcastError } from "@/lib/utils/podcast-error-handler";
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
  noteTitle?: string;
  noteContent?: string;
  onClose?: () => void;
}

function PodcastGeneratorInner({ noteId, noteTitle, noteContent }: PodcastGeneratorProps) {
  const [showForm, setShowForm] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const {
    podcasts,
    currentPodcast,
    loading,
    error,
    generating,
    progress,
    generatePodcast,
    getPodcastsByNote,
    getPodcast,
    deletePodcast,
    regeneratePodcast,
    getLatestPodcast,
    refreshPodcasts,
    getPodcastHistory,
    getLatestCompletedPodcast,
    hasMultiplePodcasts,
    getSupersededCount,
    hasError,
    isEmpty,
  } = usePodcast(noteId);

  // Enhanced retry mechanism for podcast operations
  const retryHook = usePodcastRetry(
    { operation: 'generate', noteId, timestamp: new Date() },
    {
      operation: 'generation',
      autoRetry: false,
      showToast: false, // We'll handle toasts manually
      onRetryStart: (retryCount) => {
        console.log(`Starting retry attempt ${retryCount} for podcast generation`);
      },
      onRetrySuccess: (retryCount) => {
        toast.success(`Podcast generation succeeded after ${retryCount} retries`);
      },
      onRetryFailed: (error, retryCount) => {
        toast.error(`Retry ${retryCount} failed: ${error.userMessage}`);
      },
      onMaxRetriesReached: (error) => {
        toast.error(`Maximum retries reached. ${error.userMessage}`);
      }
    }
  );

  // State for managing multiple podcasts
  const [podcastHistory, setPodcastHistory] = useState<{
    podcasts: any[];
    latest: any;
    inProgress: any;
    completed: any[];
    failed: any[];
    superseded: any[];
  } | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Get the latest completed or in-progress podcast
  const latestPodcast = podcasts.find(p => 
    p.status === 'COMPLETED' || p.status === 'IN_PROGRESS' || p.status === 'GENERATING'
  ) || currentPodcast;

  // Check for existing podcasts on component mount and load history
  const fetchExistingPodcasts = useCallback(async () => {
    setInitialLoading(true);
    try {
      await getPodcastsByNote(noteId);
      // Load podcast history for multiple podcast handling
      const history = await getPodcastHistory(noteId, false);
      setPodcastHistory(history);
    } catch (error) {
      console.error("Error fetching existing podcasts:", error);
      // Don't show error for this - just means no podcasts exist yet
    } finally {
      setInitialLoading(false);
    }
  }, [noteId, getPodcastsByNote, getPodcastHistory]);

  useEffect(() => {
    fetchExistingPodcasts();
  }, [fetchExistingPodcasts]);

  // Handle podcast generation with enhanced error handling
  const handleGeneratePodcast = async (formData: PodcastGenerationForm) => {
    const context = { 
      operation: 'generate' as const, 
      noteId, 
      timestamp: new Date(),
      generationOptions: formData as unknown as Record<string, unknown>
    };

    try {
      // Create voice settings object
      const voiceSettings: any = {
        hostVoiceId: formData.hostVoiceId,
      };
      
      // Add guest voice only if provided (for conversation mode)
      if (formData.guestVoiceId) {
        voiceSettings.guestVoiceId = formData.guestVoiceId;
      }

      const options = {
        mode: formData.mode.toUpperCase() as 'CONVERSATION' | 'BULLETIN',
        voiceSettings,
        qualityPreset: formData.qualityPreset.toUpperCase() as 'STANDARD' | 'HIGH' | 'HIGHEST' | 'ULTRA' | 'ULTRA_LOSSLESS',
        durationScale: formData.durationScale.toUpperCase() as 'SHORT' | 'DEFAULT' | 'LONG',
        ...(formData.language && { language: formData.language }),
        ...(formData.intro && { intro: formData.intro }),
        ...(formData.outro && { outro: formData.outro }),
      };

      const result = await retryHook.executeWithRetry(
        () => generatePodcast(noteId, options),
        context
      );
      
      if (result) {
        setShowForm(false);
        toast.success("Podcast generation started! You'll be notified when it's ready.");
      }
    } catch (error) {
      // Error is already classified and displayed by the retry hook
      console.error("Error generating podcast:", error);
      
      // Display user-friendly error with recovery options
      const errorInfo = displayPodcastError(error, context, {
        showToast: true,
        onRetry: retryHook.canRetry() ? () => handleGeneratePodcast(formData) : undefined
      });
    }
  };

  // Handle podcast regeneration with enhanced error handling
  const handleRegeneratePodcast = async () => {
    if (!latestPodcast) return;
    
    const context = { 
      operation: 'regenerate' as const, 
      podcastId: latestPodcast.id,
      noteId, 
      timestamp: new Date() 
    };
    
    try {
      // Create voice settings object for regeneration
      const voiceSettings: any = {
        hostVoiceId: latestPodcast.hostVoiceId,
      };
      
      // Add guest voice only if it exists
      if (latestPodcast.guestVoiceId) {
        voiceSettings.guestVoiceId = latestPodcast.guestVoiceId;
      }

      // Use the same settings from the latest podcast
      const options = {
        mode: latestPodcast.mode,
        voiceSettings,
        qualityPreset: latestPodcast.qualityPreset,
        durationScale: latestPodcast.durationScale,
        ...(latestPodcast.language && { language: latestPodcast.language }),
        ...(latestPodcast.intro && { intro: latestPodcast.intro }),
        ...(latestPodcast.outro && { outro: latestPodcast.outro }),
      };

      const result = await retryHook.executeWithRetry(
        () => regeneratePodcast(latestPodcast.id, options),
        context
      );
      
      if (result) {
        toast.success("Podcast regeneration started! You'll be notified when it's ready.");
      }
    } catch (error) {
      console.error("Error regenerating podcast:", error);
      
      // Display user-friendly error with recovery options
      displayPodcastError(error, context, {
        showToast: true,
        onRetry: retryHook.canRetry() ? handleRegeneratePodcast : undefined
      });
    }
  };

  // Handle podcast deletion
  const handleDeletePodcast = async () => {
    if (!latestPodcast) return;

    try {
      const success = await deletePodcast(latestPodcast.id);
      if (success) {
        toast.success("Podcast deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting podcast:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete podcast";
      toast.error(errorMessage);
    }
  };

  // Handle audio download
  const handleDownloadAudio = () => {
    if (!latestPodcast?.audioUrl) {
      toast.error("Audio file not available");
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = latestPodcast.audioUrl;
      link.download = `${noteTitle || 'podcast'}-${latestPodcast.id}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started");
    } catch (error) {
      console.error("Error downloading audio:", error);
      toast.error("Failed to download audio");
    }
  };

  // Handle view transcript
  const handleViewTranscript = () => {
    // This will be implemented when the transcript viewer component is created
    toast.info("Transcript viewer coming soon");
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await refreshPodcasts();
      // Refresh history as well
      const history = await getPodcastHistory(noteId, false);
      setPodcastHistory(history);
      toast.success("Podcasts refreshed");
    } catch (error) {
      console.error("Error refreshing podcasts:", error);
      toast.error("Failed to refresh podcasts");
    }
  };

  // Handle playing a specific podcast from history
  const handlePlayPodcast = (podcast: any) => {
    // This will set the current podcast and show the player
    // We'll need to manually trigger a state update by getting the podcast
    getPodcast(podcast.id).then(() => {
      setShowHistory(false);
    });
  };

  // Handle downloading a specific podcast from history
  const handleDownloadPodcastFromHistory = (podcast: any) => {
    if (!podcast.audioUrl) {
      toast.error("Audio file not available");
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = podcast.audioUrl;
      link.download = `${noteTitle || 'podcast'}-${podcast.id}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started");
    } catch (error) {
      console.error("Error downloading audio:", error);
      toast.error("Failed to download audio");
    }
  };

  // Handle deleting a specific podcast from history
  const handleDeletePodcastFromHistory = async (podcast: any) => {
    try {
      const success = await deletePodcast(podcast.id);
      if (success) {
        // Refresh history
        const history = await getPodcastHistory(noteId, false);
        setPodcastHistory(history);
        toast.success("Podcast deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting podcast:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete podcast";
      toast.error(errorMessage);
    }
  };

  // Handle regenerating a specific podcast from history
  const handleRegeneratePodcastFromHistory = async (podcast: any) => {
    // Create voice settings object for regeneration from history
    const voiceSettings: any = {
      hostVoiceId: podcast.hostVoiceId,
    };
    
    // Add guest voice only if it exists
    if (podcast.guestVoiceId) {
      voiceSettings.guestVoiceId = podcast.guestVoiceId;
    }

    const options = {
      mode: podcast.mode,
      voiceSettings,
      qualityPreset: podcast.qualityPreset,
      durationScale: podcast.durationScale,
      ...(podcast.language && { language: podcast.language }),
      ...(podcast.intro && { intro: podcast.intro }),
      ...(podcast.outro && { outro: podcast.outro }),
    };

    try {
      const result = await regeneratePodcast(podcast.id, options);
      if (result) {
        // Refresh history
        const history = await getPodcastHistory(noteId, false);
        setPodcastHistory(history);
        setShowHistory(false);
        toast.success("Podcast regeneration started! You'll be notified when it's ready.");
      }
    } catch (error) {
      console.error("Error regenerating podcast:", error);
      toast.error("Failed to regenerate podcast");
    }
  };

  // Show loading state while checking for existing podcasts
  if (initialLoading) {
    return (
      <PodcastSkeleton 
        variant="generator" 
        className="min-h-[calc(100vh-64px)]" 
      />
    );
  }

  // Show form if user clicked generate or regenerate
  if (showForm) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Generate Podcast</h2>
          <Button
            variant="outline"
            onClick={() => setShowForm(false)}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
        
        {loading ? (
          <PodcastSkeleton variant="form" />
        ) : (
          <PodcastForm
            onSubmit={handleGeneratePodcast}
            isLoading={loading}
            disabled={loading}
          />
        )}
      </div>
    );
  }

  // Show history if user clicked history and there are multiple podcasts
  if (showHistory && podcastHistory) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Podcast History</h2>
          <Button
            variant="outline"
            onClick={() => setShowHistory(false)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        
        <PodcastHistory
          history={podcastHistory}
          onPlayPodcast={handlePlayPodcast}
          onDownloadPodcast={handleDownloadPodcastFromHistory}
          onDeletePodcast={handleDeletePodcastFromHistory}
          onRegeneratePodcast={handleRegeneratePodcastFromHistory}
        />
      </div>
    );
  }

  // If we have a completed podcast, show the main layout interface
  if (latestPodcast && latestPodcast.status === 'COMPLETED' && latestPodcast.audioUrl) {
    return (
      <div className="p-6">
        {/* Header with history button if multiple podcasts exist */}
        {hasMultiplePodcasts() && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Latest Podcast</h2>
              {podcastHistory && (
                <span className="text-sm text-muted-foreground">
                  ({podcastHistory.completed.length} completed, {podcastHistory.failed.length} failed)
                </span>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              View History
            </Button>
          </div>
        )}
        
        <PodcastLayout
          podcast={latestPodcast}
          noteTitle={noteTitle}
          noteContent={noteContent}
          onRegenerateClick={handleRegeneratePodcast}
          onDownloadClick={handleDownloadAudio}
          onDeleteClick={handleDeletePodcast}
        />
      </div>
    );
  }

  // If we have a podcast that's still generating, show progress
  if (latestPodcast && (latestPodcast.status === 'GENERATING' || latestPodcast.status === 'IN_PROGRESS')) {
    return (
      <div className="space-y-6">
        <PodcastGenerationSkeleton
          progress={progress}
          message="Generating Podcast"
          submessage={`Creating ${latestPodcast.mode.toLowerCase()} mode podcast with AI voices...`}
        />
        
        {/* Refresh Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
        </div>
      </div>
    );
  }

  // If we have a failed podcast, show enhanced error state
  if (latestPodcast && latestPodcast.status === 'FAILED') {
    const errorMessage = latestPodcast.errorMessage || "The podcast generation failed. Please try again.";
    const context = { 
      operation: 'generate' as const, 
      podcastId: latestPodcast.id,
      noteId, 
      timestamp: new Date() 
    };

    return (
      <PodcastErrorBoundary
        context={context}
        onRetry={handleRegeneratePodcast}
        onRegenerate={() => setShowForm(true)}
        showRecoveryOptions={true}
      >
        <div className="h-[87vh] flex items-center justify-center bg-transparent dark:bg-[#0A0B0D] px-6">
          <PodcastGenerationError
            error={errorMessage}
            onRetry={async () => {
              await handleRegeneratePodcast();
            }}
            onRegenerate={() => setShowForm(true)}
            onChangeSettings={() => setShowForm(true)}
            isRetrying={retryHook.isRetrying}
            retryCount={retryHook.retryCount}
            progress={progress || 0}
          />
        </div>
      </PodcastErrorBoundary>
    );
  }

  // Show generation UI (no existing podcasts)
  return (
    <div className="h-[87vh] flex items-center justify-center bg-transparent dark:bg-[#0A0B0D] px-6">
      <div 
        className="neomorphic rounded-3xl p-12 bg-background border-0 max-w-2xl w-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" 
        role="region" 
        aria-label="Podcast generation interface"
        tabIndex={0}
      >
        <div className="flex flex-col items-center gap-8">
          {/* Neomorphic Icon */}
          <div className="neomorphic-icon w-20 h-20 rounded-2xl flex items-center justify-center">
            <Mic className="h-10 w-10 text-primary" />
          </div>

          {/* Content */}
          <div className="text-center space-y-3">
            <h3 className="text-2xl font-semibold text-foreground">Generate Podcast</h3>
            <p className="text-muted-foreground leading-relaxed max-w-md">
              Transform your notes into an engaging AI-generated podcast. Choose between conversation mode with multiple voices or bulletin mode with a single narrator.
            </p>
          </div>

          {/* Enhanced Error Display */}
          {hasError && error && (
            <PodcastErrorDisplay
              error={error}
              context={{ operation: 'generate', noteId, timestamp: new Date() }}
              onRetry={retryHook.canRetry() ? () => fetchExistingPodcasts() : undefined}
              isRetrying={retryHook.isRetrying}
              retryCount={retryHook.retryCount}
              variant="compact"
              className="w-full max-w-md"
            />
          )}

          {/* Action Buttons */}
          <div className="space-y-4 w-full">
            <Button
              onClick={() => setShowForm(true)}
              disabled={loading || generating}
              className="neomorphic border-0 bg-background hover:bg-background text-foreground shadow-none px-8 py-6 h-auto rounded-xl transition-all duration-300 w-full focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={loading || generating ? "Generating podcast, please wait" : "Start podcast generation"}
            >
              <div className="neomorphic-icon w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                <Mic className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium text-lg">
                {loading || generating ? "Generating..." : "Generate Podcast"}
              </span>
            </Button>

            {/* Show history button if there are existing podcasts */}
            {hasMultiplePodcasts() && podcastHistory && (
              <Button
                onClick={() => setShowHistory(true)}
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                View History ({podcastHistory.podcasts.length} podcasts)
              </Button>
            )}
          </div>

          {/* Loading State */}
          {(loading || generating) && (
            <div className="w-full">
              <LoadingState
                message="Preparing Generation"
                submessage="Setting up podcast generation with AI voices..."
                variant="ai"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Wrap the component with error boundary
export function PodcastGenerator(props: PodcastGeneratorProps) {
  const context = { 
    operation: 'generate' as const, 
    noteId: props.noteId, 
    timestamp: new Date() 
  };

  return (
    <PodcastErrorBoundary
      context={context}
      onRetry={() => window.location.reload()}
      onRegenerate={() => {
        // Reset any cached state and show form
        window.location.reload();
      }}
      onGoHome={() => {
        window.location.href = '/dashboard';
      }}
      showRecoveryOptions={true}
    >
      <PodcastGeneratorInner {...props} />
    </PodcastErrorBoundary>
  );
}