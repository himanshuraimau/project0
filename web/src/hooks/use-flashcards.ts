import { useState, useCallback } from 'react';
import type { FlashcardItem } from '@/lib/types';

export const useFlashcards = () => {
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateFlashcards = useCallback(async (noteId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/notes/generate-flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ noteId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          throw new Error('INSUFFICIENT_CREDITS');
        }
        throw new Error(data.error || 'Failed to generate flashcards');
      }

      // data.data is now a single Flashcard object with content array
      const flashcardItems = data.data.content || [];
      setFlashcards(flashcardItems);
      return flashcardItems;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate flashcards';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getFlashcards = useCallback(async (noteId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/notes/${noteId}/flashcards`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch flashcards');
      }

      // data.data is now a single Flashcard object with content array
      const flashcardItems = data.data?.content || [];
      setFlashcards(flashcardItems);
      return flashcardItems;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch flashcards';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteFlashcards = useCallback(async (noteId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/notes/${noteId}/flashcards`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete flashcards');
      }

      setFlashcards([]);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete flashcards';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    flashcards,
    loading,
    error,
    generateFlashcards,
    getFlashcards,
    deleteFlashcards,
    setFlashcards,
  };
};
