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
  const { addLoadingNote, removeLoadingNote } = useDashboardRefresh();
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

    // Add loading note immediately when processing starts
    const tempId = `webpage-${Date.now()}`;
    setCurrentTempId(tempId);
    addLoadingNote(tempId, "webpage");

    // Close modal immediately after starting
    if (onClose) {
      onClose();
    }

    try {
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
        setSuccess(true);
        setProcessingStage("Complete!");

        // Remove loading note using temp ID BEFORE calling completion callback
        if (currentTempId) {
          removeLoadingNote(currentTempId);
          setCurrentTempId(null);
        }

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

      // Remove loading note on error
      if (currentTempId) {
        removeLoadingNote(currentTempId);
        setCurrentTempId(null);
      }

      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
      setProcessingStage("");
    } finally {
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
    <div className="w-full max-w-2xl mx-auto">
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-blue-950/30 rounded-2xl flex items-center justify-center mb-4">
            <Globe className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Process Webpage
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400 text-base">
            Enter a webpage URL to extract content and generate AI-powered
            educational notes
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label
                htmlFor="url"
                className="text-base font-medium text-slate-900 dark:text-slate-100"
              >
                Webpage URL
              </Label>
              <div className="relative">
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isProcessing}
                  className="pr-12 h-12 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
                />
                <ExternalLink className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Enter the full URL including http:// or https://
              </p>
            </div>

            {error && (
              <div className="flex items-start p-4 border border-red-200 dark:border-red-800 rounded-xl bg-red-50 dark:bg-red-950/50">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-red-800 dark:text-red-200 text-sm leading-relaxed">
                  {error}
                </span>
              </div>
            )}

            {success && (
              <div className="flex items-start p-4 border border-green-200 dark:border-green-800 rounded-xl bg-green-50 dark:bg-green-950/50">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-green-800 dark:text-green-200 text-sm leading-relaxed">
                  Webpage processed successfully! Notes have been generated.
                </span>
              </div>
            )}

            {processingStage && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-blue-600 dark:text-blue-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="font-medium">{processingStage}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 ml-8">
                  {getStageDescription(processingStage)}
                </p>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 ml-8">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
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

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isProcessing || !url.trim()}
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
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

              {onClose && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="h-12 px-6 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
