"use client";

import React, { useState, useEffect } from "react";
import { useNoteContext } from "@/contexts/note-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function TranscriptPage() {
  const { note } = useNoteContext();
  const [transcript, setTranscript] = useState<string | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTranscript = async () => {
      if (!note?.transcriptId) return;

      setTranscriptLoading(true);
      setTranscriptError(null);

      try {
        const response = await fetch(`/api/transcripts/${note.transcriptId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch transcript");
        }

        const data = await response.json();
        if (data.success) {
          setTranscript(data.data.content);
        } else {
          throw new Error(data.error || "Failed to load transcript");
        }
      } catch (error) {
        console.error("Error fetching transcript:", error);
        setTranscriptError(
          error instanceof Error ? error.message : "Failed to load transcript"
        );
      } finally {
        setTranscriptLoading(false);
      }
    };

    fetchTranscript();
  }, [note?.transcriptId]);

  return (
    <div className="w-full bg-white dark:bg-[#0A0A0A] min-h-screen px-8 pt-6 pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Document Identity Bar */}
        <div
          className="mb-6 pb-6 border-b border-transparent"
          style={{
            boxShadow:
              "0 1px 0 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.02)",
          }}
        >
          {/* Title and Actions */}
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-[22px] font-semibold text-foreground leading-tight">
              {note?.transcript?.originalName || note?.title || "Document Transcript"}
            </h1>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (transcript) {
                    navigator.clipboard.writeText(transcript);
                    toast.success("Copied to clipboard");
                  }
                }}
                className="gap-2 rounded-none"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span className="hidden sm:inline">Copy</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (transcript) {
                    const blob = new Blob([transcript], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${note?.title || "transcript"}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }
                }}
                className="gap-2 rounded-none"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <span className="hidden sm:inline">Download</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const shareUrl = window.location.href;
                    if (navigator.share) {
                      await navigator.share({
                        title: `Transcript: ${note?.title}`,
                        text: "Check out this transcript",
                        url: shareUrl,
                      });
                    } else {
                      await navigator.clipboard.writeText(shareUrl);
                      toast.success("Link copied to clipboard");
                    }
                  } catch (error) {
                    console.error("Share error:", error);
                  }
                }}
                className="gap-2 rounded-none"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  toast.success("Added to favorites");
                }}
                className="text-yellow-500 hover:text-yellow-600 rounded-none"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Container */}
        <div className="max-w-[900px] mx-auto bg-white dark:bg-card border border-border rounded-xl shadow-sm p-8">
          {transcriptLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">
                  Loading transcript...
                </p>
              </div>
            </div>
          )}

          {transcriptError && (
            <div className="text-center py-20">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <p className="font-medium text-red-600 mb-2">
                Error loading transcript
              </p>
              <p className="text-sm text-muted-foreground">{transcriptError}</p>
            </div>
          )}

          {transcript && !transcriptLoading && (
            <>
              {/* Search Within Document */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search in transcript…"
                  className="w-full h-10 px-4 rounded-lg border border-input bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value) {
                      const searchTerm = e.currentTarget.value;
                      if (typeof (window as any).find === "function") {
                        (window as any).find(searchTerm);
                      } else {
                        // Fallback: scroll to first match
                        const element = document.querySelector(
                          `[data-transcript-content]`
                        );
                        if (element && element.textContent) {
                          const text = element.textContent.toLowerCase();
                          const index = text.indexOf(searchTerm.toLowerCase());
                          if (index !== -1) {
                            element.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                          }
                        }
                      }
                    }
                  }}
                />
              </div>

              {/* Document Metadata Section */}
              <div className="mb-6 pb-6 border-b border-border">
                <div className="text-[13px] text-muted-foreground mb-2">
                  Transcript for
                </div>
                <div className="text-[17px] font-medium text-foreground mb-3">
                  {note?.title || "Untitled Note"}
                </div>
                {note?.transcript && (
                  <div className="space-y-1 text-[13px] text-muted-foreground leading-relaxed">
                    <div>Original file: {note.transcript.originalName}</div>
                    <div>
                      Created:{" "}
                      {new Date(note.transcript.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Classification */}
              <div className="mb-8 text-center">
                <div className="inline-block px-4 py-1.5 rounded-full bg-muted text-[13px] text-muted-foreground uppercase tracking-wide">
                  Research Document
                </div>
              </div>

              {/* Main Transcript Body */}
              <div
                data-transcript-content
                className="text-[15px] leading-[1.7] text-foreground space-y-5"
              >
                {transcript
                  .split("\n\n")
                  .map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

