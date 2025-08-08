import { useState, useCallback } from 'react';

export interface QuizQuestion {
  id: number;
  type: 'multiple_choice' | 'true_false';
  question: string;
  options?: string[];
  correct_answer: string | boolean;
  explanation: string;
}

export interface QuizData {
  quiz: QuizQuestion[];
}

export interface Quiz {
  id: string;
  noteId: string;
  content: QuizData;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export const useQuiz = () => {
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQuiz = useCallback(async (noteId: string) => {
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

      // data.data is now a single Quiz object with content containing quiz array
      const quizQuestions = data.data.content?.quiz || [];
      setQuiz(quizQuestions);
      return quizQuestions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate quiz';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getQuiz = useCallback(async (noteId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/notes/${noteId}/quiz`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch quiz');
      }

      // data.data is now a single Quiz object with content containing quiz array
      const quizQuestions = data.data?.content?.quiz || [];
      setQuiz(quizQuestions);
      return quizQuestions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch quiz';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteQuiz = useCallback(async (noteId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/notes/${noteId}/quiz`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete quiz');
      }

      setQuiz([]);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete quiz';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    quiz,
    loading,
    error,
    generateQuiz,
    getQuiz,
    deleteQuiz,
    setQuiz,
  };
};
