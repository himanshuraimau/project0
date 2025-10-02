"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Globe, Loader2, ExternalLink } from "lucide-react";
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

export function WebpageProcessor({ onProcessComplete, onClose }: WebpageProcessorProps) {
  const { addLoadingNote } = useDashboardRefresh();
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>("");

  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
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
    addLoadingNote(tempId, 'webpage');

    // Close modal immediately after starting
    if (onClose) {
      onClose();
    }

    try {
      setProcessingStage("Crawling webpage...");
      
      const response = await fetch('/api/webpage/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          generateNotes: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          throw new Error("Insufficient credits. You need 1 credit to process a webpage.");
        }
        
        if (response.status === 400 && data.code === 'INVALID_URL') {
          throw new Error("Invalid URL. Please check the URL and try again.");
        }
        
        if (response.status === 422 && data.code === 'INSUFFICIENT_CONTENT') {
          throw new Error("This webpage doesn't contain enough readable content to process.");
        }
        
        if (response.status === 502 && data.code === 'WEBPAGE_ACCESS_ERROR') {
          throw new Error("Unable to access this webpage. The site may be down or blocking automated requests.");
        }

        throw new Error(data.message || data.error || 'Failed to process webpage');
      }

      setProcessingStage("Generating AI notes...");

      if (data.success && data.data) {
        setSuccess(true);
        setProcessingStage("Complete!");
        
        // Call the completion callback with actual transcript ID
        if (onProcessComplete) {
          onProcessComplete({
            ...data.data,
            transcript: {
              ...data.data.transcript,
              id: data.data.transcript.id || tempId // Use actual ID or fallback to temp
            }
          });
        }

        // Reset form
        setUrl("");
      } else {
        throw new Error("Processing completed but no data received");
      }

    } catch (error) {
      console.error('Webpage processing error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
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
    <div className="w-full max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
            <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Process Webpage</CardTitle>
          <CardDescription>
            Enter a webpage URL to extract content and generate AI-powered educational notes
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url" className="text-sm font-medium">
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
                  className="pr-10"
                />
                <ExternalLink className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the full URL including http:// or https://
              </p>
            </div>

            {error && (
              <div className="flex items-center p-4 border border-red-200 rounded-lg bg-red-50 dark:border-red-800 dark:bg-red-950">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
                <span className="text-red-800 dark:text-red-200 text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center p-4 border border-green-200 rounded-lg bg-green-50 dark:border-green-800 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                <span className="text-green-800 dark:text-green-200 text-sm">
                  Webpage processed successfully! Notes have been generated.
                </span>
              </div>
            )}

            {processingStage && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="font-medium">{processingStage}</span>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  {getStageDescription(processingStage)}
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 ml-6">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: processingStage === "Validating URL..." ? "25%" :
                             processingStage === "Crawling webpage..." ? "50%" :
                             processingStage === "Generating AI notes..." ? "75%" :
                             processingStage === "Complete!" ? "100%" : "0%"
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isProcessing || !url.trim()}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-4 w-4" />
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
