"use client";

import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { QuizViewer } from './quiz-viewer';
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
      const response = await fetch('/api/notes/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ noteId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate quiz');
      }

      if (data.success) {
        setQuiz(data.data);
        toast.success('Quiz generated successfully!');
      } else {
        throw new Error(data.error || 'Failed to generate quiz');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate quiz';
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
      console.error('Error fetching existing quiz:', error);
      // Don't show error for this - just means no quiz exists yet
    }
  }, [noteId]);

  const deleteQuiz = async () => {
    if (!quiz) return;

    try {
      const response = await fetch(`/api/notes/${noteId}/quiz`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete quiz');
      }

      setQuiz(null);
      toast.success('Quiz deleted successfully');
    } catch (error) {
      console.error('Error deleting quiz:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete quiz';
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Quiz</h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={generateQuiz}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <Brain className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
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
                  <AlertDialogAction onClick={deleteQuiz} className="bg-red-600 hover:bg-red-700">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        <QuizViewer
          quiz={quiz.content.quiz}
          onClose={() => {}}
        />
      </div>
    );
  }

  // Show generation UI
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-900/20 mb-4">
            <Brain className="h-12 w-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Generate Quiz
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
            Create an interactive quiz from your notes to test your understanding and reinforce key concepts.
          </p>
          
          {error && (
            <div className="text-red-600 text-sm mb-4 text-center">
              {error}
            </div>
          )}
          
          <Button
            onClick={generateQuiz}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Brain className="h-4 w-4" />
            {loading ? 'Generating Quiz...' : 'Generate Quiz'}
          </Button>
          
          {loading && (
            <p className="text-xs text-gray-500 mt-2">
              This may take a few moments...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}