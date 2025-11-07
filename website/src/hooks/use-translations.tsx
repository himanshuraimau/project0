import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  NoteTranslation, 
  LanguageCode, 
  SUPPORTED_LANGUAGES,
  ApiSuccessResponse,
  ApiErrorResponse
} from '@/lib/types';

interface UseTranslationsReturn {
  loading: boolean;
  error: string | null;
  generateTranslation: (noteId: string, language: LanguageCode) => Promise<NoteTranslation | null>;
  getTranslation: (noteId: string, language: LanguageCode) => Promise<NoteTranslation | null>;
  deleteTranslation: (noteId: string, language: LanguageCode) => Promise<boolean>;
}

export function useTranslations(): UseTranslationsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateTranslation = useCallback(async (
    noteId: string, 
    language: LanguageCode
  ): Promise<NoteTranslation | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/notes/${noteId}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language }),
      });

      const data = await response.json() as ApiSuccessResponse | ApiErrorResponse;

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate translation');
      }

      const successData = data as ApiSuccessResponse;
      toast.success(`Translation to ${SUPPORTED_LANGUAGES[language]} completed!`, {
        duration: 3000,
        position: 'top-center',
      });

      return successData.data as NoteTranslation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate translation';
      setError(errorMessage);
      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-center',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTranslation = useCallback(async (
    noteId: string, 
    language: LanguageCode
  ): Promise<NoteTranslation | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/notes/${noteId}/translate?language=${language}`);
      const data = await response.json() as ApiSuccessResponse | ApiErrorResponse;

      if (!data.success) {
        // Translation doesn't exist yet, that's okay
        if (response.status === 404) {
          return null;
        }
        throw new Error(data.error || 'Failed to fetch translation');
      }

      const successData = data as ApiSuccessResponse;
      return successData.data as NoteTranslation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch translation';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTranslation = useCallback(async (
    noteId: string, 
    language: LanguageCode
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/notes/${noteId}/translate?language=${language}`, {
        method: 'DELETE',
      });

      const data = await response.json() as ApiSuccessResponse | ApiErrorResponse;

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete translation');
      }

      toast.success(`Translation deleted successfully`, {
        duration: 2000,
        position: 'top-center',
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete translation';
      setError(errorMessage);
      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-center',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    generateTranslation,
    getTranslation,
    deleteTranslation,
  };
}
