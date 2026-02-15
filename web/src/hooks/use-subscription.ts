// useSubscription Hook - React hook for subscription management

'use client';

import { useEffect, useState, useCallback } from 'react';

interface SubscriptionStatus {
  hasSubscription: boolean;
  subscription: {
    id: string;
    status: string;
    displayStatus: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    nextBillingDate: string;
    cancelAtPeriodEnd: boolean;
    cancelledAt: string | null;
    trialEnd: string | null;
    createdAt: string;
  } | null;
  access: {
    hasAccess: boolean;
    isActive: boolean;
    isTrial: boolean;
    daysRemaining: number | null;
  };
  features: {
    hasAccess: boolean;
    subscription: any;
    upgradeUrl: string | null;
  };
}

export function useSubscription() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/subscription/status');
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const createSubscription = useCallback(async () => {
    try {
      setError(null);
      
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.paymentLink) {
        window.location.href = data.paymentLink;
        return { success: true, paymentLink: data.paymentLink };
      } else if (data.error) {
        setError(data.error);
        return { success: false, error: data.error };
      }

      return { success: false, error: 'No payment link returned' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create subscription';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const cancelSubscription = useCallback(async (cancelAtPeriodEnd: boolean = true) => {
    try {
      setError(null);
      
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelAtPeriodEnd }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchStatus(); // Refresh status
        return { success: true, message: data.message };
      } else {
        setError(data.error);
        return { success: false, error: data.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel subscription';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [fetchStatus]);

  const openCustomerPortal = useCallback(async () => {
    try {
      setError(null);
      
      const response = await fetch('/api/subscription/portal');
      const data = await response.json();

      if (data.portalUrl) {
        window.open(data.portalUrl, '_blank');
        return { success: true, portalUrl: data.portalUrl };
      } else {
        setError('No portal URL returned');
        return { success: false, error: 'No portal URL returned' };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open customer portal';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const upgradeToYearly = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.success && data.paymentLink) {
        window.location.href = data.paymentLink;
        return { success: true, message: 'Redirecting to payment...' };
      }
      if (data.success) {
        await fetchStatus();
        return { success: true, message: data.message };
      }
      setError(data.error);
      return { success: false, error: data.error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change subscription plan';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [fetchStatus]);

  return {
    status,
    loading,
    error,
    hasAccess: status?.access?.hasAccess || false,
    isActive: status?.access?.isActive || false,
    isTrial: status?.access?.isTrial || false,
    daysRemaining: status?.access?.daysRemaining || null,
    subscription: status?.subscription || null,
    // Actions
    fetchStatus,
    createSubscription,
    cancelSubscription,
    openCustomerPortal,
    upgradeToYearly,
  };
}
