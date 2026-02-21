"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useNoteContext } from "@/contexts/note-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Copy01Icon,
  Download01Icon,
  Search01Icon,
  Alert01Icon,
  Loading01Icon,
  File01Icon,
} from "@hugeicons/core-free-icons";

export default function TranscriptPage() {
  const { note } = useNoteContext();
  const [transcript, setTranscript] = useState<string | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleCopy = () => {
    if (transcript) {
      navigator.clipboard.writeText(transcript);
      toast.success("Copied to clipboard", { position: "top-center" });
    }
  };

  const handleDownload = () => {
    if (transcript) {
      const blob = new Blob([transcript], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${note?.title || "transcript"}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Transcript downloaded", { position: "top-center" });
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery) {
      if (typeof (window as any).find === "function") {
        (window as any).find(searchQuery);
      } else {
        const element = document.querySelector(`[data-transcript-content]`);
        if (element && element.textContent) {
          const text = element.textContent.toLowerCase();
          const index = text.indexOf(searchQuery.toLowerCase());
          if (index !== -1) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }
    }
  };

  const documentTitle =
    note?.transcript?.originalName || note?.title || "Document Transcript";

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header — aligned with view-note */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-sidebar/95 backdrop-blur supports-backdrop-filter:bg-sidebar/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <Link
              href={note?.id ? `/notes/${note.id}` : "/notes"}
              className="flex items-center gap-2 shrink-0 font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
              <span>Back to note</span>
            </Link>

            <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!transcript}
                className="h-9 rounded-lg border-border text-muted-foreground hover:text-foreground gap-1.5"
              >
                <HugeiconsIcon icon={Copy01Icon} className="size-4" />
                <span className="hidden sm:inline">Copy</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!transcript}
                className="h-9 rounded-lg border-border text-muted-foreground hover:text-foreground gap-1.5"
              >
                <HugeiconsIcon icon={Download01Icon} className="size-4" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 text-foreground">
            <HugeiconsIcon
              icon={File01Icon}
              className="size-5 text-muted-foreground shrink-0"
            />
            <h1 className="text-lg font-semibold truncate">{documentTitle}</h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Section header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground tracking-tight">
            Transcript
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Full text extracted from your document for reference and search.
          </p>
        </div>

        <Card className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {transcriptLoading && (
              <div className="flex flex-col items-center justify-center py-20 px-6">
                <HugeiconsIcon
                  icon={Loading01Icon}
                  className="size-10 text-primary animate-spin mb-4"
                />
                <p className="text-sm text-muted-foreground">
                  Loading transcript…
                </p>
              </div>
            )}

            {transcriptError && (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="rounded-full bg-destructive/10 p-4 mb-4">
                  <HugeiconsIcon
                    icon={Alert01Icon}
                    className="size-8 text-destructive"
                  />
                </div>
                <p className="font-medium text-foreground mb-1">
                  Error loading transcript
                </p>
                <p className="text-sm text-muted-foreground">
                  {transcriptError}
                </p>
              </div>
            )}

            {transcript && !transcriptLoading && (
              <>
                {/* Search bar */}
                <div className="p-4 sm:p-5 border-b border-border bg-muted/20">
                  <div className="relative">
                    <HugeiconsIcon
                      icon={Search01Icon}
                      className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
                    />
                    <Input
                      type="text"
                      placeholder="Search in transcript…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      className="pl-9 h-10 rounded-lg border-border bg-background/50 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                {/* About this transcript */}
                <div className="px-4 sm:px-5 py-4 border-b border-border">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                    About this transcript
                  </h3>
                  <p className="text-sm font-medium text-foreground">
                    {note?.title || "Untitled Note"}
                  </p>
                  {note?.transcript && (
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <li>Original file: {note.transcript.originalName}</li>
                      <li>
                        Created:{" "}
                        {new Date(note.transcript.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </li>
                    </ul>
                  )}
                </div>

                {/* Transcript body */}
                <div className="px-4 sm:px-5 py-5 sm:py-6">
                  <div
                    data-transcript-content
                    className="text-[15px] leading-[1.75] text-foreground space-y-4 font-sans"
                  >
                    {transcript
                      .split("\n\n")
                      .filter((p) => p.trim())
                      .map((paragraph, index) => (
                        <p key={index} className="text-pretty">
                          {paragraph}
                        </p>
                      ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
