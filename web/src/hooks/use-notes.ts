import { useState, useCallback } from 'react';
import { useUpgradeModal } from '@/contexts/upgrade-modal-context';
import { uploadWithProgress } from '@/lib/utils/upload-with-progress';
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
  const { openUpgradeModal } = useUpgradeModal();

  // Process PDF and generate notes
  // Uses S3 upload to bypass Vercel's ~4.5MB body size limit for serverless functions.
  // Flow: get presigned URL → upload to S3 → send S3 URL to process endpoint.
  // Falls back to direct FormData upload if S3 is not configured.
  const processPDFWithNotes = async (
    file: File,
    options: ProcessPDFOptions = {}
  ): Promise<ProcessPDFResult | null> => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Try to get presigned S3 URLs (avoids Vercel body size limit)
      const urlRes = await fetch('/api/pdf/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || 'application/pdf',
          fileSize: file.size,
        }),
      });

      // If S3 is configured, use the S3 upload flow
      if (urlRes.ok) {
        const { uploadUrl, downloadUrl } = await urlRes.json();
        const contentType = file.type || 'application/pdf';

        // Step 2: Upload file directly to S3 (with optional progress)
        const putRes = options.onUploadProgress
          ? await uploadWithProgress(uploadUrl, file, contentType, options.onUploadProgress)
          : await fetch(uploadUrl, {
              method: 'PUT',
              body: file,
              headers: { 'Content-Type': contentType },
            });

        if (!putRes.ok) {
          throw new Error('Failed to upload file to storage');
        }

        options.onUploadComplete?.();

        // Step 3: Ask API to process the PDF from the S3 URL (small JSON body)
        const response = await fetch('/api/pdf/process-from-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pdfUrl: downloadUrl,
            fileName: file.name,
            generateNotes: options.generateNotes ?? true,
            folderId: options.folderId ?? null,
            progressJobId: options.progressJobId ?? null,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          if (response.status === 403 && result.error === 'FREE_TIER_LIMIT_REACHED') {
            openUpgradeModal();
            throw new Error(result.message || 'Free tier limit reached');
          }
          if (response.status === 402) {
            throw new Error('INSUFFICIENT_CREDITS');
          }
          throw new Error(result.message || 'Failed to process PDF');
        }

        return result.data;
      }

      // Fallback: S3 not configured (503) or other non-critical error — use direct upload
      // This will still work for small files under Vercel's limit
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

      if (options.progressJobId) {
        formData.append('progressJobId', options.progressJobId);
      }

      options.onUploadComplete?.();

      const response = await fetch('/api/pdf/process', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        // Check for free tier limit
        if (response.status === 403 && result.error === 'FREE_TIER_LIMIT_REACHED') {
          openUpgradeModal();
          throw new Error(result.message || 'Free tier limit reached');
        }
        if (response.status === 402) {
          throw new Error('INSUFFICIENT_CREDITS');
        }
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
        // Check for free tier limit
        if (response.status === 403 && result.error === 'FREE_TIER_LIMIT_REACHED') {
          openUpgradeModal();
          throw new Error(result.message || 'Free tier limit reached');
        }
        if (response.status === 402) {
          throw new Error('INSUFFICIENT_CREDITS');
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
        // Check for free tier limit
        if (response.status === 403 && result.error === 'FREE_TIER_LIMIT_REACHED') {
          openUpgradeModal();
          throw new Error(result.message || 'Free tier limit reached');
        }
        if (response.status === 402) {
          throw new Error('INSUFFICIENT_CREDITS');
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
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Generate AI notes from text input
  const generateNotesFromText = async (
    text: string,
    title: string = 'Text Note',
    folderId?: string | null,
    progressJobId?: string
  ): Promise<ProcessPDFResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notes/generate-from-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, title, folderId, progressJobId }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Check for free tier limit
        if (response.status === 403 && result.error === 'FREE_TIER_LIMIT_REACHED') {
          openUpgradeModal();
          throw new Error(result.message || 'Free tier limit reached');
        }
        if (response.status === 402) {
          throw new Error('INSUFFICIENT_CREDITS');
        }
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
  const getNotes = useCallback(async (transcriptId?: string): Promise<Note[] | null> => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL('/api/notes', window.location.origin);
      if (transcriptId) {
        url.searchParams.append('transcriptId', transcriptId);
      }

      const response = await fetch(url.toString());
      const result = await response.json();

      if (!response.ok) {
        // Handle different error types based on status code
        if (response.status === 503) {
          throw new Error('The notes service is temporarily unavailable. Please try again later or contact support if this persists.');
        } else if (response.status === 401) {
          throw new Error('Please log in to view your notes.');
        } else if (response.status === 404) {
          throw new Error('The requested notes were not found.');
        } else {
          throw new Error(result.message || `Server error (${response.status}). Please try again.`);
        }
      }

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch notes');
      }

      return result.data;
    } catch (err) {
      // Provide more specific error messages
      let errorMessage = 'Unknown error';
      
      if (err instanceof TypeError && err.message.includes('fetch')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

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
        // Check for free tier limit
        if (response.status === 403 && result.error === 'FREE_TIER_LIMIT_REACHED') {
          openUpgradeModal();
          throw new Error(result.message || 'Free tier limit reached');
        }
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
