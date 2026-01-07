import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, FileQuestion } from "lucide-react";
import { toast } from "sonner";
import { QuizViewer } from "./quiz-viewer";
import { LoadingState } from "@/components/ui/loading-spinner";
import { QuestionType } from "@/lib/types/quiz.types";


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
  variant?: "neomorphic" | "clean";
  noteTitle?: string;
}

export function QuizGenerator({
  noteId,
  variant = "neomorphic",
  noteTitle,
}: QuizGeneratorProps) {
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
    } catch (error) {
      console.error("Error fetching existing quiz:", error);
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

  React.useEffect(() => {
    fetchExistingQuiz();
  }, [fetchExistingQuiz]);

  if (initialLoading) {
    if (variant === "neomorphic") {
      return (
        <div className="min-h-[calc(100vh-64px)] w-full flex items-center justify-center px-6">
          <div className="neomorphic rounded-3xl p-5 border-0 max-w-2xl w-full">
            <div className="flex flex-col items-center gap-8">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative neomorphic-icon w-20 h-20 rounded-2xl flex items-center justify-center">
                  <FileQuestion className="h-10 w-10 text-primary animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-3">
                <h3 className="text-2xl font-semibold text-foreground">
                  Loading Quiz
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Checking for existing content...
                </p>
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

  if (quiz && quiz.content?.quiz) {
    return (
      <QuizViewer
        quiz={quiz.content.quiz as any}
        onClose={() => {}}
        noteTitle={noteTitle}
      />
    );
  }

  if (variant === "neomorphic") {
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
        <div className="rounded-3xl border border-neutral-200 dark:bg-[#1A1A1A] dark:border-[#1F1F1F] bg-[#F9FAFB] p-5  max-w-2xl w-full">
          <div className="flex flex-col items-center gap-8">
            <div className="text-center space-y-2">
              <h3 className="text-[20px] font-medium leading-[30px]">
                Generate Quiz
              </h3>
              <p className="text-[15px] text-[#787878] tracking-[-3%]">
                Create an interactive quiz from your notes to test your
                understanding and reinforce key concepts.
              </p>
            </div>
            {error && (
              <div className="neomorphic rounded-xl p-4 bg-red-50 dark:bg-red-950/20 border-0 w-full">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}
            <button
              onClick={generateQuiz}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white border-0 cursor-pointer shadow-none px-8 py-2 h-auto rounded-lg transition-all duration-300 w-full"
            >
              <span className="font-medium text-lg">
                {loading ? "Generating Quiz..." : "Generate Quiz"}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center p-5">
      <FileQuestion className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <h3 className="text-[20px] font-medium leading-[30px]">Generate Quiz</h3>
      <p className="text-[15px] text-[#787878] tracking-[-3%]">
        Create an interactive quiz from your notes to test your understanding
        and reinforce key concepts.
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
