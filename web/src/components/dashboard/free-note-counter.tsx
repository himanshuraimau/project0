'use client';

import { useEffect, useState, useCallback } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { File01Icon } from '@hugeicons/core-free-icons';
import { useDashboardRefresh } from '@/contexts/dashboard-refresh-context';
import { useUpgradeModal } from '@/contexts/upgrade-modal-context';
import { subscriptionCache } from '@/lib/subscription-cache';

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
  const { openUpgradeModal } = useUpgradeModal();

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      // Use cached subscription data with request deduplication
      const data = await subscriptionCache.getStatus();

      const hasActiveSubscription = data.hasSubscription && data.access?.hasAccess;
      setHasSubscription(hasActiveSubscription);

      if (data.features?.freeNotes) {
        setStatus(data.features.freeNotes);
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
    return null;
  }

  // Show loading state — skeleton shimmer
  if (isLoading && !status) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-card overflow-hidden">
        <div className="skeleton-base size-4 shrink-0 rounded" />
        <div className="skeleton-base h-4 w-20 rounded-md" />
      </div>
    );
  }

  // Don't show if status not loaded
  if (!status) {
    return null;
  }

  const isLimitReached = status.remaining === 0;
  const isNearLimit = status.remaining <= 1 && status.remaining > 0;

  return (
    <button
      type="button"
      onClick={openUpgradeModal}
      className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-md hover:bg-muted/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <HugeiconsIcon
        icon={File01Icon}
        className={`size-4 shrink-0 ${
          isLimitReached
            ? 'text-destructive'
            : isNearLimit
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-muted-foreground'
        }`}
      />
      <span
        className={`text-sm font-medium ${
          isLimitReached
            ? 'text-destructive'
            : isNearLimit
              ? 'text-amber-700 dark:text-amber-300'
              : 'text-foreground'
        }`}
      >
        {status.used}/{status.limit} Free Notes
      </span>
    </button>
  );
}
