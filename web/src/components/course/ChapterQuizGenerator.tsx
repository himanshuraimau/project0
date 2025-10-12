"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { LoadingState } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronRight } from "lucide-react";
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

interface Question {
  id: string;
  question: string;
  answer: string;
  options: string;
}

interface ChapterQuizGeneratorProps {
  chapterId: string;
  variant?: 'neomorphic' | 'clean';
}

export function ChapterQuizGenerator({ chapterId, variant = 'clean' }: ChapterQuizGeneratorProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionState, setQuestionState] = useState<Record<string, boolean | null>>({});

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
        setQuestions(data.data);
        setAnswers({});
        setQuestionState({});
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
        if (data.success && data.data && data.data.length > 0) {
          setQuestions(data.data);
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

      setQuestions([]);
      setAnswers({});
      setQuestionState({});
      toast.success("Quiz deleted successfully");
    } catch (error) {
      console.error("Error deleting quiz:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete quiz";
      toast.error(errorMessage);
    }
  };

  const checkAnswer = useCallback(() => {
    const newQuestionState = { ...questionState };
    questions.forEach((question) => {
      const user_answer = answers[question.id];
      if (!user_answer) return;
      if (user_answer === question.answer) {
        newQuestionState[question.id] = true;
      } else {
        newQuestionState[question.id] = false;
      }
    });
    setQuestionState(newQuestionState);
  }, [answers, questionState, questions]);

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
                  <HelpCircle className="h-10 w-10 text-primary animate-pulse" />
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

  // If we have questions, show the quiz
  if (questions.length > 0) {
    const containerClass = variant === 'neomorphic' ? 'space-y-4 p-16 mb-5' : 'space-y-4';
    
    return (
      <div className={containerClass}>
        <div className="flex items-center justify-between mb-4">
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

        <div className="space-y-4">
          {questions.map((question) => {
            const options = JSON.parse(question.options) as string[];
            const state = questionState[question.id];
            return (
              <div
                key={question.id}
                className={cn(
                  "p-4 rounded-xl border shadow transition-all duration-200",
                  state === true
                    ? "bg-green-50 border-green-400 dark:bg-green-900/30 dark:border-green-600"
                    : state === false
                    ? "bg-red-50 border-red-400 dark:bg-red-900/30 dark:border-red-600"
                    : "bg-card border-border dark:bg-muted dark:border-border"
                )}
              >
                <h2 className="text-base font-semibold mb-2 text-foreground flex items-center gap-2">
                  {question.question}
                  {state === true && <span className="text-green-600">✔️</span>}
                  {state === false && <span className="text-red-600">❌</span>}
                </h2>
                <RadioGroup
                  onValueChange={(e) => {
                    setAnswers((prev) => ({ ...prev, [question.id]: e }));
                  }}
                  className="space-y-2"
                >
                  {options.map((option, index) => (
                    <div className="flex items-center gap-2" key={index}>
                      <RadioGroupItem
                        value={option}
                        id={question.id + index.toString()}
                      />
                      <Label htmlFor={question.id + index.toString()} className="text-sm">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            );
          })}
        </div>

        <Button
          className="w-full mt-6 text-base font-semibold py-3 rounded-xl shadow"
          size="lg"
          onClick={checkAnswer}
        >
          Check Answers
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  // Show generation UI
  if (variant === 'neomorphic') {
    return (
      <div className="h-[92vh] flex items-center justify-center bg-transparent dark:bg-[#0A0B0D] px-6">
        <div className="neomorphic rounded-3xl p-12 bg-background border-0 max-w-2xl w-full">
          <div className="flex flex-col items-center gap-8">
            <div className="neomorphic-icon w-20 h-20 rounded-2xl flex items-center justify-center">
              <HelpCircle className="h-10 w-10 text-primary" />
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-semibold text-foreground">Generate Quiz</h3>
              <p className="text-muted-foreground leading-relaxed max-w-md">
                Create an interactive quiz from this chapter to test your understanding and reinforce key concepts.
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
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium text-lg">
                {loading ? "Generating Quiz..." : "Generate Quiz"}
              </span>
            </Button>
            {loading && (
              <div className="w-full">
                <LoadingState
                  message="Generating Quiz"
                  submessage="Creating quiz questions based on this chapter's content"
                  variant="ai"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="text-center p-8">
      <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
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
    </div>
  );
}
