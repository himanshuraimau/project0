"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface NoteProgress {
  isCompleted: boolean;
  completedAt: string | null;
}

interface NoteProgressContextType {
  progress: NoteProgress;
  loading: boolean;
  updating: boolean;
  markAsComplete: () => Promise<void>;
  markAsIncomplete: () => Promise<void>;
  toggleCompletion: () => Promise<void>;
  refreshProgress: () => Promise<void>;
}

const NoteProgressContext = createContext<NoteProgressContextType | null>(null);

interface NoteProgressProviderProps {
  noteId: string;
  children: React.ReactNode;
}

export function NoteProgressProvider({ noteId, children }: NoteProgressProviderProps) {
  const [progress, setProgress] = useState<NoteProgress>({
    isCompleted: false,
    completedAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Fetch initial progress
  const fetchProgress = useCallback(async () => {
    if (!noteId) return;
    
    try {
      console.log('Fetching progress for note:', noteId);
      const response = await fetch(`/api/notes/${noteId}/progress`);
      if (response.ok) {
        const data = await response.json();
        console.log('Progress data received:', data);
        setProgress({
          isCompleted: data.isCompleted || false,
          completedAt: data.completedAt || null,
        });
      } else if (response.status === 404) {
        // Progress not found, use default values
        console.log('No progress found (404), using defaults');
        setProgress({
          isCompleted: false,
          completedAt: null,
        });
      }
    } catch (error) {
      console.error('Error fetching note progress:', error);
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Mark note as complete
  const markAsComplete = useCallback(async () => {
    if (!noteId) return;
    
    setUpdating(true);
    try {
      const response = await fetch(`/api/notes/${noteId}/progress`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setProgress({
          isCompleted: true,
          completedAt: data.completedAt,
        });
        toast.success('Note marked as completed!');
      } else {
        throw new Error('Failed to mark note as complete');
      }
    } catch (error) {
      console.error('Error marking note as complete:', error);
      toast.error('Failed to mark note as complete');
    } finally {
      setUpdating(false);
    }
  }, [noteId]);

  // Mark note as incomplete
  const markAsIncomplete = useCallback(async () => {
    if (!noteId) return;
    
    setUpdating(true);
    try {
      const response = await fetch(`/api/notes/${noteId}/progress`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProgress({
          isCompleted: false,
          completedAt: null,
        });
        toast.success('Note completion undone');
      } else {
        throw new Error('Failed to undo note completion');
      }
    } catch (error) {
      console.error('Error undoing note completion:', error);
      toast.error('Failed to undo note completion');
    } finally {
      setUpdating(false);
    }
  }, [noteId]);

  // Toggle completion status
  const toggleCompletion = useCallback(async () => {
    if (progress.isCompleted) {
      await markAsIncomplete();
    } else {
      await markAsComplete();
    }
  }, [progress.isCompleted, markAsComplete, markAsIncomplete]);

  // Refresh progress (for manual refresh)
  const refreshProgress = useCallback(async () => {
    setLoading(true);
    await fetchProgress();
  }, [fetchProgress]);

  const value: NoteProgressContextType = {
    progress,
    loading,
    updating,
    markAsComplete,
    markAsIncomplete,
    toggleCompletion,
    refreshProgress,
  };

  return (
    <NoteProgressContext.Provider value={value}>
      {children}
    </NoteProgressContext.Provider>
  );
}

export function useNoteProgressContext() {
  const context = useContext(NoteProgressContext);
  if (!context) {
    throw new Error('useNoteProgressContext must be used within a NoteProgressProvider');
  }
  return context;
}