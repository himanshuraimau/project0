"use client";

import React, { createContext, useContext, useCallback, useState } from 'react';

interface DashboardRefreshContextType {
  refreshNotes: () => void;
  isRefreshing: boolean;
  setRefreshHandler: (handler: () => Promise<void>) => void;
  addLoadingNote: (tempId: string, type: 'pdf' | 'audio' | 'youtube' | 'webpage') => void;
  removeLoadingNote: (tempId: string) => void;
  loadingNotes: Array<{ id: string; type: 'pdf' | 'audio' | 'youtube' | 'webpage' }>;
  clearAllLoadingNotes: () => void;
}

const DashboardRefreshContext = createContext<DashboardRefreshContextType | null>(null);

export function DashboardRefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshHandler, setRefreshHandler] = useState<(() => Promise<void>) | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState<Array<{ id: string; type: 'pdf' | 'audio' | 'youtube' | 'webpage' }>>([]);

  const addLoadingNote = useCallback((tempId: string, type: 'pdf' | 'audio' | 'youtube' | 'webpage') => {
    console.log(`Adding loading note: ${tempId} (${type})`);
    setLoadingNotes(prev => {
      // Check if note already exists to prevent duplicates
      const exists = prev.some(note => note.id === tempId);
      if (exists) {
        console.log(`Loading note ${tempId} already exists, skipping`);
        return prev;
      }
      return [...prev, { id: tempId, type }];
    });

    // Auto-cleanup loading note after 5 minutes as a safety measure
    setTimeout(() => {
      console.log(`Auto-removing loading note after timeout: ${tempId}`);
      setLoadingNotes(prev => prev.filter(note => note.id !== tempId));
    }, 5 * 60 * 1000); // 5 minutes
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
      } catch (error) {
        console.error('Error refreshing notes:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [refreshHandler, isRefreshing]);

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
        removeLoadingNote,
        loadingNotes,
        clearAllLoadingNotes
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