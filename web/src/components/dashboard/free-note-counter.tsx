'use client';

import { useEffect, useState, useCallback } from 'react';
import { FileText } from 'lucide-react';
import Link from 'next/link';
import { useDashboardRefresh } from '@/contexts/dashboard-refresh-context';

interface FreeTierStatus {
  used: number;
  limit: number;
  remaining: number;
}

export function FreeNoteCounter() {
  const [status, setStatus] = useState<FreeTierStatus | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { refreshTrigger } = useDashboardRefresh();

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      // Add cache-busting timestamp to ensure fresh data
      const response = await fetch(`/api/subscription/status?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const data = await response.json();
      
      console.log('FreeNoteCounter - API response:', data);
      
      const hasActiveSubscription = data.hasSubscription && data.access?.hasAccess;
      setHasSubscription(hasActiveSubscription);
      
      if (data.features?.freeNotes) {
        console.log('FreeNoteCounter - Free notes data:', data.features.freeNotes);
        setStatus(data.features.freeNotes);
      } else {
        console.log('FreeNoteCounter - No freeNotes in features');
      }
    } catch (error) {
      console.error('Error fetching free tier status:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Refresh when dashboard refresh is triggered
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchStatus();
    }
  }, [refreshTrigger, fetchStatus]);

  // Don't show if user has subscription
  if (hasSubscription) {
    console.log('FreeNoteCounter - Hidden: User has subscription');
    return null;
  }

  // Show loading state briefly
  if (isLoading && !status) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 rounded-md animate-pulse">
        <FileText className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  // Don't show if status not loaded
  if (!status) {
    console.log('FreeNoteCounter - Hidden: No status data');
    return null;
  }

  console.log('FreeNoteCounter - Rendering with status:', status);

  const isLimitReached = status.remaining === 0;
  const isNearLimit = status.remaining <= 1 && status.remaining > 0;

  return (
    <Link 
      href="/pricing"
      className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
    >
      <FileText className={`h-3.5 w-3.5 ${
        isLimitReached 
          ? 'text-red-500' 
          : isNearLimit 
          ? 'text-amber-500' 
          : 'text-gray-500 dark:text-gray-400'
      }`} />
      <span className={`text-sm font-medium ${
        isLimitReached 
          ? 'text-red-700 dark:text-red-400' 
          : isNearLimit 
          ? 'text-amber-700 dark:text-amber-400' 
          : 'text-gray-700 dark:text-gray-300'
      }`}>
        {status.used}/{status.limit} Free Notes
      </span>
    </Link>
  );
}
