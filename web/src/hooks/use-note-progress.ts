import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface NoteProgress {
  isCompleted: boolean;
  completedAt: string | null;
}

export function useNoteProgress(noteId: string) {
  const [progress, setProgress] = useState<NoteProgress>({
    isCompleted: false,
    completedAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Fetch initial progress
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch(`/api/notes/${noteId}/progress`);
        if (response.ok) {
          const data = await response.json();
          setProgress({
            isCompleted: data.isCompleted || false,
            completedAt: data.completedAt || null,
          });
        } else if (response.status === 404) {
          // Progress not found, use default values
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
    };

    if (noteId) {
      fetchProgress();
    }
  }, [noteId]);

  // Mark note as complete
  const markAsComplete = async () => {
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
  };

  // Mark note as incomplete
  const markAsIncomplete = async () => {
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
  };

  // Toggle completion status
  const toggleCompletion = async () => {
    if (progress.isCompleted) {
      await markAsIncomplete();
    } else {
      await markAsComplete();
    }
  };

  return {
    progress,
    loading,
    updating,
    markAsComplete,
    markAsIncomplete,
    toggleCompletion,
  };
}