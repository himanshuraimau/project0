import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface ChapterProgress {
  isCompleted: boolean;
  completedAt: string | null;
}

export function useChapterProgress(chapterId: string) {
  const [progress, setProgress] = useState<ChapterProgress>({
    isCompleted: false,
    completedAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Fetch initial progress
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch(`/api/chapter/${chapterId}/progress`);
        if (response.ok) {
          const data = await response.json();
          setProgress(data);
        }
      } catch (error) {
        console.error('Error fetching chapter progress:', error);
      } finally {
        setLoading(false);
      }
    };

    if (chapterId) {
      fetchProgress();
    }
  }, [chapterId]);

  // Mark chapter as complete
  const markAsComplete = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/chapter/${chapterId}/progress`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setProgress({
          isCompleted: data.chapter.isCompleted,
          completedAt: data.chapter.completedAt,
        });
        
        // Show course progress update if available
        if (data.course) {
          const { completedChapters, totalChapters, completionPercentage } = data.course;
          toast.success(
            `Chapter completed! Course progress: ${completedChapters}/${totalChapters} (${Math.round(completionPercentage)}%)`
          );
        } else {
          toast.success('Chapter marked as completed!');
        }
      } else {
        throw new Error('Failed to mark chapter as complete');
      }
    } catch (error) {
      console.error('Error marking chapter as complete:', error);
      toast.error('Failed to mark chapter as complete');
    } finally {
      setUpdating(false);
    }
  };

  // Mark chapter as incomplete
  const markAsIncomplete = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/chapter/${chapterId}/progress`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        setProgress({
          isCompleted: data.chapter.isCompleted,
          completedAt: data.chapter.completedAt,
        });
        
        // Show course progress update if available
        if (data.course) {
          const { completedChapters, totalChapters, completionPercentage } = data.course;
          toast.success(
            `Chapter unmarked. Course progress: ${completedChapters}/${totalChapters} (${Math.round(completionPercentage)}%)`
          );
        } else {
          toast.success('Chapter completion undone');
        }
      } else {
        throw new Error('Failed to undo chapter completion');
      }
    } catch (error) {
      console.error('Error undoing chapter completion:', error);
      toast.error('Failed to undo chapter completion');
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