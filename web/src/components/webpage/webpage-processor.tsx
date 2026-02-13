"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle2,
  Globe,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";
import { useUpgradeModal } from "@/contexts/upgrade-modal-context";

interface WebpageProcessorProps {
  onProcessComplete?: (result: {
    transcript: {
      id: string;
      title: string;
      content: string;
      url: string;
      originalName: string;
    };
    note?: {
      id: string;
      title: string;
      content: string;
    };
  }) => void;
  onClose?: () => void;
}

export function WebpageProcessor({
  onProcessComplete,
  onClose,
}: WebpageProcessorProps) {
  const { addLoadingNote, updateLoadingNote, removeLoadingNote } = useDashboardRefresh();
  const { openUpgradeModal } = useUpgradeModal();
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>("");
  const [currentTempId, setCurrentTempId] = useState<string | null>(null);

  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return ["http:", "https:"].includes(urlObj.protocol);
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError("Please enter a webpage URL");
      return;
    }

    if (!validateUrl(url.trim())) {
      setError("Please enter a valid HTTP or HTTPS URL");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(false);
    setProcessingStage("Validating URL...");

    // Add loading note BEFORE closing modal
    const tempId = `webpage-${Date.now()}`;
    setCurrentTempId(tempId);
    addLoadingNote(tempId, "webpage", "uploading");

    // Longer delay to ensure state update propagates and UI re-renders
    await new Promise(resolve => setTimeout(resolve, 300));

    // Close modal after adding loading note
    if (onClose) {
      onClose();
    }

    try {
      updateLoadingNote(tempId, { stage: 'processing' });
      setProcessingStage("Crawling webpage...");

      const response = await fetch("/api/webpage/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
          generateNotes: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check for free tier limit
        if (response.status === 403 && data.code === 'FREE_TIER_LIMIT_REACHED') {
          openUpgradeModal();
          return;
        }

        if (response.status === 402) {
          throw new Error(
            "Insufficient credits. You need 1 credit to process a webpage."
          );
        }

        if (response.status === 400 && data.code === "INVALID_URL") {
          throw new Error("Invalid URL. Please check the URL and try again.");
        }

        if (response.status === 422 && data.code === "INSUFFICIENT_CONTENT") {
          throw new Error(
            "This webpage doesn't contain enough readable content to process."
          );
        }

        if (response.status === 502 && data.code === "WEBPAGE_ACCESS_ERROR") {
          throw new Error(
            "Unable to access this webpage. The site may be down or blocking automated requests."
          );
        }

        throw new Error(
          data.message || data.error || "Failed to process webpage"
        );
      }

      setProcessingStage("Generating AI notes...");

      if (data.success && data.data) {
        // Update with transcript ID
        if (data.data.transcript?.id) {
          updateLoadingNote(tempId, { 
            transcriptId: data.data.transcript.id,
            stage: 'generating'
          });
        }
        
        setSuccess(true);
        setProcessingStage("Complete!");

        // Update with note ID if generated
        if (data.data.note?.id) {
          updateLoadingNote(tempId, { 
            noteId: data.data.note.id,
            stage: 'completed'
          });
        }
        
        // Use local tempId (not currentTempId which is stale due to async setState)
        removeLoadingNote(tempId);
        setCurrentTempId(null);

        // Wait for shimmer removal to propagate before triggering refresh
        await new Promise(resolve => setTimeout(resolve, 200));

        // Call the completion callback with actual transcript ID
        if (onProcessComplete) {
          onProcessComplete({
            ...data.data,
            transcript: {
              ...data.data.transcript,
              id: data.data.transcript.id || tempId, // Use actual ID or fallback to temp
            },
          });
        }

        // Reset form
        setUrl("");
      } else {
        throw new Error("Processing completed but no data received");
      }
    } catch (error) {
      console.error("Webpage processing error:", error);

      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
      setProcessingStage("");
    } finally {
      // Don't remove loading note in finally — let error state show if there was an error
      // Successful path already called removeLoadingNote above
      setIsProcessing(false);
    }
  };

  const getStageDescription = (stage: string) => {
    switch (stage) {
      case "Validating URL...":
        return "Checking if the URL is valid and accessible";
      case "Crawling webpage...":
        return "Extracting content from the webpage";
      case "Generating AI notes...":
        return "Creating comprehensive notes from the content";
      case "Complete!":
        return "Webpage processed successfully!";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-dashed border-accent/30 bg-accent/5 p-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-accent flex items-center justify-center ">
            <Globe className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-foreground">Webpage Content & Notes Generator</h3>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              Enter a webpage URL to extract content and generate AI-powered educational notes from the page.
            </p>
          </div>
          <div className="space-y-4 max-w-lg mx-auto">
            <div className="text-left">
              <label htmlFor="webpage-url" className="block text-sm font-semibold text-foreground mb-3">
                Webpage URL
              </label>
              <Input
                id="webpage-url"
                className="h-12 rounded-xl border-2 border-border/20 bg-background text-foreground placeholder:text-muted-foreground focus:border-accent/50 transition-colors"
                type="url"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isProcessing}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Enter the full URL including http:// or https://
              </p>
            </div>
            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 p-4">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
            )}
            {success && (
              <div className="rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 p-4">
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">Webpage processed successfully! Notes have been generated.</p>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSubmit}
                disabled={isProcessing || !url.trim()}
                className="w-full h-12 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold  hover: transition-all duration-200"
                type="button"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-5 w-5" />
                    Process Webpage
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {(isProcessing || processingStage) && (
        <div className="rounded-2xl bg-muted/50 border border-border/20 p-6">
          <div className="flex items-center gap-3 text-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
            <div>
              <p className="font-semibold">
                {processingStage === "Validating URL..." && "Validating URL..."}
                {processingStage === "Crawling webpage..." && "Fetching content from webpage..."}
                {processingStage === "Generating AI notes..." && "Generating AI notes from content..."}
                {processingStage === "Complete!" && "Webpage processed successfully!"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {processingStage === "Validating URL..." && "Checking if the URL is valid and accessible."}
                {processingStage === "Crawling webpage..." && "Extracting readable content from the webpage. This may take a few moments."}
                {processingStage === "Generating AI notes..." && "Creating structured notes and summaries from the webpage content."}
                {processingStage === "Complete!" && "Notes and content have been generated from the webpage."}
              </p>
            </div>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-4">
            <div
              className="bg-accent h-2 rounded-full transition-all duration-500"
              style={{
                width:
                  processingStage === "Validating URL..."
                    ? "25%"
                    : processingStage === "Crawling webpage..."
                    ? "50%"
                    : processingStage === "Generating AI notes..."
                    ? "75%"
                    : processingStage === "Complete!"
                    ? "100%"
                    : "0%",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
