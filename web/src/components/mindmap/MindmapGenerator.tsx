"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Share, Star, Trash2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { MarkmapViewer } from "./MarkmapViewer";
import { LoadingState } from "@/components/ui/loading-spinner";
import { useRouter } from "next/navigation";
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

interface MindMap {
  id: string;
  title: string;
  mermaidCode: string;
  noteId: string;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MindmapGeneratorProps {
  noteId: string;
  onClose?: () => void;
}

export function MindmapGenerator({ noteId }: MindmapGeneratorProps) {
  const router = useRouter();
  const [mindmap, setMindmap] = useState<MindMap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleShare = () => {
    toast.success("Share link copied to clipboard");
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? "Removed from favorites" : "Added to favorites");
  };

  const generateMindmap = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/mindmap/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ noteId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate mindmap");
      }

      if (data.success) {
        setMindmap(data.data);
        toast.success("Mindmap generated successfully!");
      } else {
        throw new Error(data.error || "Failed to generate mindmap");
      }
    } catch (error) {
      console.error("Error generating mindmap:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate mindmap";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingMindmap = useCallback(async () => {
    setInitialLoading(true);
    try {
      const response = await fetch(`/api/mindmap/${noteId}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMindmap(data.data);
        }
      }
      // If mindmap doesn't exist, that's fine - we'll show the generation option
    } catch (error) {
      console.error("Error fetching existing mindmap:", error);
      // Don't show error for this - just means no mindmap exists yet
    } finally {
      setInitialLoading(false);
    }
  }, [noteId]);

  const deleteMindmap = async () => {
    if (!mindmap) return;

    try {
      const response = await fetch(`/api/mindmap/${noteId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete mindmap");
      }

      setMindmap(null);
      toast.success("Mindmap deleted successfully");
    } catch (error) {
      console.error("Error deleting mindmap:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete mindmap";
      toast.error(errorMessage);
    }
  };

  // Check for existing mindmap on component mount
  React.useEffect(() => {
    fetchExistingMindmap();
  }, [fetchExistingMindmap]);

  // Show loading state while checking for existing mindmap
  if (initialLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] w-full flex items-center justify-center bg-background px-6">
        <div className="neomorphic rounded-3xl p-12 bg-background border-0 max-w-2xl w-full">
          <div className="flex flex-col items-center gap-8">
            {/* Neomorphic Animated Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative neomorphic-icon w-20 h-20 rounded-2xl flex items-center justify-center">
                <Brain className="h-10 w-10 text-primary animate-pulse" />
              </div>
            </div>

            {/* Loading Text */}
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-semibold text-foreground">Loading Mindmap</h3>
              <p className="text-muted-foreground leading-relaxed">Checking for existing content...</p>
            </div>

            {/* Neomorphic Loading Bar */}
            <div className="w-64 h-2 neomorphic rounded-full overflow-hidden">
              <div className="h-full bg-linear-to-r from-primary to-primary/80 rounded-full animate-loading-bar" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mindmap) {
    return (
      <div className="px-20 py-6">
        {/* Header Section */}
        <div className="pb-6 mb-6 border-b border-transparent" style={{
          boxShadow: '0 1px 0 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        }}>
          {/* Breadcrumb with Actions */}
          <nav className="mb-4">
            <div className="flex items-center justify-between">
              <ol className="flex items-center space-x-2 text-[19px] font-normal text-muted-foreground">
                <li>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="hover:text-foreground transition-colors"
                  >
                    Notes
                  </button>
                </li>
                <li>
                  <span className="mx-2">&gt;</span>
                </li>
                <li className="text-foreground font-medium">
                  Mindmap
                </li>
              </ol>

              {/* Share and Star Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="gap-2 rounded-none"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Share</span>
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleFavorite}
                  className="text-yellow-500 hover:text-yellow-600 rounded-none"
                >
                  <Star
                    className="h-5 w-5"
                    fill={isFavorite ? "currentColor" : "none"}
                  />
                </Button>
              </div>
            </div>
          </nav>

          {/* Title */}
          <div>
            <div className="text-2xl text-purple-800 pb-2">Mindmap for:</div>
            <h1 className="text-[19px] font-bold text-foreground leading-tight">
              {mindmap.title.replace(/- Mindmap/i, '').trim()}
            </h1>
          </div>
        </div>

        <MarkmapViewer
          markdownContent={mindmap.mermaidCode}
          title={mindmap.title}
        />
      </div>
    );
  }

  // Show generation UI
  // If loading, show LoadingState instead of the card
  if (loading) {
    return (
      <div className="h-[87vh] flex items-center justify-center bg-transparent dark:bg-[#0A0B0D] px-6 py-4 mx-4 my-6">
        <div className="w-full max-w-4xl">
          <LoadingState
            message="Generating Mindmap"
            submessage="Analyzing your notes and creating visual connections..."
            variant="ai"
          />
        </div>
      </div>
    );
  }

  return (
      <div className="h-[87vh] flex items-center justify-center bg-transparent dark:bg-[#0A0B0D] px-6 py-4 mx-4 my-6">
        <div className="neomorphic rounded-3xl p-12 bg-background border-0 max-w-2xl w-full">
          <div className="flex flex-col items-center gap-8">
            {/* Neomorphic Icon */}
            <div className="neomorphic-icon w-20 h-20 rounded-2xl flex items-center justify-center">
              <Brain className="h-10 w-10 text-primary" />
            </div>

            {/* Content */}
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-semibold text-foreground">Generate Mindmap</h3>
              <p className="text-muted-foreground leading-relaxed max-w-md">
                Transform your notes into a visual mindmap using Markmap technology. This helps you understand the relationships between key concepts in your notes.
              </p>
            </div>

            {error && (
              <div className="neomorphic rounded-xl p-4 bg-red-50 dark:bg-red-950/20 border-0 w-full">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={generateMindmap}
              disabled={loading}
              className="neomorphic border-0 bg-background hover:bg-background text-foreground  px-8 py-6 h-auto rounded-xl transition-all duration-300 w-full"
            >
              <div className="neomorphic-icon w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium text-lg">
                {loading ? "Generating..." : "Generate Mindmap"}
              </span>
            </Button>
          </div>
        </div>
      </div>
    );
}
