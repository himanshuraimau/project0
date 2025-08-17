import { useState } from 'react';
import type { 
  Note, 
  ProcessPDFResult, 
  ProcessPDFOptions, 
  NoteType, 
  CreateNoteRequest, 
  UpdateNoteRequest 
} from '@/lib/types';

export function useNotes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Process PDF and generate notes
  const processPDFWithNotes = async (
    file: File,
    options: ProcessPDFOptions = {}
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

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
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
        throw new Error(result.message || 'Failed to generate notes');
      }

      if (!result.success) {
        throw new Error(result.message || 'Failed to generate notes');
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

  // Generate focused AI notes from existing transcript
  const generateFocusedNotes = async (
    transcriptId: string,
    noteType: NoteType = 'summary'
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
        throw new Error(result.message || 'Failed to generate focused notes');
      }

      if (!result.success) {
        throw new Error(result.message || 'Failed to generate focused notes');
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

  // Generate AI notes from text input
  const generateNotesFromText = async (
    text: string,
    title: string = 'Text Note'
  ): Promise<ProcessPDFResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notes/generate-from-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, title }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to generate notes from text');
      }

      if (!result.success) {
        throw new Error(result.message || 'Failed to generate notes from text');
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
  const createNote = async (noteData: CreateNoteRequest): Promise<Note | null> => {
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
  const updateNote = async (id: string, updates: UpdateNoteRequest): Promise<Note | null> => {
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
    generateNotesFromText,
    getNotes,
    getNote,
    createNote,
    updateNote,
    deleteNote,
  };
}
