import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CourseProgress, UseCourseProgressReturn } from '@/lib/types/course-progress.types';

export function useCourseProgress(courseId: string): UseCourseProgressReturn {
  const [progress, setProgress] = useState<CourseProgress>({
    isCompleted: false,
    completedAt: null,
    completedChapters: 0,
    totalChapters: 0,
    completionPercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Fetch initial progress
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch(`/api/course/${courseId}/progress`);
        if (response.ok) {
          const data = await response.json();
          setProgress({
            isCompleted: data.isCompleted,
            completedAt: data.completedAt,
            completedChapters: data.completedChapters || 0,
            totalChapters: data.totalChapters || 0,
            completionPercentage: data.completionPercentage || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching course progress:', error);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchProgress();
    }
  }, [courseId]);

  // Mark course as complete
  const markAsComplete = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/course/${courseId}/progress`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setProgress({
          isCompleted: data.isCompleted,
          completedAt: data.completedAt,
          completedChapters: data.completedChapters || 0,
          totalChapters: data.totalChapters || 0,
          completionPercentage: data.completionPercentage || 0,
        });
        toast.success('Course marked as completed!');
      } else {
        throw new Error('Failed to mark course as complete');
      }
    } catch (error) {
      console.error('Error marking course as complete:', error);
      toast.error('Failed to mark course as complete');
    } finally {
      setUpdating(false);
    }
  };

  // Mark course as incomplete
  const markAsIncomplete = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/course/${courseId}/progress`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        setProgress({
          isCompleted: data.isCompleted,
          completedAt: data.completedAt,
          completedChapters: data.completedChapters || 0,
          totalChapters: data.totalChapters || 0,
          completionPercentage: data.completionPercentage || 0,
        });
        toast.success('Course completion undone');
      } else {
        throw new Error('Failed to undo course completion');
      }
    } catch (error) {
      console.error('Error undoing course completion:', error);
      toast.error('Failed to undo course completion');
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