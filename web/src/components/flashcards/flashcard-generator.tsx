"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FlashcardViewer } from "./flashcard-viewer";
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

export function FlashcardGenerator({ noteId, noteTitle }: FlashcardGeneratorProps) {
  const [flashcard, setFlashcard] = useState<Flashcard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        error instanceof Error ? error.message : "Failed to generate flashcards";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingFlashcards = useCallback(async () => {
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

  // If we have flashcards, show the viewer
  if (flashcard && flashcard.content && flashcard.content.length > 0) {
    return (
      <div className="space-y-4 p-6 mb-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Flashcards</h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={generateFlashcards}
              disabled={loading}
              variant="outline"
              className="border-accent/30 text-accent hover:bg-accent/10 hover:border-accent flex items-center px-4 py-2 transition-all duration-200"
            >
              Regenerate
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="text-red-600 p-4 cursor-pointer bg-red-950/20 hover:bg-red-950/30 flex items-center dark:text-red-600 dark:hover:bg-red-950/30">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Flashcards</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete these flashcards? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteFlashcards}
                    className="text-red-600 p-4 cursor-pointer bg-red-950/20 hover:bg-red-950/30 flex items-center dark:text-red-600 dark:hover:bg-red-950/30"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <FlashcardViewer flashcards={flashcard.content} onClose={() => {}} noteTitle={noteTitle} />
      </div>
    );
  }

  // Show generation UI
  return (
    <div className="h-[92vh] flex items-center justify-center bg-[#0A0B0D]">
      <Card className="bg-[#0A0B0D] border-none">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <h3 className="text-3xl font-medium text-stone-900 dark:text-stone-100 mb-3">
            Generate Flashcards
          </h3>
          <p className="text-stone-600 dark:text-stone-400 text-base text-center mb-6 max-w-md">
            Create interactive flashcards from your notes to enhance memory
            retention and support active recall learning.
          </p>

          {error && (
            <div className="text-red-600 text-base mb-4 text-center">{error}</div>
          )}

          <Button
            onClick={generateFlashcards}
            disabled={loading}
            className="flex items-center gap-2 bg-accent hover:bg-accent/90 cursor-pointer text-accent-foreground text-base px-6 py-3 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
          >
            {loading ? "Generating Flashcards..." : "Generate Flashcards"}
          </Button>

          {loading && (
            <p className="text-sm text-stone-500 mt-2">
              This may take a few moments...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}