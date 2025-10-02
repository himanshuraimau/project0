"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
const jakarta = Plus_Jakarta_Sans({
  weight: "200",
  subsets: ["latin"],
});
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Youtube,
  FileText,
  CheckCircle,
  BookOpen,
} from "lucide-react";
import { useNotes } from "@/hooks/use-notes";
import { Plus_Jakarta_Sans } from "next/font/google";
import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";

interface YouTubeProcessorProps {
  onProcessComplete?: (result: {
    transcript: { id: string; content: string; originalName: string };
    note?: { id: string; title: string; content: string };
  }) => void;
  onClose?: () => void;
}

export function YouTubeProcessor({
  onProcessComplete,
  onClose,
}: YouTubeProcessorProps) {
  const { addLoadingNote, removeLoadingNote } = useDashboardRefresh();
  const [videoUrl, setVideoUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [result, setResult] = useState<{
    id: string;
    content: string;
    originalName: string;
    metadata?: { duration?: number };
  } | null>(null);
  const [generatedNote, setGeneratedNote] = useState<{
    id: string;
    title: string;
    content: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTempId, setCurrentTempId] = useState<string | null>(null);
  const { generateNotesFromTranscript } = useNotes();

  const validateYouTubeUrl = (url: string): boolean => {
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)/;
    return youtubeRegex.test(url);
  };

  const handleGenerateNotes = async (transcriptId: string) => {
    setIsGeneratingNotes(true);
    try {
      const note = await generateNotesFromTranscript(transcriptId);
      if (note && note.content) {
        setGeneratedNote({
          id: note.id,
          title: note.title,
          content: note.content,
        });
        return {
          id: note.id,
          title: note.title,
          content: note.content,
        };
      }
      return null;
    } catch (error) {
      console.error("Error generating notes:", error);
      // Don't set error here as it's not critical - transcript was successful
      return null;
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const handleProcessTranscript = async () => {
    if (!videoUrl.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }

    if (!validateYouTubeUrl(videoUrl)) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    setIsProcessing(true);
    setError(null);

    // Add loading note immediately when processing starts
    const tempId = `youtube-${Date.now()}`;
    setCurrentTempId(tempId);
    addLoadingNote(tempId, "youtube");

    // Close modal immediately after starting
    if (onClose) {
      onClose();
    }

    try {
      const response = await fetch("/api/transcripts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: videoUrl.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Remove loading note on error
        if (currentTempId) {
          removeLoadingNote(currentTempId);
          setCurrentTempId(null);
        }

        // Handle specific error cases with better user feedback
        if (response.status === 400) {
          if (
            data.error === "Video URL is required" ||
            data.message === "Video URL is required"
          ) {
            throw new Error("Please enter a valid YouTube URL");
          }
          if (
            data.error === "Invalid YouTube URL format" ||
            data.message === "Invalid YouTube URL format"
          ) {
            throw new Error(
              "Please enter a valid YouTube URL (youtube.com or youtu.be)"
            );
          }
        }

        if (response.status === 401) {
          throw new Error("Please sign in to process YouTube videos");
        }

        if (response.status >= 500) {
          throw new Error("Server error. Please try again later.");
        }

        // Generic error fallback
        throw new Error(
          data.error || data.message || "Failed to process transcript"
        );
      }

      if (data.success && data.data) {
        setResult(data.data);

        // Remove loading note using the temp ID BEFORE processing further
        if (currentTempId) {
          removeLoadingNote(currentTempId);
          setCurrentTempId(null);
        }

        // Automatically generate notes from the transcript
        const note = await handleGenerateNotes(data.data.id);

        // Call the completion callback if provided
        if (onProcessComplete) {
          onProcessComplete({
            transcript: {
              id: data.data.id,
              content: data.data.content,
              originalName: data.data.originalName,
            },
            note:
              note && note.content
                ? {
                    id: note.id,
                    title: note.title,
                    content: note.content,
                  }
                : undefined,
          });
        }
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error processing YouTube transcript:", error);
      
      // Remove loading note on error
      if (currentTempId) {
        removeLoadingNote(currentTempId);
        setCurrentTempId(null);
      }
      
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setVideoUrl("");
    setResult(null);
    setError(null);
  };

  if (result) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mx-auto flex items-center justify-center shadow-lg">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>

          <div className="space-y-2">
            <h3 className={`text-2xl font-bold text-green-600 dark:text-green-400 ${jakarta.className}`}>
              Transcript Created Successfully
            </h3>
            <p className="text-muted-foreground/90 text-lg">
              Your YouTube video has been transcribed and saved.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {/* Transcript Info */}
          <div className="rounded-xl bg-muted/30 border border-border/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-5 w-5 text-purple-600" />
              <h4 className="font-bold text-foreground">Transcript Details</h4>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Title:</span>
                <span className="text-foreground font-medium">{result.originalName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Content Length:</span>
                <span className="text-foreground font-medium">{result.content?.length || 0} characters</span>
              </div>
              {result.metadata?.duration && (
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Duration:</span>
                  <span className="text-foreground font-medium">{Math.round(result.metadata.duration / 60)} minutes</span>
                </div>
              )}
            </div>
          </div>

          {/* Generated Notes Info */}
          {generatedNote && (
            <div className="rounded-xl bg-gradient-to-br from-purple-50/50 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/10 border border-purple-200/50 dark:border-purple-800/30 p-6">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="h-5 w-5 text-purple-600" />
                <h4 className="font-bold text-foreground">Generated Notes</h4>
              </div>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Note Title:</span>
                  <span className="text-foreground font-medium">{generatedNote.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Content Length:</span>
                  <span className="text-foreground font-medium">{generatedNote.content?.length || 0} characters</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center pt-4">
          <Button 
            onClick={handleReset}
            variant="outline" 
            className="rounded-xl px-6"
          >
            Process Another Video
          </Button>
          {onClose && (
            <Button 
              onClick={onClose}
              className="rounded-xl px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Done
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-dashed border-accent/30 bg-accent/5 p-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-accent flex items-center justify-center shadow-lg">
            <Youtube className="h-8 w-8 text-accent-foreground" />
          </div>
          
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-foreground">YouTube Transcript Generator</h3>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              Enter a YouTube URL to generate a transcript and create notes from the video content.
            </p>
          </div>

          <div className="space-y-4 max-w-lg mx-auto">
            <div className="text-left">
              <label htmlFor="youtube-url" className="block text-sm font-semibold text-foreground mb-3">
                YouTube URL
              </label>
              <Input
                id="youtube-url"
                className="h-12 rounded-xl border-2 border-border/20 bg-background text-foreground placeholder:text-muted-foreground focus:border-accent/50 transition-colors"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isProcessing}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Supports youtube.com and youtu.be URLs
              </p>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 p-4">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
            )}

            <Button
              onClick={handleProcessTranscript}
              disabled={isProcessing || !videoUrl.trim()}
              className="w-full h-12 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-5 w-5" />
                  Generate Transcript
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {(isProcessing || isGeneratingNotes) && (
        <div className="rounded-2xl bg-muted/50 border border-border/20 p-6">
          <div className="flex items-center gap-3 text-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
            <div>
              <p className="font-semibold">
                {isProcessing && !isGeneratingNotes && "Fetching transcript from YouTube..."}
                {isGeneratingNotes && "Generating AI notes from transcript..."}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {isProcessing && !isGeneratingNotes && "This may take a few moments depending on video length."}
                {isGeneratingNotes && "Creating structured notes and summaries from the video content."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
