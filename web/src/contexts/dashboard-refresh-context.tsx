"use client";

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';

interface LoadingNote {
  id: string;
  type: 'pdf' | 'audio' | 'audio-record' | 'youtube' | 'webpage';
  timestamp: number;
  transcriptId?: string;  // Link to actual transcript in DB
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
          // Filter out notes older than 1 hour
          const oneHourAgo = Date.now() - (60 * 60 * 1000);
          const validNotes = parsedNotes.filter((note: any) => note.timestamp > oneHourAgo);
          if (validNotes.length > 0) {
            console.log('Restored loading notes from localStorage:', validNotes);
            setLoadingNotes(validNotes);
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
    setLoadingNotes(prev => {
      // Check if note already exists to prevent duplicates
      const exists = prev.some(note => note.id === tempId);
      if (exists) {
        return prev;
      }
      return [...prev, { id: tempId, type, timestamp: Date.now(), stage, retryCount: 0 }];
    });

    // Auto-cleanup loading note after 10 minutes as a safety measure
    setTimeout(() => {
      console.log(`Auto-removing loading note after timeout: ${tempId}`);
      setLoadingNotes(prev => prev.filter(note => note.id !== tempId));
    }, 10 * 60 * 1000); // 10 minutes
  }, []);

  const updateLoadingNote = useCallback((tempId: string, updates: Partial<LoadingNote>) => {
    setLoadingNotes(prev => 
      prev.map(note => 
        note.id === tempId 
          ? { ...note, ...updates }
          : note
      )
    );
  }, []);

  const removeLoadingNote = useCallback((tempId: string) => {
    console.log(`Removing loading note: ${tempId}`);
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