"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MindmapViewer } from "./MindmapViewer";
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
  const [mindmap, setMindmap] = useState<MindMap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // If we have a mindmap, show the viewer
  if (mindmap) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Mindmap</h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={generateMindmap}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <Brain className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Mindmap</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this mindmap? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteMindmap}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <MindmapViewer
          mermaidCode={mindmap.mermaidCode}
          title={mindmap.title}
        />
      </div>
    );
  }

  // Show generation UI
  return (
    <div className="space-y-4">
      <Card className="bg-transparent border-none	">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <h3 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
            Generate Mindmap
          </h3>
          <p className="text-stone-600 dark:text-stone-400 text-center mb-6 max-w-md">
            Transform your notes into a visual mindmap that helps you understand
            the relationships between key concepts.
          </p>

          {error && (
            <div className="text-red-600 text-sm mb-4 text-center">{error}</div>
          )}

          <Button
            onClick={generateMindmap}
            disabled={loading}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Brain className="h-4 w-4" />
            {loading ? "Generating..." : "Generate Mindmap"}
          </Button>

          {loading && (
            <p className="text-xs text-gray-500 mt-2">
              This may take a few moments...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
