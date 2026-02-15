"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

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
      const url = sync ? "/api/subscription/status?sync=1" : "/api/subscription/status";
      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        setData(json);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener("subscription-updated", handler);
    return () => window.removeEventListener("subscription-updated", handler);
  }, [refetch]);

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
