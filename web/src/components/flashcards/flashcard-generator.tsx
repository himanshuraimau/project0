"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Layers } from "lucide-react";
import { toast } from "sonner";
import { FlashcardViewer } from "./flashcard-viewer";
import LoadingScreen from "@/components/LoadingScreen";
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

  // Auto-generate flashcards if none exist
  React.useEffect(() => {
    if (!initialLoading && !flashcard && !loading) {
      generateFlashcards();
    }
  }, [initialLoading, flashcard]);

  // Show loading state while generating
  if (loading || initialLoading) {
    return <LoadingScreen title="Generating Flashcards" />;
  }

  // If we have flashcards, show the viewer
  if (flashcard && flashcard.content && flashcard.content.length > 0) {
    return (
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between"></div>

        <FlashcardViewer
          flashcards={flashcard.content}
          onClose={() => {}}
          noteTitle={noteTitle}
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
