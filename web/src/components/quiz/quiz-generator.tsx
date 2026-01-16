import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, FileQuestion } from "lucide-react";
import { toast } from "sonner";
import { QuizViewer } from "./quiz-viewer";
import LoadingScreen from "@/components/LoadingScreen";
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

  // Auto-generate quiz if none exist
  React.useEffect(() => {
    if (!initialLoading && !quiz && !loading) {
      generateQuiz();
    }
  }, [initialLoading, quiz]);

  if (initialLoading || loading) {
    return <LoadingScreen title="Generating Quiz" />;
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

  // Show error if generation failed
  if (error) {
    return null;
  }

  return null;
}
