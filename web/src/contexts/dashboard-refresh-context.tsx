"use client";

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';

interface LoadingNote {
  id: string;
  type: 'pdf' | 'audio' | 'audio-record' | 'youtube' | 'webpage';
  timestamp: number;
  progress?: number;      // Latest known progress percentage (0-100)
  message?: string;       // Latest progress/status message
  lastProgressAt?: number; // Last time we received a progress update
  transcriptId?: string;  // Link to actual transcript 
  noteId?: string;        // Link to generated note in DB
  stage: 'uploading' | 'processing' | 'generating' | 'completed' | 'error';
  error?: string;         // Error message if stage is 'error'
  retryCount?: number;    // Number of retry attempts
}

interface DashboardRefreshContextType {
  refreshNotes: () => void;
  isRefreshing: boolean;
  setRefreshHandler: (handler: () => Promise<void>) => void;
  addLoadingNote: (tempId: string, type: 'pdf' | 'audio' | 'audio-record' | 'youtube' | 'webpage', stage?: LoadingNote['stage']) => void;
  updateLoadingNote: (tempId: string, updates: Partial<LoadingNote>) => void;
  removeLoadingNote: (tempId: string) => void;
  loadingNotes: LoadingNote[];
  clearAllLoadingNotes: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  folderSearchQuery: string;
  setFolderSearchQuery: (query: string) => void;
  clonedSearchQuery: string;
  setClonedSearchQuery: (query: string) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const DashboardRefreshContext = createContext<DashboardRefreshContextType | null>(null);

const LOADING_NOTES_KEY = 'dashboard_loading_notes';

export function DashboardRefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshHandler, setRefreshHandler] = useState<(() => Promise<void>) | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState<LoadingNote[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [folderSearchQuery, setFolderSearchQuery] = useState("");
  const [clonedSearchQuery, setClonedSearchQuery] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load loading notes from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LOADING_NOTES_KEY);
        if (stored) {
          const parsedNotes = JSON.parse(stored);
          const now = Date.now();
          const oneHourAgo = now - (60 * 60 * 1000);
          const fiveMinutesAgo = now - (5 * 60 * 1000);
          const tenMinutesAgo = now - (10 * 60 * 1000);
          
          // Filter out:
          // - Notes older than 1 hour
          // - Notes in "completed" stage (stale - these should have been removed already)
          // - Notes that have been "generating" for more than 10 minutes (likely completed/failed)
          // - Error notes older than 5 minutes (user had time to see them)
          const validNotes = parsedNotes.filter((note: LoadingNote) => {
            const activityTimestamp = note.lastProgressAt ?? note.timestamp;

            if (note.timestamp < oneHourAgo) {
              console.log('[DashboardRefresh] Filtering out old note (>1hr):', note.id);
              return false;
            }
            if (note.stage === 'completed') {
              console.log('[DashboardRefresh] Filtering out completed note:', note.id);
              return false;
            }
            // Remove notes stuck in generating/processing for >10 minutes
            if ((note.stage === 'generating' || note.stage === 'processing' || note.stage === 'uploading') && activityTimestamp < tenMinutesAgo) {
              console.log('[DashboardRefresh] Filtering out stale generating note (>10min):', note.id);
              return false;
            }
            if (note.stage === 'error' && activityTimestamp < fiveMinutesAgo) {
              console.log('[DashboardRefresh] Filtering out old error note:', note.id);
              return false;
            }
            return true;
          });
          
          if (validNotes.length > 0) {
            console.log('[DashboardRefresh] Restored loading notes from localStorage:', validNotes.length);
            setLoadingNotes(validNotes);
          } else {
            // Clean up stale localStorage entry
            console.log('[DashboardRefresh] No valid notes to restore, clearing localStorage');
            localStorage.removeItem(LOADING_NOTES_KEY);
          }
        }
      } catch (error) {
        console.error('Failed to restore loading notes:', error);
      }
    }
  }, []);

  // Save loading notes to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && loadingNotes.length > 0) {
      try {
        localStorage.setItem(LOADING_NOTES_KEY, JSON.stringify(loadingNotes));
      } catch (error) {
        console.error('Failed to save loading notes:', error);
      }
    } else if (typeof window !== 'undefined' && loadingNotes.length === 0) {
      localStorage.removeItem(LOADING_NOTES_KEY);
    }
  }, [loadingNotes]);

  const addLoadingNote = useCallback((tempId: string, type: 'pdf' | 'audio' | 'audio-record' | 'youtube' | 'webpage', stage: LoadingNote['stage'] = 'uploading') => {
    const now = Date.now();
    setLoadingNotes(prev => {
      // Check if note already exists to prevent duplicates
      const exists = prev.some(note => note.id === tempId);
      if (exists) {
        return prev;
      }
      return [
        ...prev,
        {
          id: tempId,
          type,
          timestamp: now,
          lastProgressAt: now,
          progress: stage === 'completed' ? 100 : 0,
          stage,
          retryCount: 0,
        },
      ];
    });

    // Auto-cleanup loading note after 10 minutes as a safety measure
    setTimeout(() => {
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      setLoadingNotes(prev => {
        const note = prev.find((item) => item.id === tempId);
        if (!note) {
          return prev;
        }

        const activityTimestamp = note.lastProgressAt ?? note.timestamp;
        const isStaleActiveNote =
          (note.stage === 'uploading' || note.stage === 'processing' || note.stage === 'generating') &&
          activityTimestamp < tenMinutesAgo;

        const shouldRemove =
          note.stage === 'completed' ||
          note.stage === 'error' ||
          isStaleActiveNote;

        if (!shouldRemove) {
          return prev;
        }

        console.log(`Auto-removing loading note after timeout: ${tempId}`);
        return prev.filter(item => item.id !== tempId);
      });
    }, 10 * 60 * 1000); // 10 minutes
  }, []);

  const updateLoadingNote = useCallback((tempId: string, updates: Partial<LoadingNote>) => {
    setLoadingNotes(prev =>
      prev.map(note => {
        if (note.id !== tempId) {
          return note;
        }

        const nextNote: LoadingNote = { ...note, ...updates };
        const hasProgressUpdate = typeof updates.progress === 'number' && Number.isFinite(updates.progress);

        if (hasProgressUpdate) {
          nextNote.progress = Math.max(0, Math.min(100, Math.round(updates.progress as number)));
          nextNote.lastProgressAt = Date.now();
        }

        if (updates.message !== undefined || updates.stage !== undefined) {
          nextNote.lastProgressAt = Date.now();
        }

        if (updates.stage === 'completed' && updates.progress === undefined) {
          nextNote.progress = 100;
        }

        return nextNote;
      })
    );

    // Safety net: auto-remove completed loading notes after 500ms
    // This catches any case where removeLoadingNote wasn't called explicitly
    // Short timeout ensures quick cleanup when returning to dashboard
    if (updates.stage === 'completed') {
      console.log('[DashboardRefresh] Note completed, scheduling auto-removal:', tempId);
      
      // Immediately clean up localStorage to prevent restore on navigation
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(LOADING_NOTES_KEY);
          if (stored) {
            const parsedNotes = JSON.parse(stored);
            const filtered = parsedNotes.filter((note: LoadingNote) => note.id !== tempId);
            if (filtered.length > 0) {
              localStorage.setItem(LOADING_NOTES_KEY, JSON.stringify(filtered));
              console.log('[DashboardRefresh] Removed completed note from localStorage:', tempId);
            } else {
              localStorage.removeItem(LOADING_NOTES_KEY);
              console.log('[DashboardRefresh] Cleared localStorage (no notes remaining)');
            }
          }
        } catch (error) {
          console.error('[DashboardRefresh] Failed to clean localStorage:', error);
        }
      }
      
      setTimeout(() => {
        console.log('[DashboardRefresh] Auto-removing completed note:', tempId);
        setLoadingNotes(prev => prev.filter(note => note.id !== tempId));
      }, 500);
    }
  }, []);

  const removeLoadingNote = useCallback((tempId: string) => {
    console.log(`Removing loading note: ${tempId}`);
    
    // Immediately update localStorage before state update
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LOADING_NOTES_KEY);
        if (stored) {
          const parsedNotes = JSON.parse(stored);
          const filtered = parsedNotes.filter((note: LoadingNote) => note.id !== tempId);
          if (filtered.length > 0) {
            localStorage.setItem(LOADING_NOTES_KEY, JSON.stringify(filtered));
          } else {
            localStorage.removeItem(LOADING_NOTES_KEY);
          }
        }
      } catch (error) {
        console.error('[DashboardRefresh] Failed to update localStorage on remove:', error);
      }
    }
    
    setLoadingNotes(prev => {
      const filtered = prev.filter(note => note.id !== tempId);
      console.log(`Loading notes after removal:`, filtered);
      return filtered;
    });
  }, []);

  // Add function to clear all loading notes (useful for debugging)
  const clearAllLoadingNotes = useCallback(() => {
    console.log('Clearing all loading notes');
    setLoadingNotes([]);
    
    // Also clear localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(LOADING_NOTES_KEY);
      } catch (error) {
        console.error('[DashboardRefresh] Failed to clear localStorage:', error);
      }
    }
  }, []);

  const refreshNotes = useCallback(async () => {
    if (refreshHandler && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await refreshHandler();
        // Increment refresh trigger to notify other components
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        console.error('Error refreshing notes:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [refreshHandler, isRefreshing]);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const setRefreshHandlerCallback = useCallback((handler: () => Promise<void>) => {
    setRefreshHandler(() => handler);
  }, []);

  return (
    <DashboardRefreshContext.Provider 
      value={{ 
        refreshNotes, 
        isRefreshing, 
        setRefreshHandler: setRefreshHandlerCallback,
        addLoadingNote,
        updateLoadingNote,
        removeLoadingNote,
        loadingNotes,
        clearAllLoadingNotes,
        searchQuery,
        setSearchQuery,
        folderSearchQuery,
        setFolderSearchQuery,
        clonedSearchQuery,
        setClonedSearchQuery,
        refreshTrigger,
        triggerRefresh,
      }}
    >
      {children}
    </DashboardRefreshContext.Provider>
  );
}

export function useDashboardRefresh() {
  const context = useContext(DashboardRefreshContext);
  if (!context) {
    throw new Error('useDashboardRefresh must be used within a DashboardRefreshProvider');
  }
  return context;
}
