"use client";

import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import { useSession } from '@/lib/auth-client';

interface LoadingNote {
  id: string;
  type: 'pdf' | 'audio' | 'audio-record' | 'youtube' | 'webpage';
  timestamp: number;
  progress?: number;      // Latest known progress percentage (0-100)
  message?: string;       // Latest progress/status message
  lastProgressAt?: number; // Last time we received a progress update
  transcriptId?: string;  // Link to actual transcript 
  noteId?: string;        // Link to generated note in DB
  completedAt?: number;   // Completion timestamp for deterministic cleanup
  rehydrated?: boolean;   // Whether restored from localStorage
  transcribeUrl?: string; // Presigned URL used for audio transcription resume
  fileName?: string;      // Original uploaded/recorded file name
  folderId?: string | null; // Target folder for generated note
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

const LOADING_NOTES_KEY_PREFIX = 'dashboard_loading_notes_';
const LEGACY_LOADING_NOTES_KEY = 'dashboard_loading_notes';

function getLoadingNotesStorageKey(userId: string | undefined | null): string | null {
  if (!userId) return null;
  return `${LOADING_NOTES_KEY_PREFIX}${userId}`;
}

export function DashboardRefreshProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: isSessionPending } = useSession();
  const userId = session?.user?.id ?? null;
  const userIdRef = useRef<string | null>(null);

  const [refreshHandler, setRefreshHandler] = useState<(() => Promise<void>) | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState<LoadingNote[]>([]);
  const [hasHydratedLoadingNotes, setHasHydratedLoadingNotes] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [folderSearchQuery, setFolderSearchQuery] = useState("");
  const [clonedSearchQuery, setClonedSearchQuery] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load loading notes from localStorage per user (isolated per account)
  useEffect(() => {
    if (typeof window === 'undefined') {
      setHasHydratedLoadingNotes(true);
      return;
    }
    if (isSessionPending) return;
    const storageKey = getLoadingNotesStorageKey(userId ?? undefined);
    if (!storageKey) {
      setLoadingNotes([]);
      setHasHydratedLoadingNotes(true);
      userIdRef.current = null;
      return;
    }
    if (userIdRef.current !== null && userIdRef.current !== userId) {
      setLoadingNotes([]);
    }
    userIdRef.current = userId;
    try {
      // Remove legacy unscoped key so it is never read again (avoids cross-account leak)
      localStorage.removeItem(LEGACY_LOADING_NOTES_KEY);
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsedNotes = JSON.parse(stored);
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);
        const fiveMinutesAgo = now - (5 * 60 * 1000);
        const tenMinutesAgo = now - (10 * 60 * 1000);
        const validNotes = parsedNotes
          .filter((note: LoadingNote) => {
          const activityTimestamp = note.lastProgressAt ?? note.timestamp;
          if (note.timestamp < oneHourAgo) return false;
          if (note.completedAt) return false;
          if (note.stage === 'completed') return false;
          if ((note.stage === 'generating' || note.stage === 'processing' || note.stage === 'uploading') && activityTimestamp < tenMinutesAgo) return false;
          if (note.stage === 'error' && activityTimestamp < fiveMinutesAgo) return false;
          return true;
        })
          .map((note: LoadingNote) => ({
            ...note,
            rehydrated: true,
          }));
        if (validNotes.length > 0) {
          setLoadingNotes(validNotes);
        } else {
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.error('Failed to restore loading notes:', error);
    } finally {
      setHasHydratedLoadingNotes(true);
    }
  }, [userId, isSessionPending]);

  // Save loading notes to localStorage whenever they change (user-scoped key)
  useEffect(() => {
    if (!hasHydratedLoadingNotes || typeof window === 'undefined') return;
    const storageKey = getLoadingNotesStorageKey(userId ?? undefined);
    if (!storageKey) return;
    try {
      if (loadingNotes.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(loadingNotes));
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error('Failed to save loading notes:', error);
    }
  }, [loadingNotes, hasHydratedLoadingNotes, userId]);

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
          rehydrated: false,
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

  const removeLoadingNote = useCallback((tempId: string) => {
    console.log(`Removing loading note: ${tempId}`);

    const storageKey = typeof window !== 'undefined' ? getLoadingNotesStorageKey(userId ?? undefined) : null;
    if (storageKey) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsedNotes = JSON.parse(stored);
          const filtered = parsedNotes.filter((note: LoadingNote) => note.id !== tempId);
          if (filtered.length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(filtered));
          } else {
            localStorage.removeItem(storageKey);
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
  }, [userId]);

  const updateLoadingNote = useCallback((tempId: string, updates: Partial<LoadingNote>) => {
    if (updates.stage === 'completed') {
      removeLoadingNote(tempId);
      return;
    }

    setLoadingNotes(prev =>
      prev.map(note => {
        if (note.id !== tempId) {
          return note;
        }

        const nextNote: LoadingNote = { ...note, ...updates, rehydrated: false };
        const hasProgressUpdate = typeof updates.progress === 'number' && Number.isFinite(updates.progress);

        if (hasProgressUpdate) {
          nextNote.progress = Math.max(0, Math.min(100, Math.round(updates.progress as number)));
          nextNote.lastProgressAt = Date.now();
        }

        if (updates.message !== undefined || updates.stage !== undefined) {
          nextNote.lastProgressAt = Date.now();
        }

        return nextNote;
      })
    );
  }, [removeLoadingNote]);

  // Add function to clear all loading notes (useful for debugging)
  const clearAllLoadingNotes = useCallback(() => {
    console.log('Clearing all loading notes');
    setLoadingNotes([]);

    const storageKey = typeof window !== 'undefined' ? getLoadingNotesStorageKey(userId ?? undefined) : null;
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.error('[DashboardRefresh] Failed to clear localStorage:', error);
      }
    }
  }, [userId]);

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
