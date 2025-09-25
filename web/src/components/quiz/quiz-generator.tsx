"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { QuizViewer } from "./quiz-viewer";
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

interface Quiz {
  id: string;
  content: {
    quiz: Array<{
      id: number;
      type: string;
      question: string;
      options?: string[];
      correct_answer: string | boolean;
      explanation: string;
    }>;
  };
  noteId: string;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface QuizGeneratorProps {
  noteId: string;
  onClose?: () => void;
}

export function QuizGenerator({ noteId }: QuizGeneratorProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQuiz = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/notes/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ noteId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate quiz");
      }

      if (data.success) {
        setQuiz(data.data);
        toast.success("Quiz generated successfully!");
      } else {
        throw new Error(data.error || "Failed to generate quiz");
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate quiz";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingQuiz = useCallback(async () => {
    try {
      const response = await fetch(`/api/notes/${noteId}/quiz`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setQuiz(data.data);
        }
      }
      // If quiz doesn't exist, that's fine - we'll show the generation option
    } catch (error) {
      console.error("Error fetching existing quiz:", error);
      // Don't show error for this - just means no quiz exists yet
    }
  }, [noteId]);

  const deleteQuiz = async () => {
    if (!quiz) return;

    try {
      const response = await fetch(`/api/notes/${noteId}/quiz`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete quiz");
      }

      setQuiz(null);
      toast.success("Quiz deleted successfully");
    } catch (error) {
      console.error("Error deleting quiz:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete quiz";
      toast.error(errorMessage);
    }
  };

  // Check for existing quiz on component mount
  React.useEffect(() => {
    fetchExistingQuiz();
  }, [fetchExistingQuiz]);

  // If we have a quiz, show the viewer
  if (quiz && quiz.content?.quiz) {
    return (
      <div className="space-y-4 p-6 mb-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Quiz</h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={generateQuiz}
              disabled={loading}
              className="bg-stone-100 p-4 text-black hover:bg-stone-200 dark:bg-stone-900 dark:text-white dark:hover:bg-stone-800 flex items-center"
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
                  <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this quiz? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteQuiz}
                    className="text-red-600 p-4 cursor-pointer bg-red-950/20 hover:bg-red-950/30 flex items-center dark:text-red-600 dark:hover:bg-red-950/30"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <QuizViewer quiz={quiz.content.quiz} onClose={() => {}} />
      </div>
    );
  }

  // Show generation UI
  return (
    <div className="space-y-4 h-screen flex items-center justify-center bg-transparent">
      <Card className="bg-transparent border-none">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <h3 className="text-2xl font-medium text-stone-900 dark:text-stone-100 mb-2">
            Generate Quiz
          </h3>
          <p className="text-stone-600 dark:text-stone-400 text-sm text-center mb-6 max-w-md">
            Create an interactive quiz from your notes to test your
            understanding and reinforce key concepts.
          </p>

          {error && (
            <div className="text-red-600 text-sm mb-4 text-center">{error}</div>
          )}

          <Button
            onClick={generateQuiz}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-600 cursor-pointer text-white"
          >
            {loading ? "Generating Quiz..." : "Generate Quiz"}
          </Button>

          {loading && (
            <p className="text-xs text-stone-500 mt-2">
              This may take a few moments...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
