"use client";

import React, { createContext, useContext, useCallback, useState } from 'react';

interface DashboardRefreshContextType {
  refreshNotes: () => void;
  isRefreshing: boolean;
  setRefreshHandler: (handler: () => Promise<void>) => void;
}

const DashboardRefreshContext = createContext<DashboardRefreshContextType | null>(null);

export function DashboardRefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshHandler, setRefreshHandler] = useState<(() => Promise<void>) | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
        setRefreshHandler: setRefreshHandlerCallback 
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