import { useState } from 'react';

export interface Note {
  id: string;
  title: string;
  content: string | null;
  transcriptId: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  transcript?: {
    id: string;
    originalName: string;
    createdAt: string;
  };
}

export interface ProcessPDFResult {
  transcript: {
    id: string;
    text: string;
    cleanText: string;
    pages: number;
    metadata?: any;
    imageCount: number;
    extractedFiles?: any;
  };
  note?: Note | { 
    error: string; 
    message: string;
    redirectToPricing?: boolean;
    redirectUrl?: string;
  };
  insufficientCredits?: boolean;
  redirectUrl?: string;
}

export function useNotes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Process PDF and generate notes
  const processPDFWithNotes = async (
    file: File,
    options: {
      extractImages?: boolean;
      maxPages?: number;
      generateNotes?: boolean;
      redirectOnInsufficientCredits?: boolean;
    } = {}
  ): Promise<ProcessPDFResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (options.extractImages) {
        formData.append('extractImages', 'true');
      }
      
      if (options.maxPages) {
        formData.append('maxPages', options.maxPages.toString());
      }
      
      if (options.generateNotes !== undefined) {
        formData.append('generateNotes', options.generateNotes.toString());
      }

      const response = await fetch('/api/pdf/process', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to process PDF');
      }
      
      // Check if note generation failed due to insufficient credits
      if (result.data.note?.error === 'Insufficient credits' && result.data.note?.redirectToPricing) {
        // Still return the data since PDF processing succeeded, but set a flag for the UI to show a message
        result.data.insufficientCredits = true;
        result.data.redirectUrl = result.data.note.redirectUrl || '/pricing';
        
        // If we want to automatically redirect
        if (typeof window !== 'undefined' && options.redirectOnInsufficientCredits !== false) {
          setTimeout(() => {
            window.location.href = result.data.redirectUrl;
          }, 3000); // Give the user a moment to see the result before redirecting
        }
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      // Handle redirection for insufficient credits if the error has that info
      if (err instanceof Error && (err as any).redirectToPricing) {
        if (typeof window !== 'undefined') {
          window.location.href = (err as any).redirectUrl || '/pricing';
        }
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Generate AI notes from existing transcript
  const generateNotesFromTranscript = async (transcriptId: string): Promise<Note | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcriptId }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Check if the error is related to insufficient credits
        if (response.status === 403 && result.error === 'Insufficient credits') {
          const error = new Error('Insufficient credits. Please purchase more credits to continue generating AI notes.');
          // Add redirection info to the error
          (error as any).redirectToPricing = true;
          (error as any).redirectUrl = result.redirectUrl || '/pricing';
          throw error;
        }
        throw new Error(result.message || 'Failed to generate notes');
      }

      if (!result.success) {
        throw new Error(result.message || 'Failed to generate notes');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      // Handle redirection for insufficient credits
      if (err instanceof Error && (err as any).redirectToPricing) {
        if (typeof window !== 'undefined') {
          window.location.href = (err as any).redirectUrl || '/pricing';
        }
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Generate focused AI notes from existing transcript
  const generateFocusedNotes = async (
    transcriptId: string,
    noteType: 'summary' | 'detailed' | 'action-items' | 'technical' | 'executive' = 'summary'
  ): Promise<Note | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notes/generate-focused', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcriptId, noteType }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Check if the error is related to insufficient credits
        if (response.status === 403 && result.error === 'Insufficient credits') {
          const error = new Error('Insufficient credits. Please purchase more credits to continue generating AI notes.');
          // Add redirection info to the error
          (error as any).redirectToPricing = true;
          (error as any).redirectUrl = result.redirectUrl || '/pricing';
          throw error;
        }
        throw new Error(result.message || 'Failed to generate focused notes');
      }

      if (!result.success) {
        throw new Error(result.message || 'Failed to generate focused notes');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      // Handle redirection for insufficient credits
      if (err instanceof Error && (err as any).redirectToPricing) {
        if (typeof window !== 'undefined') {
          window.location.href = (err as any).redirectUrl || '/pricing';
        }
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get all notes for the current user
  const getNotes = async (transcriptId?: string): Promise<Note[] | null> => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL('/api/notes', window.location.origin);
      if (transcriptId) {
        url.searchParams.append('transcriptId', transcriptId);
      }

      const response = await fetch(url.toString());
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch notes');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get a specific note by ID
  const getNote = async (id: string): Promise<Note | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/notes/${id}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch note');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create a new note
  const createNote = async (noteData: {
    title: string;
    content: string;
    transcriptId: string;
  }): Promise<Note | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to create note');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing note
  const updateNote = async (id: string, updates: {
    title?: string;
    content?: string;
  }): Promise<Note | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to update note');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete a note
  const deleteNote = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to delete note');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    processPDFWithNotes,
    generateNotesFromTranscript,
    generateFocusedNotes,
    getNotes,
    getNote,
    createNote,
    updateNote,
    deleteNote,
  };
}
