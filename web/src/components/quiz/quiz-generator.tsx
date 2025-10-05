import React, { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
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
      <div className="space-y-4 p-16 mb-5">
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
  return (
    <div className="h-[92vh] flex items-center justify-center bg-transparent">
      <Card className="bg-transparent border-none">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <h3 className="text-3xl font-medium text-stone-900 dark:text-stone-100 mb-3">
            Generate Quiz
          </h3>
          <p className="text-stone-600 dark:text-stone-400 text-base text-center mb-6 max-w-md">
            Create an interactive quiz from your notes to test your
            understanding and reinforce key concepts.
          </p>

          {error && (
            <div className="text-red-600 text-base mb-4 text-center">{error}</div>
          )}

          <Button
            onClick={generateQuiz}
            disabled={loading}
            className="flex items-center gap-2 bg-accent hover:bg-accent/90 cursor-pointer text-accent-foreground text-base px-6 py-3 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
          >
            {loading ? "Generating Quiz..." : "Generate Quiz"}
          </Button>

          {loading && (
            <div className="mt-4">
              <LoadingState
                message="Generating..."
                submessage="Creating quiz questions and answers based on your notes"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
