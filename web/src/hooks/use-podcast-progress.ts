/**
 * React hook for tracking podcast generation progress
 * Provides real-time updates and state management
 * Requirements: 2.8, 4.1, 4.2, 4.3
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  PodcastGenerationProgress, 
  podcastProgressTracker 
} from '@/lib/utils/podcast-progress-tracker';

interface UsePodcastProgressOptions {
  pollingInterval?: number; // milliseconds
  autoCleanup?: boolean;
  onComplete?: (progress: PodcastGenerationProgress) => void;
  onError?: (progress: PodcastGenerationProgress) => void;
}

interface UsePodcastProgressReturn {
  progress: PodcastGenerationProgress | null;
  isLoading: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  error: string | null;
  startTracking: (podcastId: string) => void;
  stopTracking: () => void;
  retry: () => void;
}

/**
 * Hook for tracking podcast generation progress with real-time updates
 */
export function usePodcastProgress(
  initialPodcastId?: string,
  options: UsePodcastProgressOptions = {}
): UsePodcastProgressReturn {
  const {
    pollingInterval = 2000, // 2 seconds
    autoCleanup = true,
    onComplete,
    onError
  } = options;

  const [progress, setProgress] = useState<PodcastGenerationProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPodcastId, setCurrentPodcastId] = useState<string | null>(initialPodcastId || null);
  
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const callbacksRef = useRef({ onComplete, onError });

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = { onComplete, onError };
  }, [onComplete, onError]);

  // Handle progress updates
  const handleProgressUpdate = useCallback((newProgress: PodcastGenerationProgress) => {
    setProgress(newProgress);
    setIsLoading(!['completed', 'failed'].includes(newProgress.stage));

    // Call appropriate callbacks
    if (newProgress.stage === 'completed' && callbacksRef.current.onComplete) {
      callbacksRef.current.onComplete(newProgress);
    } else if (newProgress.stage === 'failed' && callbacksRef.current.onError) {
      callbacksRef.current.onError(newProgress);
    }
  }, []);

  // Start tracking progress for a podcast
  const startTracking = useCallback((podcastId: string) => {
    // Clean up existing tracking
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    setCurrentPodcastId(podcastId);
    
    // Get initial progress
    const initialProgress = podcastProgressTracker.getProgress(podcastId);
    if (initialProgress) {
      handleProgressUpdate(initialProgress);
    } else {
      setIsLoading(true);
      setProgress(null);
    }

    // Subscribe to real-time updates
    unsubscribeRef.current = podcastProgressTracker.subscribe(podcastId, handleProgressUpdate);

    // Set up polling as fallback for real-time updates
    pollingRef.current = setInterval(async () => {
      try {
        // Poll the API for progress updates
        const response = await fetch(`/api/podcasts/${podcastId}/progress`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.progress) {
            // Update local progress tracker
            podcastProgressTracker.updateProgress(
              podcastId,
              data.progress.stage,
              data.progress.stageProgress || 0,
              data.progress.message
            );
          }
        }
      } catch (error) {
        console.warn('Failed to poll progress:', error);
      }
    }, pollingInterval);

  }, [handleProgressUpdate, pollingInterval]);

  // Stop tracking progress
  const stopTracking = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    
    if (autoCleanup && currentPodcastId) {
      podcastProgressTracker.cleanupProgress(currentPodcastId);
    }
    
    setCurrentPodcastId(null);
    setProgress(null);
    setIsLoading(false);
  }, [autoCleanup, currentPodcastId]);

  // Retry failed generation
  const retry = useCallback(async () => {
    if (!currentPodcastId || !progress) return;

    try {
      setIsLoading(true);
      
      // Call retry API endpoint
      const response = await fetch(`/api/podcasts/${currentPodcastId}/retry`, {
        method: 'POST'
      });

      if (response.ok) {
        // Reset progress tracking
        podcastProgressTracker.initializeProgress(currentPodcastId);
      } else {
        const errorData = await response.json();
        console.error('Retry failed:', errorData);
      }
    } catch (error) {
      console.error('Retry request failed:', error);
      setIsLoading(false);
    }
  }, [currentPodcastId, progress]);

  // Start tracking on mount if initial podcast ID provided
  useEffect(() => {
    if (initialPodcastId) {
      startTracking(initialPodcastId);
    }
  }, [initialPodcastId, startTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  // Derived state
  const isCompleted = progress?.stage === 'completed';
  const isFailed = progress?.stage === 'failed';
  const error = progress?.error || null;

  return {
    progress,
    isLoading,
    isCompleted,
    isFailed,
    error,
    startTracking,
    stopTracking,
    retry
  };
}

/**
 * Hook for tracking multiple podcast generations
 */
export function useMultiplePodcastProgress(podcastIds: string[]) {
  const [progressMap, setProgressMap] = useState<Map<string, PodcastGenerationProgress>>(new Map());
  const [loadingSet, setLoadingSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    podcastIds.forEach(podcastId => {
      const unsubscribe = podcastProgressTracker.subscribe(podcastId, (progress) => {
        setProgressMap(prev => new Map(prev.set(podcastId, progress)));
        setLoadingSet(prev => {
          const newSet = new Set(prev);
          if (['completed', 'failed'].includes(progress.stage)) {
            newSet.delete(podcastId);
          } else {
            newSet.add(podcastId);
          }
          return newSet;
        });
      });

      unsubscribers.push(unsubscribe);

      // Get initial progress
      const initialProgress = podcastProgressTracker.getProgress(podcastId);
      if (initialProgress) {
        setProgressMap(prev => new Map(prev.set(podcastId, initialProgress)));
        if (!['completed', 'failed'].includes(initialProgress.stage)) {
          setLoadingSet(prev => new Set(prev.add(podcastId)));
        }
      }
    });

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [podcastIds]);

  return {
    progressMap,
    loadingSet,
    isAnyLoading: loadingSet.size > 0,
    getProgress: (podcastId: string) => progressMap.get(podcastId) || null,
    isLoading: (podcastId: string) => loadingSet.has(podcastId)
  };
}

/**
 * Hook for simple loading state without detailed progress
 */
export function usePodcastLoading(podcastId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const setLoadingError = useCallback((errorMessage: string) => {
    setIsLoading(false);
    setError(errorMessage);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setError: setLoadingError,
    clearError
  };
}