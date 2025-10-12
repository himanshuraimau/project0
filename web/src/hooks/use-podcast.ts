/**
 * Podcast Data Management Hook
 * Provides CRUD operations, state management, loading states, error handling, and data caching
 * Requirements: 1.5, 4.1, 6.1
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { 
  Podcast, 
  PodcastGenerationOptions, 
  PodcastGenerationResponse,
  PodcastStatus 
} from '../lib/types/podcast';
import { 
  displayPodcastError, 
  classifyPodcastError 
} from '../lib/utils/podcast-error-handler';
import { PodcastErrorInfo } from '../lib/types/podcast-error.types';

// Cache interface for storing podcast data
interface PodcastCache {
  [key: string]: {
    data: Podcast[];
    timestamp: number;
    noteId: string;
  };
}

// Hook state interface
interface UsePodcastState {
  podcasts: Podcast[];
  currentPodcast: Podcast | null;
  loading: boolean;
  error: string | null;
  errorInfo: PodcastErrorInfo | null;
  generating: boolean;
  progress: number;
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Polling interval for status updates (10 seconds)
const POLLING_INTERVAL = 10 * 1000;

export function usePodcast(noteId?: string) {
  // State management
  const [state, setState] = useState<UsePodcastState>({
    podcasts: [],
    currentPodcast: null,
    loading: false,
    error: null,
    errorInfo: null,
    generating: false,
    progress: 0,
  });

  // Cache and polling refs
  const cacheRef = useRef<PodcastCache>({});
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper function to update state
  const updateState = useCallback((updates: Partial<UsePodcastState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Helper function to handle errors with enhanced classification
  const handleError = useCallback((error: unknown, defaultMessage: string, context?: any) => {
    const errorInfo = classifyPodcastError(error, context);
    const errorMessage = errorInfo.userMessage || defaultMessage;
    
    updateState({ 
      error: errorMessage, 
      errorInfo,
      loading: false, 
      generating: false 
    });
    
    console.error('Podcast hook error:', {
      type: errorInfo.type,
      message: errorInfo.message,
      userMessage: errorInfo.userMessage,
      statusCode: errorInfo.statusCode,
      retryable: errorInfo.retryable,
      errorId: errorInfo.errorId,
      context,
      originalError: error instanceof Error ? error.message : String(error)
    });
    
    return errorMessage;
  }, [updateState]);

  // Cache management
  const getCachedPodcasts = useCallback((noteId: string): Podcast[] | null => {
    const cached = cacheRef.current[noteId];
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
    if (isExpired) {
      delete cacheRef.current[noteId];
      return null;
    }
    
    return cached.data;
  }, []);

  const setCachedPodcasts = useCallback((noteId: string, podcasts: Podcast[]) => {
    cacheRef.current[noteId] = {
      data: podcasts,
      timestamp: Date.now(),
      noteId,
    };
  }, []);

  // Clear cache for a specific note
  const clearCache = useCallback((noteId?: string) => {
    if (noteId) {
      delete cacheRef.current[noteId];
    } else {
      cacheRef.current = {};
    }
  }, []);

  // Start polling for status updates
  const startPolling = useCallback((podcastId: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/podcast/${podcastId}`, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch podcast status');
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          const podcast = result.data as Podcast;
          
          // Update current podcast
          updateState({ 
            currentPodcast: podcast,
            progress: podcast.progress || 0,
            generating: podcast.status === 'GENERATING' || podcast.status === 'IN_PROGRESS',
          });

          // Update podcasts list if noteId matches
          if (noteId && podcast.noteId === noteId) {
            setState(prev => {
              const updatedPodcasts = prev.podcasts.map(p => 
                p.id === podcast.id ? podcast : p
              );
              
              // Update cache
              setCachedPodcasts(noteId, updatedPodcasts);
              
              return {
                ...prev,
                podcasts: updatedPodcasts,
              };
            });
          }

          // Stop polling if completed or failed
          if (podcast.status === 'COMPLETED' || podcast.status === 'FAILED') {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            updateState({ generating: false });
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        // Don't update error state for polling failures to avoid UI disruption
      }
    }, POLLING_INTERVAL);
  }, [noteId, updateState, setCachedPodcasts]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Generate a new podcast
  const generatePodcast = useCallback(async (
    targetNoteId: string,
    options: PodcastGenerationOptions
  ): Promise<Podcast | null> => {
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    updateState({ 
      loading: true, 
      generating: true, 
      error: null, 
      progress: 0 
    });

    try {
      const response = await fetch('/api/podcast/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          noteId: targetNoteId,
          ...options,
        }),
        signal: abortControllerRef.current.signal,
      });

      const result: PodcastGenerationResponse = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          throw new Error('INSUFFICIENT_CREDITS');
        }
        throw new Error(result.error || 'Failed to generate podcast');
      }

      if (!result.success || !result.podcast) {
        throw new Error(result.error || 'Failed to generate podcast');
      }

      const newPodcast = result.podcast;
      
      // Update state
      updateState({
        currentPodcast: newPodcast,
        loading: false,
        progress: newPodcast.progress || 10,
      });

      // Update podcasts list and cache
      if (noteId === targetNoteId) {
        setState(prev => {
          const updatedPodcasts = [newPodcast, ...prev.podcasts];
          setCachedPodcasts(targetNoteId, updatedPodcasts);
          return {
            ...prev,
            podcasts: updatedPodcasts,
          };
        });
      }

      // Start polling for status updates
      startPolling(newPodcast.id);

      return newPodcast;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return null; // Request was cancelled
      }
      handleError(error, 'Failed to generate podcast', {
        operation: 'generate',
        noteId: targetNoteId,
        timestamp: new Date()
      });
      return null;
    }
  }, [noteId, updateState, handleError, setCachedPodcasts, startPolling]);

  // Get podcasts for a note with enhanced multiple podcast handling
  const getPodcastsByNote = useCallback(async (
    targetNoteId: string,
    forceRefresh: boolean = false,
    includeSuperseded: boolean = false
  ): Promise<Podcast[]> => {
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cached = getCachedPodcasts(targetNoteId);
      if (cached) {
        // Filter superseded if not requested
        const filteredPodcasts = includeSuperseded 
          ? cached 
          : cached.filter(p => p.status !== 'SUPERSEDED');
        updateState({ podcasts: filteredPodcasts, loading: false, error: null });
        return filteredPodcasts;
      }
    }

    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    updateState({ loading: true, error: null });

    try {
      const url = `/api/podcast/note/${targetNoteId}${includeSuperseded ? '?includeSuperseded=true' : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No podcasts found, return empty array
          const emptyResult: Podcast[] = [];
          updateState({ podcasts: emptyResult, loading: false });
          setCachedPodcasts(targetNoteId, emptyResult);
          return emptyResult;
        }
        throw new Error(`Failed to fetch podcasts: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch podcasts');
      }

      const responseData = result.data;
      const podcasts = responseData.podcasts as Podcast[];
      
      // Update state and cache with full podcast list
      updateState({ 
        podcasts, 
        loading: false,
        // Set current podcast to the latest available
        currentPodcast: responseData.latest?.completed || responseData.latest?.inProgress || null
      });
      setCachedPodcasts(targetNoteId, podcasts);

      // Find any podcasts that are still generating and start polling
      const generatingPodcasts = podcasts.filter(p => 
        p.status === 'GENERATING' || p.status === 'IN_PROGRESS'
      );
      
      if (generatingPodcasts.length > 0) {
        updateState({ generating: true });
        // Start polling for the most recent generating podcast
        startPolling(generatingPodcasts[0].id);
      }

      return podcasts;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return []; // Request was cancelled
      }
      handleError(error, 'Failed to fetch podcasts', {
        operation: 'fetch',
        noteId: targetNoteId,
        timestamp: new Date()
      });
      return [];
    }
  }, [getCachedPodcasts, updateState, handleError, setCachedPodcasts, startPolling]);

  // Get a specific podcast by ID
  const getPodcast = useCallback(async (podcastId: string): Promise<Podcast | null> => {
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    updateState({ loading: true, error: null });

    try {
      const response = await fetch(`/api/podcast/${podcastId}`, {
        method: 'GET',
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Podcast not found');
        }
        throw new Error(`Failed to fetch podcast: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch podcast');
      }

      const podcast = result.data as Podcast;
      
      updateState({ 
        currentPodcast: podcast, 
        loading: false,
        progress: podcast.progress || 0,
        generating: podcast.status === 'GENERATING' || podcast.status === 'IN_PROGRESS',
      });

      // Start polling if still generating
      if (podcast.status === 'GENERATING' || podcast.status === 'IN_PROGRESS') {
        startPolling(podcast.id);
      }

      return podcast;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return null; // Request was cancelled
      }
      handleError(error, 'Failed to fetch podcast', {
        operation: 'fetch',
        podcastId,
        timestamp: new Date()
      });
      return null;
    }
  }, [updateState, handleError, startPolling]);

  // Delete a podcast
  const deletePodcast = useCallback(async (podcastId: string): Promise<boolean> => {
    updateState({ loading: true, error: null });

    try {
      const response = await fetch(`/api/podcast/${podcastId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete podcast: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete podcast');
      }

      // Update state - remove from podcasts list
      setState(prev => {
        const updatedPodcasts = prev.podcasts.filter(p => p.id !== podcastId);
        
        // Update cache if noteId is available
        if (noteId) {
          setCachedPodcasts(noteId, updatedPodcasts);
        }

        // Stop polling if this was the podcast being polled
        if (prev.currentPodcast?.id === podcastId) {
          stopPolling();
        }

        return {
          ...prev,
          podcasts: updatedPodcasts,
          currentPodcast: prev.currentPodcast?.id === podcastId ? null : prev.currentPodcast,
          loading: false,
        };
      });

      return true;
    } catch (error) {
      handleError(error, 'Failed to delete podcast', {
        operation: 'delete',
        podcastId,
        timestamp: new Date()
      });
      return false;
    }
  }, [noteId, updateState, handleError, setCachedPodcasts, stopPolling]);

  // Regenerate a podcast
  const regeneratePodcast = useCallback(async (
    podcastId: string,
    options: PodcastGenerationOptions
  ): Promise<Podcast | null> => {
    updateState({ loading: true, generating: true, error: null, progress: 0 });

    try {
      // First get the existing podcast to get the noteId
      const existingPodcast = await getPodcast(podcastId);
      if (!existingPodcast) {
        throw new Error('Podcast not found');
      }

      // Generate new podcast with the same noteId
      return await generatePodcast(existingPodcast.noteId, options);
    } catch (error) {
      handleError(error, 'Failed to regenerate podcast', {
        operation: 'regenerate',
        podcastId,
        timestamp: new Date()
      });
      return null;
    }
  }, [updateState, handleError, getPodcast, generatePodcast]);

  // Get the latest podcast for the current note
  const getLatestPodcast = useCallback(async (): Promise<Podcast | null> => {
    if (!noteId) {
      return null;
    }

    const podcasts = await getPodcastsByNote(noteId);
    
    // Find the most recent successful or in-progress podcast
    const latestPodcast = podcasts.find(p => 
      p.status === 'COMPLETED' || p.status === 'IN_PROGRESS' || p.status === 'GENERATING'
    );

    if (latestPodcast) {
      updateState({ currentPodcast: latestPodcast });
    }

    return latestPodcast || null;
  }, [noteId, getPodcastsByNote, updateState]);

  // Get podcast history with categorization
  const getPodcastHistory = useCallback(async (
    targetNoteId?: string,
    includeSuperseded: boolean = false
  ): Promise<{
    podcasts: Podcast[];
    latest: Podcast | null;
    inProgress: Podcast | null;
    completed: Podcast[];
    failed: Podcast[];
    superseded: Podcast[];
  }> => {
    const noteIdToUse = targetNoteId || noteId;
    if (!noteIdToUse) {
      return {
        podcasts: [],
        latest: null,
        inProgress: null,
        completed: [],
        failed: [],
        superseded: [],
      };
    }

    try {
      const podcasts = await getPodcastsByNote(noteIdToUse, false, includeSuperseded);
      
      // Categorize podcasts
      const completed = podcasts.filter(p => p.status === 'COMPLETED');
      const inProgress = podcasts.find(p => 
        p.status === 'GENERATING' || p.status === 'IN_PROGRESS'
      ) || null;
      const failed = podcasts.filter(p => p.status === 'FAILED');
      const superseded = podcasts.filter(p => p.status === 'SUPERSEDED');
      
      // Get the latest successful or in-progress podcast
      const latest = inProgress || completed[0] || null;

      return {
        podcasts,
        latest,
        inProgress,
        completed,
        failed,
        superseded,
      };
    } catch (error) {
      handleError(error, 'Failed to get podcast history', {
        operation: 'history',
        noteId: noteIdToUse,
        timestamp: new Date()
      });
      return {
        podcasts: [],
        latest: null,
        inProgress: null,
        completed: [],
        failed: [],
        superseded: [],
      };
    }
  }, [noteId, getPodcastsByNote, handleError]);

  // Get the most recent successful podcast (completed only)
  const getLatestCompletedPodcast = useCallback(async (
    targetNoteId?: string
  ): Promise<Podcast | null> => {
    const history = await getPodcastHistory(targetNoteId, false);
    return history.completed[0] || null;
  }, [getPodcastHistory]);

  // Check if there are multiple podcasts for the current note
  const hasMultiplePodcasts = useCallback((): boolean => {
    return state.podcasts.length > 1;
  }, [state.podcasts.length]);

  // Get superseded podcasts count
  const getSupersededCount = useCallback(async (
    targetNoteId?: string
  ): Promise<number> => {
    const history = await getPodcastHistory(targetNoteId, true);
    return history.superseded.length;
  }, [getPodcastHistory]);

  // Refresh podcasts data
  const refreshPodcasts = useCallback(async (): Promise<void> => {
    if (!noteId) return;
    
    clearCache(noteId);
    await getPodcastsByNote(noteId, true);
  }, [noteId, clearCache, getPodcastsByNote]);

  // Cancel any ongoing operations
  const cancelOperations = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    stopPolling();
    updateState({ loading: false, generating: false });
  }, [stopPolling, updateState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelOperations();
    };
  }, [cancelOperations]);

  // Auto-load podcasts when noteId changes
  useEffect(() => {
    if (noteId) {
      // Create a stable function that doesn't depend on state
      const loadPodcasts = async () => {
        // Check cache first
        const cached = getCachedPodcasts(noteId);
        if (cached) {
          updateState({ podcasts: cached, loading: false, error: null });
          return;
        }

        // Load from API
        updateState({ loading: true, error: null });

        try {
          const response = await fetch(`/api/podcast/note/${noteId}`, {
            method: 'GET',
          });

          if (!response.ok) {
            if (response.status === 404) {
              const emptyResult: Podcast[] = [];
              updateState({ podcasts: emptyResult, loading: false });
              setCachedPodcasts(noteId, emptyResult);
              return;
            }
            throw new Error(`Failed to fetch podcasts: ${response.status}`);
          }

          const result = await response.json();
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to fetch podcasts');
          }

          const responseData = result.data;
          const podcasts = responseData.podcasts as Podcast[];
          
          updateState({ 
            podcasts, 
            loading: false,
            currentPodcast: responseData.latest?.completed || responseData.latest?.inProgress || null
          });
          setCachedPodcasts(noteId, podcasts);

          // Find any podcasts that are still generating and start polling
          const generatingPodcasts = podcasts.filter(p => 
            p.status === 'GENERATING' || p.status === 'IN_PROGRESS'
          );
          
          if (generatingPodcasts.length > 0) {
            updateState({ generating: true });
            startPolling(generatingPodcasts[0].id);
          }
        } catch (error) {
          handleError(error, 'Failed to fetch podcasts', {
            operation: 'fetch',
            noteId,
            timestamp: new Date()
          });
        }
      };

      loadPodcasts();
    }
  }, [noteId, getCachedPodcasts, updateState, setCachedPodcasts, startPolling, handleError]); // Include all dependencies

  return {
    // State
    podcasts: state.podcasts,
    currentPodcast: state.currentPodcast,
    loading: state.loading,
    error: state.error,
    errorInfo: state.errorInfo,
    generating: state.generating,
    progress: state.progress,

    // Actions
    generatePodcast,
    getPodcastsByNote,
    getPodcast,
    deletePodcast,
    regeneratePodcast,
    getLatestPodcast,
    refreshPodcasts,
    cancelOperations,

    // Multiple podcast handling
    getPodcastHistory,
    getLatestCompletedPodcast,
    hasMultiplePodcasts,
    getSupersededCount,

    // Utilities
    clearCache,
    isGenerating: state.generating,
    hasError: !!state.error,
    isEmpty: state.podcasts.length === 0 && !state.loading,
  };
}

// Export hook type for external use
export type UsePodcastReturn = ReturnType<typeof usePodcast>;