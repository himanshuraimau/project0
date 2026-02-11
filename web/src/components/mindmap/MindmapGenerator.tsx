"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MarkmapViewer } from "./MarkmapViewer";
import LoadingScreen from "@/components/LoadingScreen";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Share07Icon,
  StarIcon,
  Brain01Icon,
} from "@hugeicons/core-free-icons";

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

  // Auto-generate mindmap if none exist
  React.useEffect(() => {
    if (!initialLoading && !mindmap && !loading) {
      generateMindmap();
    }
  }, [initialLoading, mindmap]);

  // Show loading state while checking for existing mindmap
  if (initialLoading || loading) {
    return <LoadingScreen title="Generating Mindmap" />;
  }

  if (mindmap) {
    const baseTitle = mindmap.title.replace(/- Mindmap/i, "").trim();

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <button
              onClick={() => router.push(`/notes/${noteId}`)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
              <span>Back to note</span>
            </button>
            <div className="mt-3 flex items-center gap-2">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon icon={Brain01Icon} className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Mind map
                </p>
                <h1 className="text-lg font-semibold text-foreground truncate">
                  {baseTitle || "Generated from note"}
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard
                  .writeText(window.location.href)
                  .then(() =>
                    toast.success("Link copied to clipboard", {
                      position: "top-center",
                    }),
                  )
                  .catch(() =>
                    toast.error("Failed to copy link", {
                      position: "top-center",
                    }),
                  );
              }}
              className="h-9 rounded-lg border-border text-muted-foreground hover:text-foreground gap-1.5"
            >
              <HugeiconsIcon icon={Share07Icon} className="size-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleFavorite}
              className={`h-9 w-9 rounded-lg ${
                isFavorite
                  ? "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <HugeiconsIcon
                icon={StarIcon}
                className={`size-5 ${isFavorite ? "fill-current" : ""}`}
              />
            </Button>
          </div>
        </div>

        <MarkmapViewer
          markdownContent={mindmap.mermaidCode}
          title={mindmap.title}
        />
      </div>
    );
  }

  // Show error if generation failed
  if (error) {
    return null;
  }

  return null;
}
