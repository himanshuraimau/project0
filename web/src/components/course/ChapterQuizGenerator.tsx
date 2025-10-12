"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, FileQuestion } from "lucide-react";
import { toast } from "sonner";
import { QuizViewer } from "@/components/quiz/quiz-viewer";
import { LoadingState } from "@/components/ui/loading-spinner";
import { QuizQuestion } from "@/lib/types/quiz.types";
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

interface QuizData {
  quiz: QuizQuestion[];
}

interface ChapterQuizGeneratorProps {
  chapterId: string;
  variant?: 'neomorphic' | 'clean';
}

export function ChapterQuizGenerator({ chapterId, variant = 'clean' }: ChapterQuizGeneratorProps) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const generateQuiz = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/chapter/${chapterId}/quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate quiz");
      }

      if (data.success) {
        setQuiz(data.data);
        toast.success(data.cached ? "Loaded existing quiz" : "Quiz generated successfully!");
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
    setInitialLoading(true);
    try {
      const response = await fetch(`/api/chapter/${chapterId}/quiz`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setQuiz(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching existing quiz:", error);
    } finally {
      setInitialLoading(false);
    }
  }, [chapterId]);

  const deleteQuiz = async () => {
    try {
      const response = await fetch(`/api/chapter/${chapterId}/quiz`, {
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

  React.useEffect(() => {
    fetchExistingQuiz();
  }, [fetchExistingQuiz]);

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <h3 className="text-lg font-semibold mb-2">Loading Quiz</h3>
        <p className="text-muted-foreground text-center">Checking for existing content...</p>
      </div>
    );
  }

  if (quiz && quiz.quiz && quiz.quiz.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Quiz</h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={generateQuiz}
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
                  <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this quiz? This action cannot be undone.
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

        <QuizViewer quiz={quiz.quiz} onClose={() => {}} />
      </div>
    );
  }

  return (
    <div className="text-center p-8">
      <FileQuestion className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <h3 className="text-lg font-semibold mb-2">Generate Quiz</h3>
      <p className="text-muted-foreground mb-4">
        Create an interactive quiz from this chapter to test your understanding and reinforce key concepts.
      </p>

      {error && (
        <div className="rounded-xl p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 w-full mb-4">
          <p className="text-red-600 text-sm text-center">{error}</p>
        </div>
      )}

      <button
        onClick={generateQuiz}
        disabled={loading}
        className="px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-semibold"
      >
        {loading ? "Generating Quiz..." : "Generate Quiz"}
      </button>

      {loading && (
        <div className="mt-4">
          <LoadingState message="Generating Quiz" submessage="Creating quiz questions based on this chapter's content" variant="ai" />
        </div>
      )}
    </div>
  );
}
