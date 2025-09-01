"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
const jakarta = Plus_Jakarta_Sans({
  weight: "200",
});
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Youtube,
  FileText,
  CheckCircle,
  BookOpen,
} from "lucide-react";
import { useNotes } from "@/hooks/use-notes";
import { Plus_Jakarta_Sans } from "next/font/google";

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
  const [videoUrl, setVideoUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [generatedNote, setGeneratedNote] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { generateNotesFromTranscript, loading: notesLoading } = useNotes();

  const validateYouTubeUrl = (url: string): boolean => {
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)/;
    return youtubeRegex.test(url);
  };

  const handleGenerateNotes = async (transcriptId: string) => {
    setIsGeneratingNotes(true);
    try {
      const note = await generateNotesFromTranscript(transcriptId);
      if (note) {
        setGeneratedNote(note);
        return note;
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
      <Card>
        <CardHeader>
          <CardTitle
            className={`flex items-center gap-2 text-green-600 ${jakarta.className}`}
          >
            <CheckCircle className="size-6" />
            Transcript Created Successfully
          </CardTitle>
          <CardDescription>
            Your YouTube video has been transcribed and saved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Transcript Info */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Transcript Details</h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <span className="font-medium">Title:</span>{" "}
                {result.originalName}
              </div>
              <div>
                <span className="font-medium">ID:</span> {result.id}
              </div>
              <div>
                <span className="font-medium">Content Length:</span>{" "}
                {result.content?.length || 0} characters
              </div>
              {result.metadata?.duration && (
                <div>
                  <span className="font-medium">Duration:</span>{" "}
                  {Math.round(result.metadata.duration / 60)} minutes
                </div>
              )}
            </div>
          </div>

          {/* Generated Notes Info */}
          {generatedNote && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Generated Notes
              </h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div>
                  <span className="font-medium">Note Title:</span>{" "}
                  {generatedNote.title}
                </div>
                <div>
                  <span className="font-medium">Note ID:</span>{" "}
                  {generatedNote.id}
                </div>
                <div>
                  <span className="font-medium">Content Length:</span>{" "}
                  {generatedNote.content?.length || 0} characters
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={handleReset}>
              Process Another Video
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Navigate to transcript view
                console.log("Navigate to transcript:", result.id);
              }}
            >
              View Transcript
            </Button>
            {onClose && (
              <Button variant="default" size="sm" onClick={onClose}>
                Done
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="h-5 w-5 text-red-500" />
          YouTube Transcript Generator
        </CardTitle>
        <CardDescription>
          Enter a YouTube URL to generate a transcript and create notes from the
          video content.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="youtube-url" className="text-sm font-medium">
            YouTube URL
          </label>
          <Input
            id="youtube-url"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={videoUrl}
            onChange={(e) => {
              setVideoUrl(e.target.value);
              if (error) setError(null);
            }}
            disabled={isProcessing}
          />
          <p className="text-xs text-muted-foreground">
            Supports youtube.com and youtu.be URLs
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleProcessTranscript}
            disabled={isProcessing || !videoUrl.trim()}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Transcript
              </>
            )}
          </Button>
        </div>

        {(isProcessing || isGeneratingNotes) && (
          <div className="p-4 rounded-md bg-muted">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                {isProcessing &&
                  !isGeneratingNotes &&
                  "Fetching transcript from YouTube..."}
                {isGeneratingNotes && "Generating AI notes from transcript..."}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isProcessing &&
                !isGeneratingNotes &&
                "This may take a few moments depending on video length."}
              {isGeneratingNotes &&
                "Creating structured notes and summaries from the video content."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
