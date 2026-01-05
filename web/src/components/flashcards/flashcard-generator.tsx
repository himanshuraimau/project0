"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Layers } from "lucide-react";
import { toast } from "sonner";
import { FlashcardViewer } from "./flashcard-viewer";
import { LoadingState } from "@/components/ui/loading-spinner";
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

interface Flashcard {
  id: string;
  content: Array<{
    id: number;
    question: string;
    answer: string;
  }>;
  noteId: string;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FlashcardGeneratorProps {
  noteId: string;
  onClose?: () => void;
  noteTitle?: string;
}

export function FlashcardGenerator({
  noteId,
  noteTitle,
}: FlashcardGeneratorProps) {
  const [flashcard, setFlashcard] = useState<Flashcard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const generateFlashcards = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/notes/generate-flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ noteId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate flashcards");
      }

      if (data.success) {
        setFlashcard(data.data);
        toast.success("Flashcards generated successfully!");
      } else {
        throw new Error(data.error || "Failed to generate flashcards");
      }
    } catch (error) {
      console.error("Error generating flashcards:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate flashcards";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingFlashcards = useCallback(async () => {
    setInitialLoading(true);
    try {
      const response = await fetch(`/api/notes/${noteId}/flashcards`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setFlashcard(data.data);
        }
      }
      // If flashcards don't exist, that's fine - we'll show the generation option
    } catch (error) {
      console.error("Error fetching existing flashcards:", error);
      // Don't show error for this - just means no flashcards exist yet
    } finally {
      setInitialLoading(false);
    }
  }, [noteId]);

  const deleteFlashcards = async () => {
    if (!flashcard) return;

    try {
      const response = await fetch(`/api/notes/${noteId}/flashcards`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete flashcards");
      }

      setFlashcard(null);
      toast.success("Flashcards deleted successfully");
    } catch (error) {
      console.error("Error deleting flashcards:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete flashcards";
      toast.error(errorMessage);
    }
  };

  // Check for existing flashcards on component mount
  React.useEffect(() => {
    fetchExistingFlashcards();
  }, [fetchExistingFlashcards]);

  // Show loading state while checking for existing flashcards
  if (initialLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] w-full flex items-center justify-center bg-background px-6">
        <div className="neomorphic rounded-3xl p-12 bg-background border-0 max-w-2xl w-full">
          <div className="flex flex-col items-center gap-8">
            {/* Neomorphic Animated Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative neomorphic-icon w-20 h-20 rounded-2xl flex items-center justify-center">
                <Layers className="h-10 w-10 text-primary animate-pulse" />
              </div>
            </div>

            {/* Loading Text */}
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-semibold text-foreground">
                Loading Flashcards
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Checking for existing content...
              </p>
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

  // If we have flashcards, show the viewer
  if (flashcard && flashcard.content && flashcard.content.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between"></div>

        <FlashcardViewer
          flashcards={flashcard.content}
          onClose={() => {}}
          noteTitle={noteTitle}
        />
      </div>
    );
  }

  // Show generation UI
  // If loading, show LoadingState instead of the card
  if (loading) {
    return (
      <div className="h-[92vh] flex items-center justify-center bg-transparent dark:bg-[#0A0B0D] px-6">
        <div className="w-full max-w-4xl">
          <LoadingState
            message="Generating Flashcards"
            submessage="Creating interactive flashcards from your notes to enhance memory retention"
            variant="ai"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[92vh] flex items-center justify-center bg-transparent dark:bg-[#0A0B0D] px-6">
      <div className="neomorphic rounded-3xl p-12 bg-background border-0 max-w-2xl w-full">
        <div className="flex flex-col items-center gap-8">
          {/* Neomorphic Icon */}
          <div className="neomorphic-icon w-20 h-20 rounded-2xl flex items-center justify-center">
            <Layers className="h-10 w-10 text-primary" />
          </div>

          {/* Content */}
          <div className="text-center space-y-3">
            <h3 className="text-2xl font-semibold text-foreground">
              Generate Flashcards
            </h3>
            <p className="text-muted-foreground leading-relaxed max-w-md">
              Create interactive flashcards from your notes to enhance memory
              retention and support active recall learning.
            </p>
          </div>

          {error && (
            <div className="neomorphic rounded-xl p-4 bg-red-50 dark:bg-red-950/20 border-0 w-full">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={generateFlashcards}
            disabled={loading}
            className="neomorphic border-0 bg-background hover:bg-background text-foreground  px-8 py-6 h-auto rounded-xl transition-all duration-300 w-full"
          >
            <div className="neomorphic-icon w-10 h-10 rounded-lg flex items-center justify-center mr-3">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <span className="font-medium text-lg">
              {loading ? "Generating Flashcards..." : "Generate Flashcards"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
