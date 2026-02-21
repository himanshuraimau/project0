"use client";

import React, { useState, useEffect } from "react";
import { PodcastHeader } from "./PodcastHeader";
import { PodcastTabs } from "./PodcastTabs";
import { PodcastSectionsList } from "./PodcastSectionsList";
import { PodcastPlayer } from "./PodcastPlayer";
import { PodcastTranscript } from "./PodcastTranscript";
import { PodcastPageProps, PodcastData, PodcastSection } from "./types";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { usePodcastGeneration } from "@/hooks/usePodcastGeneration";
import { toast } from "sonner";

export function PodcastPage({
  noteId,
  noteTitle = "Untitled Note",
  noteContent,
}: PodcastPageProps) {
  const [activeTab, setActiveTab] = useState<"sections" | "transcript">(
    "sections"
  );
  const [podcast, setPodcast] = useState<PodcastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [localGenerating, setLocalGenerating] = useState(false);

  const { job, isGenerating, generate, reset } = usePodcastGeneration();

  // Fetch existing podcast data
  useEffect(() => {
    const fetchPodcast = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/podcast/note/${noteId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch podcast");
        }

        const data = await response.json();

        if (data.success && data.podcasts && data.podcasts.length > 0) {
          // Get the most recent completed podcast
          const completedPodcast = data.podcasts.find(
            (p: any) => p.status === "COMPLETED" && p.audioUrl
          );

          if (completedPodcast) {
            const parsedTranscript = typeof completedPodcast.transcript === 'string'
              ? JSON.parse(completedPodcast.transcript)
              : completedPodcast.transcript;

            setPodcast({
              id: completedPodcast.id,
              noteId: completedPodcast.noteId,
              title: completedPodcast.title || noteTitle,
              description: completedPodcast.description,
              audioUrl: completedPodcast.audioUrl,
              duration: completedPodcast.duration || 0,
              transcript: parsedTranscript,
              sections: parseSections(parsedTranscript),
              status: completedPodcast.status,
              createdAt: new Date(completedPodcast.createdAt),
            });
          }
        }
      } catch (err: any) {
        console.error("Error fetching podcast:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPodcast();
  }, [noteId, noteTitle]);

  // Update podcast when generation completes
  useEffect(() => {
    if (job?.status === "completed" && job.audioUrl) {
      setPodcast({
        id: job.jobId || "",
        noteId,
        title: noteTitle,
        audioUrl: job.audioUrl,
        duration: job.audioDuration || 0,
        transcript: job.transcript,
        sections: parseSections(job.transcript),
        status: "COMPLETED",
        createdAt: new Date(),
      });
    }
  }, [job, noteId, noteTitle]);

  const parseSections = (transcript: any): PodcastSection[] => {
    if (!transcript || !Array.isArray(transcript)) return [];

    // Group transcript into sections (simple implementation)
    // You can enhance this based on your actual data structure
    const sections: PodcastSection[] = [];
    let currentSection: PodcastSection = {
      title: '',
      timestamp: '0:00',
      description: '',
    };
    let sectionTexts: string[] = [];

    transcript.forEach((item: any, index: number) => {
      const text = item.text || '';

      // Start a new section every 3-4 exchanges or on topic change
      if (index % 6 === 0 || index === 0) {
        if (currentSection.title && sectionTexts.length > 0) {
          currentSection.description = sectionTexts.join(' ').slice(0, 150) + '...';
          sections.push(currentSection);
          sectionTexts = [];
        }

        currentSection = {
          title: extractSectionTitle(text, sections.length),
          timestamp: formatTimestamp(index * 10), // Approximate timestamp
          description: '',
        };
      }

      sectionTexts.push(text);
    });

    // Add the last section
    if (currentSection.title && sectionTexts.length > 0) {
      currentSection.description = sectionTexts.join(' ').slice(0, 150) + '...';
      sections.push(currentSection);
    }

    return sections;
  };

  const extractSectionTitle = (text: string, index: number): string => {
    // Extract first sentence or meaningful phrase
    const sentences = text.split(/[.!?]/);
    if (sentences.length > 0 && sentences[0].length > 0) {
      return sentences[0].slice(0, 60) + (sentences[0].length > 60 ? '...' : '');
    }
    return `Section ${index + 1}`;
  };

  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGenerate = async () => {
    if (!noteContent) {
      setError("Note content is empty. Cannot generate audio.");
      return;
    }

    try {
      setError(null);
      setLocalGenerating(true);
      await generate(noteId, noteContent);
    } catch (err: any) {
      setError(err.message || "Failed to generate audio");
      setLocalGenerating(false);
    }
  };

  const handleAskQuestion = async (question: string) => {
    // Implement AI question handling
    console.log("Question asked:", question);
    // You can integrate this with your chat/AI system
  };

  const handleDownload = async () => {
    if (!podcast?.audioUrl) {
      toast.error("No audio URL available for download", {
        position: "top-center",
      });
      return;
    }

    try {
      // Try to download directly using the URL (for same-origin or CORS-enabled resources)
      const a = document.createElement("a");
      a.href = podcast.audioUrl;
      a.download = `${noteTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_podcast.mp3`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error(
        "Failed to download podcast. The audio file may not be accessible.",
        {
          position: "top-center",
        }
      );
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading podcast...</p>
        </div>
      </div>
    );
  }

  // No podcast exists yet - show generation UI
  if (!podcast && !isGenerating && !job) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="rounded-xl border border-border bg-card shadow-sm px-6 py-8 text-center space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Podcast
          </p>
          <h2 className="text-xl font-semibold text-foreground">
            Generate audio narration
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Transform this note into a polished audio episode you can listen to
            on the go.
          </p>

          {error && (
            <div className="mx-auto mt-2 inline-flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {!noteContent || noteContent.trim().length === 0 ? (
            <p className="text-sm text-destructive mt-2">
              Note content is empty. Please add content to your note first.
            </p>
          ) : (
            <div className="flex justify-center mt-4">
              <Button
                onClick={handleGenerate}
                size="sm"
                className="h-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-5 text-sm font-medium"
              >
                Generate podcast
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Generating state
  if ((isGenerating || localGenerating) && (job || localGenerating)) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="rounded-xl border border-border bg-card shadow-sm px-6 py-8 text-center space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Generating your podcast…
          </h2>
          <p className="text-sm text-muted-foreground">
            This usually takes 10–30 seconds. You can keep working while we
            prepare the audio.
          </p>

          <div className="mt-4 space-y-2 max-w-md mx-auto">
            <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${job?.progress || 10}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {job?.progress || 10}% ·{" "}
              {job?.currentStep || "Starting generation…"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Failed state
  if (job?.status === "failed") {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-6 py-8 text-center space-y-4">
          <h2 className="text-xl font-semibold text-destructive">
            Podcast generation failed
          </h2>
          <p className="text-sm text-destructive">
            {job.error || "An unknown error occurred"}
          </p>
          <Button
            onClick={() => {
              reset();
              handleGenerate();
            }}
            size="sm"
            className="h-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-5 text-sm font-medium"
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  // Main podcast view
  if (!podcast) return null;

  return (
    <div className="w-full min-h-screen bg-background">
      <PodcastHeader
        title={podcast.title}
        noteId={noteId}
        onDownload={handleDownload}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Tabs and Sections/Transcript */}
          <div className="lg:col-span-1 space-y-4 lg:pr-6 lg:border-r border-border/40">
            <PodcastTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {activeTab === "sections" ? (
              <PodcastSectionsList
                transcript={podcast.transcript || []}
                currentTime={currentTime}
                onSectionClick={(time) => console.log("Jump to:", time)}
              />
            ) : (
              <PodcastTranscript
                transcript={podcast.transcript || []}
                title={podcast.title}
                currentTime={currentTime}
              />
            )}
          </div>

          {/* Right Column - Player */}
          <div className="lg:col-span-1 flex justify-center items-start py-4">
            <div className="w-full max-w-xl px-0 sm:px-2">
              <PodcastPlayer
                audioUrl={podcast.audioUrl}
                title={podcast.title}
                duration={podcast.duration}
                speakers={podcast.speakers}
                coverImage={podcast.coverImage}
                onAskQuestion={handleAskQuestion}
                onDownload={handleDownload}
                onTimeUpdate={setCurrentTime}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
