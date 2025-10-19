import React, { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, FileQuestion } from "lucide-react";
import { toast } from "sonner";
import { QuizViewer } from "./quiz-viewer";
import { LoadingState } from "@/components/ui/loading-spinner";
import { QuestionType } from "@/lib/types/quiz.types";
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
      type: QuestionType;
      question: string;
      options?: string[];
      correct_answer: string | boolean;
      explanation: string;
    }>;
  };
}

interface QuizGeneratorProps {
  noteId: string;
  onClose?: () => void;
  variant?: 'neomorphic' | 'clean'; // Add variant prop
}

export function QuizGenerator({ noteId, variant = 'neomorphic' }: QuizGeneratorProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

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
    setInitialLoading(true);
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
    } finally {
      setInitialLoading(false);
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

  // Show loading state while checking for existing quiz
  if (initialLoading) {
    if (variant === 'neomorphic') {
      return (
        <div className="min-h-[calc(100vh-64px)] w-full flex items-center justify-center bg-background px-6">
          <div className="neomorphic rounded-3xl p-12 bg-background border-0 max-w-2xl w-full">
            <div className="flex flex-col items-center gap-8">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative neomorphic-icon w-20 h-20 rounded-2xl flex items-center justify-center">
                  <FileQuestion className="h-10 w-10 text-primary animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-3">
                <h3 className="text-2xl font-semibold text-foreground">Loading Quiz</h3>
                <p className="text-muted-foreground leading-relaxed">Checking for existing content...</p>
              </div>
              <div className="w-64 h-2 neomorphic rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full animate-loading-bar" />
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <h3 className="text-lg font-semibold mb-2">Loading Quiz</h3>
        <p className="text-muted-foreground text-center">
          Checking for existing content...
        </p>
      </div>
    );
  }

  // If we have a quiz, show the viewer
  if (quiz && quiz.content?.quiz) {
    const containerClass = variant === 'neomorphic' ? 'space-y-4 p-16 mb-5' : 'space-y-4';
    
    return (
      <div className={containerClass}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Quiz</h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={generateQuiz}
              disabled={loading}
              variant="outline"
              className="border-accent text-black hover:text-black dark:hover:bg-slate-400 cursor-pointer dark:text-white hover:bg-accent/10 hover:border-accent flex items-center px-4 py-2 transition-all duration-200 hover:scale-105"
            >
              Regenerate
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="text-red-600 p-4 cursor-pointer bg-red-950/20 hover:bg-red-950/30 flex items-center dark:text-red-600 dark:hover:bg-red-950/30 transition-all duration-200 hover:scale-105">
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

        <QuizViewer quiz={quiz.content.quiz as any} onClose={() => {}} />
      </div>
    );
  }

  // Show generation UI
  if (variant === 'neomorphic') {
    // If loading, show LoadingState instead of the card
    if (loading) {
      return (
        <div className="h-[92vh] flex items-center justify-center bg-transparent dark:bg-[#0A0B0D] px-6">
          <div className="w-full max-w-4xl">
            <LoadingState
              message="Generating Quiz"
              submessage="Creating quiz questions and answers based on your notes"
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
            <div className="neomorphic-icon w-20 h-20 rounded-2xl flex items-center justify-center">
              <FileQuestion className="h-10 w-10 text-primary" />
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-semibold text-foreground">Generate Quiz</h3>
              <p className="text-muted-foreground leading-relaxed max-w-md">
                Create an interactive quiz from your notes to test your understanding and reinforce key concepts.
              </p>
            </div>
            {error && (
              <div className="neomorphic rounded-xl p-4 bg-red-50 dark:bg-red-950/20 border-0 w-full">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}
            <Button
              onClick={generateQuiz}
              disabled={loading}
              className="neomorphic border-0 bg-background hover:bg-background text-foreground shadow-none px-8 py-6 h-auto rounded-xl transition-all duration-300 w-full"
            >
              <div className="neomorphic-icon w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                <FileQuestion className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium text-lg">
                {loading ? "Generating Quiz..." : "Generate Quiz"}
              </span>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="text-center p-8">
      <FileQuestion className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <h3 className="text-lg font-semibold mb-2">Generate Quiz</h3>
      <p className="text-muted-foreground mb-4">
        Create an interactive quiz from your notes to test your understanding and reinforce key concepts.
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
    </div>
  );
}
