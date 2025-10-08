"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface ChapterProgress {
  [chapterId: string]: {
    isCompleted: boolean;
    completedAt: string | null;
  };
}

interface UnitProgress {
  [unitId: string]: {
    completedChapters: number;
    totalChapters: number;
    progressPercentage: number;
  };
}

interface CourseProgressContextType {
  chapterProgress: ChapterProgress;
  unitProgress: UnitProgress;
  refreshProgress: () => Promise<void>;
  updateChapterProgress: (chapterId: string, isCompleted: boolean) => void;
}

const CourseProgressContext = createContext<CourseProgressContextType | undefined>(undefined);

interface CourseProgressProviderProps {
  children: React.ReactNode;
  courseId: string;
  initialProgress?: {
    chapters: ChapterProgress;
    units: UnitProgress;
  };
}

export function CourseProgressProvider({ 
  children, 
  courseId,
  initialProgress 
}: CourseProgressProviderProps) {
  const [chapterProgress, setChapterProgress] = useState<ChapterProgress>(
    initialProgress?.chapters || {}
  );
  const [unitProgress, setUnitProgress] = useState<UnitProgress>(
    initialProgress?.units || {}
  );

  const refreshProgress = useCallback(async () => {
    try {
      const response = await fetch(`/api/course/${courseId}/progress?detailed=true`);
      if (response.ok) {
        const data = await response.json();
        setChapterProgress(data.chapters || {});
        setUnitProgress(data.units || {});
      }
    } catch (error) {
      console.error('Error refreshing course progress:', error);
    }
  }, [courseId]);

  const updateChapterProgress = useCallback((chapterId: string, isCompleted: boolean) => {
    setChapterProgress(prev => ({
      ...prev,
      [chapterId]: {
        isCompleted,
        completedAt: isCompleted ? new Date().toISOString() : null,
      },
    }));
  }, []);

  // Initial fetch if no initial data provided
  useEffect(() => {
    if (!initialProgress) {
      refreshProgress();
    }
  }, [courseId, initialProgress, refreshProgress]);

  return (
    <CourseProgressContext.Provider
      value={{
        chapterProgress,
        unitProgress,
        refreshProgress,
        updateChapterProgress,
      }}
    >
      {children}
    </CourseProgressContext.Provider>
  );
}

export function useCourseProgress() {
  const context = useContext(CourseProgressContext);
  if (!context) {
    // Return a default implementation if context is not available
    return {
      chapterProgress: {},
      unitProgress: {},
      refreshProgress: async () => {},
      updateChapterProgress: () => {},
    };
  }
  return context;
}
