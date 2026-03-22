import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CustomerInfo,
  CustomerInfoUpdateListener,
  PurchasesOffering,
  PurchasesOfferings,
} from 'react-native-purchases';
import Purchases from 'react-native-purchases';
import { useSession } from '@/lib/auth';
import { syncRevenueCatSubscriberAttributes } from './identity';
import {
  ensureRevenueCatConfigured,
  getConfiguredRevenueCatUserId,
  getRevenueCatCustomerInfo,
  getRevenueCatOfferings,
  isRevenueCatConfigured,
} from './sdk';
import { getCurrentRevenueCatOffering } from './mapper';

interface RevenueCatContextValue {
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;
  currentOffering: PurchasesOffering | null;
  isConfigured: boolean;
  isLoading: boolean;
  error: string | null;
  refreshCustomerInfo: () => Promise<CustomerInfo | null>;
  refreshOfferings: () => Promise<PurchasesOfferings | null>;
}

const RevenueCatContext = createContext<RevenueCatContextValue | undefined>(undefined);

export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastSyncedUserIdRef = useRef<string | null>(null);
  /** Prevents overlapping bootstraps for the same user (duplicate effects / fast re-renders). */
  const bootstrapInFlightUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const customerInfoListener: CustomerInfoUpdateListener = (nextCustomerInfo) => {
      setCustomerInfo(nextCustomerInfo);
    };

    Purchases.addCustomerInfoUpdateListener(customerInfoListener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(customerInfoListener);
    };
  }, []);

  const refreshCustomerInfo = async () => {
    if (!isRevenueCatConfigured()) {
      return null;
    }

    const nextCustomerInfo = await getRevenueCatCustomerInfo();
    setCustomerInfo(nextCustomerInfo);
    return nextCustomerInfo;
  };

  const refreshOfferings = async () => {
    if (!isRevenueCatConfigured()) {
      return null;
    }

    const nextOfferings = await getRevenueCatOfferings();
    setOfferings(nextOfferings);
    return nextOfferings;
  };

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (isPending) {
        return;
      }

      if (!session?.user?.id) {
        if (!cancelled) {
          setCustomerInfo(null);
          setOfferings(null);
          setError(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        if (!cancelled) {
          setIsLoading(true);
          setError(null);
        }

        await ensureRevenueCatConfigured(session.user.id);
        await syncRevenueCatSubscriberAttributes({
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        });

        const [nextCustomerInfo, nextOfferings] = await Promise.all([
          getRevenueCatCustomerInfo(),
          getRevenueCatOfferings(),
        ]);

        if (cancelled) {
          return;
        }

        lastSyncedUserIdRef.current = session.user.id;
        setCustomerInfo(nextCustomerInfo);
        setOfferings(nextOfferings);
      } catch (nextError) {
        console.error('RevenueCat bootstrap failed:', nextError);

        if (!cancelled) {
          setError(
            nextError instanceof Error ? nextError.message : 'Failed to initialize RevenueCat'
          );
          setCustomerInfo(null);
          setOfferings(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    const configuredUserId = getConfiguredRevenueCatUserId();
    const sessionUserId = session?.user?.id ?? null;
    const shouldBootstrap =
      !isPending &&
      Boolean(sessionUserId) &&
      (!isRevenueCatConfigured() ||
        configuredUserId !== sessionUserId ||
        lastSyncedUserIdRef.current !== sessionUserId);

    if (shouldBootstrap) {
      if (bootstrapInFlightUserIdRef.current === sessionUserId) {
        return () => {
          cancelled = true;
        };
      }
      bootstrapInFlightUserIdRef.current = sessionUserId;
      void bootstrap().finally(() => {
        if (bootstrapInFlightUserIdRef.current === sessionUserId) {
          bootstrapInFlightUserIdRef.current = null;
        }
      });
      return () => {
        cancelled = true;
      };
    }

    if (!isPending && !sessionUserId) {
      setCustomerInfo(null);
      setOfferings(null);
      setError(null);
      setIsLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [session?.user?.email, session?.user?.id, session?.user?.name, isPending]);

  const value = useMemo<RevenueCatContextValue>(
    () => ({
      customerInfo,
      offerings,
      currentOffering: getCurrentRevenueCatOffering(offerings),
      isConfigured: isRevenueCatConfigured(),
      isLoading: isPending || isLoading,
      error,
      refreshCustomerInfo,
      refreshOfferings,
    }),
    [customerInfo, offerings, isPending, isLoading, error]
  );

  return <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>;
}

export function useRevenueCat(): RevenueCatContextValue {
  const context = useContext(RevenueCatContext);

  if (!context) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }

  return context;
}
