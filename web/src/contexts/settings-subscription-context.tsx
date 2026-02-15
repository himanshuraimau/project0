"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { subscriptionCache } from "@/lib/subscription-cache";

type SubscriptionData = {
  hasSubscription: boolean;
  subscription?: {
    nextBillingDate?: string | null;
    currentPeriodEnd?: string | null;
    createdAt: string;
    displayStatus: string;
    status: string;
    productId: string;
    cancelAtPeriodEnd?: boolean;
    cancelledAt?: string | null;
    metadata?: {
      scheduledProductId?: string;
      scheduledPlanType?: string;
      scheduledAt?: string;
    };
  };
  access?: { hasAccess: boolean };
} | null;

const SubscriptionContext = createContext<{
  data: SubscriptionData;
  loading: boolean;
  refetch: (sync?: boolean, silent?: boolean) => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<SubscriptionData>>;
} | null>(null);

export function SettingsSubscriptionProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SubscriptionData>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async (sync = false, silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      // Use cache for non-sync requests
      const json = await subscriptionCache.getStatus(sync);
      setData(json as any);
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Try to get cached data first
    const cached = subscriptionCache.getCached();
    if (cached) {
      setData(cached as any);
      setLoading(false);
    }

    refetch();

    // Subscribe to cache updates
    const unsubscribe = subscriptionCache.subscribe((cachedData) => {
      setData(cachedData as any);
    });

    return unsubscribe;
  }, [refetch]);

  useEffect(() => {
    const handler = async () => {
      // Invalidate cache and refetch on subscription update
      await subscriptionCache.invalidate(true);
    };
    window.addEventListener("subscription-updated", handler);
    return () => window.removeEventListener("subscription-updated", handler);
  }, []);

  return (
    <SubscriptionContext.Provider value={{ data, loading, refetch, setData }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSettingsSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error("useSettingsSubscription must be used within SettingsSubscriptionProvider");
  }
  return ctx;
}

export function useSettingsSubscriptionOptional() {
  return useContext(SubscriptionContext);
}
