/**
 * Podcast Action Components
 * Implements regenerate, download, and view transcript action buttons
 * Requirements: 4.2, 4.3, 4.4
 */

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RefreshCw, Download, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Podcast, PodcastGenerationOptions } from "@/lib/types/podcast";

interface PodcastActionsProps {
  podcast: Podcast;
  onRegenerate?: (options: PodcastGenerationOptions) => Promise<void>;
  onDelete?: () => Promise<void>;
  disabled?: boolean;
  showDelete?: boolean;
}

export function PodcastActions({
  podcast,
  onRegenerate,
  onDelete,
  disabled = false,
  showDelete = true,
}: PodcastActionsProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  // Handle podcast regeneration
  const handleRegenerate = async () => {
    if (!onRegenerate || isRegenerating) return;

    setIsRegenerating(true);
    try {
      // Use the same options as the original podcast
      const options: PodcastGenerationOptions = {
        mode: podcast.mode,
        voiceSettings: {
          hostVoiceId: podcast.hostVoiceId,
          guestVoiceId: podcast.guestVoiceId || undefined,
        },
        qualityPreset: podcast.qualityPreset,
        durationScale: podcast.durationScale,
        language: podcast.language || undefined,
        intro: podcast.intro || undefined,
        outro: podcast.outro || undefined,
      };

      await onRegenerate(options);
      toast.success("Podcast regeneration started", {
        description: "Your new podcast is being generated. This may take a few minutes.",
        duration: 4000,
      });
    } catch (error) {
      console.error("Error regenerating podcast:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to regenerate podcast";
      toast.error("Regeneration failed", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  // Handle podcast deletion
  const handleDelete = async () => {
    if (!onDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      await onDelete();
      toast.success("Podcast deleted", {
        description: "The podcast and its audio file have been removed.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error deleting podcast:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete podcast";
      toast.error("Deletion failed", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle audio download
  const handleDownload = () => {
    if (!podcast.audioUrl) {
      toast.error("Download unavailable", {
        description: "Audio file is not available for download.",
        duration: 3000,
      });
      return;
    }

    try {
      // Create a temporary link to trigger download
      const link = document.createElement("a");
      link.href = podcast.audioUrl;
      link.download = `${podcast.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.mp3`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Download started", {
        description: "Your podcast audio file is being downloaded.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error downloading podcast:", error);
      toast.error("Download failed", {
        description: "Failed to download the audio file. Please try again.",
        duration: 4000,
      });
    }
  };

  // Get transcript content for display
  const getTranscriptContent = () => {
    if (podcast.note?.content) {
      return podcast.note.content;
    }
    return "Transcript content is not available.";
  };

  // Format duration for display
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "Unknown duration";
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  // Check if podcast is completed and has audio
  const isCompleted = podcast.status === "COMPLETED";
  const hasAudio = isCompleted && podcast.audioUrl;

  return (
    <div className="flex flex-wrap gap-2">
      {/* Regenerate Button */}
      <Button
        onClick={handleRegenerate}
        disabled={disabled || isRegenerating}
        variant="outline"
        size="sm"
        className="border-accent/30 text-accent hover:bg-accent/10 hover:border-accent flex items-center px-3 py-2 transition-all duration-200"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? "animate-spin" : ""}`} />
        {isRegenerating ? "Regenerating..." : "Regenerate"}
      </Button>

      {/* Download Button */}
      <Button
        onClick={handleDownload}
        disabled={disabled || !hasAudio}
        variant="outline"
        size="sm"
        className="flex items-center px-3 py-2 transition-all duration-200"
        title={hasAudio ? "Download audio file" : "Audio not available"}
      >
        <Download className="h-4 w-4 mr-2" />
        Download
      </Button>

      {/* View Transcript Button */}
      <Dialog open={showTranscript} onOpenChange={setShowTranscript}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center px-3 py-2 transition-all duration-200"
          >
            <FileText className="h-4 w-4 mr-2" />
            View Transcript
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Podcast Transcript</DialogTitle>
            <DialogDescription>
              Source content used to generate the podcast
              {podcast.duration && (
                <span className="ml-2 text-sm text-muted-foreground">
                  • Duration: {formatDuration(podcast.duration)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/30 p-4 rounded-lg">
                {getTranscriptContent()}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Button with Confirmation */}
      {showDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={disabled || isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center px-3 py-2 transition-all duration-200"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Podcast</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this podcast? This will permanently remove
                the audio file and cannot be undone.
                {podcast.title && (
                  <span className="block mt-2 font-medium text-foreground">
                    "{podcast.title}"
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? "Deleting..." : "Delete Podcast"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

// Individual action components for more granular usage
export function RegenerateButton({
  podcast,
  onRegenerate,
  disabled = false,
}: {
  podcast: Podcast;
  onRegenerate: (options: PodcastGenerationOptions) => Promise<void>;
  disabled?: boolean;
}) {
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    if (isRegenerating) return;

    setIsRegenerating(true);
    try {
      const options: PodcastGenerationOptions = {
        mode: podcast.mode,
        voiceSettings: {
          hostVoiceId: podcast.hostVoiceId,
          guestVoiceId: podcast.guestVoiceId || undefined,
        },
        qualityPreset: podcast.qualityPreset,
        durationScale: podcast.durationScale,
        language: podcast.language || undefined,
        intro: podcast.intro || undefined,
        outro: podcast.outro || undefined,
      };

      await onRegenerate(options);
      toast.success("Podcast regeneration started");
    } catch (error) {
      console.error("Error regenerating podcast:", error);
      toast.error("Failed to regenerate podcast");
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Button
      onClick={handleRegenerate}
      disabled={disabled || isRegenerating}
      variant="outline"
      size="sm"
      className="border-accent/30 text-accent hover:bg-accent/10 hover:border-accent"
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? "animate-spin" : ""}`} />
      {isRegenerating ? "Regenerating..." : "Regenerate"}
    </Button>
  );
}

export function DownloadButton({
  podcast,
  disabled = false,
}: {
  podcast: Podcast;
  disabled?: boolean;
}) {
  const handleDownload = () => {
    if (!podcast.audioUrl) {
      toast.error("Audio file is not available for download");
      return;
    }

    try {
      const link = document.createElement("a");
      link.href = podcast.audioUrl;
      link.download = `${podcast.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.mp3`;
      link.target = "_blank";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Download started");
    } catch (error) {
      console.error("Error downloading podcast:", error);
      toast.error("Failed to download audio file");
    }
  };

  const isCompleted = podcast.status === "COMPLETED";
  const hasAudio = isCompleted && podcast.audioUrl;

  return (
    <Button
      onClick={handleDownload}
      disabled={disabled || !hasAudio}
      variant="outline"
      size="sm"
      title={hasAudio ? "Download audio file" : "Audio not available"}
    >
      <Download className="h-4 w-4 mr-2" />
      Download
    </Button>
  );
}

export function ViewTranscriptButton({
  podcast,
  disabled = false,
}: {
  podcast: Podcast;
  disabled?: boolean;
}) {
  const [showTranscript, setShowTranscript] = useState(false);

  const getTranscriptContent = () => {
    if (podcast.note?.content) {
      return podcast.note.content;
    }
    return "Transcript content is not available.";
  };

  return (
    <Dialog open={showTranscript} onOpenChange={setShowTranscript}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
        >
          <FileText className="h-4 w-4 mr-2" />
          View Transcript
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Podcast Transcript</DialogTitle>
          <DialogDescription>
            Source content used to generate the podcast
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/30 p-4 rounded-lg">
              {getTranscriptContent()}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DeletePodcastButton({
  podcast,
  onDelete,
  disabled = false,
}: {
  podcast: Podcast;
  onDelete: () => Promise<void>;
  disabled?: boolean;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      await onDelete();
      toast.success("Podcast deleted successfully");
    } catch (error) {
      console.error("Error deleting podcast:", error);
      toast.error("Failed to delete podcast");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isDeleting}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Podcast</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this podcast? This will permanently remove
            the audio file and cannot be undone.
            {podcast.title && (
              <span className="block mt-2 font-medium text-foreground">
                "{podcast.title}"
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? "Deleting..." : "Delete Podcast"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}