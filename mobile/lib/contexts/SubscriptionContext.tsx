import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { getSubscriptionStatus } from '@/lib/api/subscription';
import { Subscription, SubscriptionStatusResponse } from '@/lib/api/types';

/**
 * Subscription Context
 * Manages subscription state and provides subscription-related functionality
 */

interface SubscriptionContextType {
    subscription: Subscription | null;
    isLoading: boolean;
    isSubscribed: boolean;
    hasAccess: boolean;
    isActive: boolean;
    isTrial: boolean;
    daysRemaining: number | null;
    refreshSubscription: () => Promise<void>;
    error: string | null;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
    children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
    const [subscriptionData, setSubscriptionData] = useState<SubscriptionStatusResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Calculate if user has an active subscription
     * Uses the access info from the API response (matching web implementation)
     */
    const isSubscribed = React.useMemo(() => {
        return subscriptionData?.hasSubscription ?? false;
    }, [subscriptionData]);

    /**
     * Check if user has access (matching web implementation)
     */
    const hasAccess = React.useMemo(() => {
        return subscriptionData?.access?.hasAccess ?? false;
    }, [subscriptionData]);

    /**
     * Check if subscription is active
     */
    const isActive = React.useMemo(() => {
        return subscriptionData?.access?.isActive ?? false;
    }, [subscriptionData]);

    /**
     * Check if user is on trial
     */
    const isTrial = React.useMemo(() => {
        return subscriptionData?.access?.isTrial ?? false;
    }, [subscriptionData]);

    /**
     * Get days remaining
     */
    const daysRemaining = React.useMemo(() => {
        return subscriptionData?.access?.daysRemaining ?? null;
    }, [subscriptionData]);

    /**
     * Fetch subscription status from API
     */
    const fetchSubscriptionStatus = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Check if user is authenticated (has auth token)
            const authToken = await SecureStore.getItemAsync('auth_token');
            if (!authToken) {
                console.log('📭 No auth token found, skipping subscription fetch');
                setSubscriptionData(null);
                setIsLoading(false);
                return;
            }

            console.log('🔄 Fetching subscription status...');
            const data = await getSubscriptionStatus();
            console.log('✅ Subscription status fetched:', JSON.stringify(data, null, 2));
            console.log('📊 Has subscription:', data?.hasSubscription);
            console.log('📊 Has access:', data?.access?.hasAccess);
            console.log('📊 Subscription object:', data?.subscription);
            setSubscriptionData(data);
        } catch (err: any) {
            console.error('❌ Error fetching subscription:', err);
            // Don't set error for 404 - just means no subscription exists
            if (err.message?.includes('404') || err.message?.includes('not found')) {
                setSubscriptionData(null);
            } else {
                setError(err.message || 'Failed to fetch subscription status');
            }
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Refresh subscription status (can be called manually)
     */
    const refreshSubscription = async () => {
        await fetchSubscriptionStatus();
    };

    // Fetch subscription status on mount
    useEffect(() => {
        fetchSubscriptionStatus();
    }, []);

    const value: SubscriptionContextType = {
        subscription: subscriptionData?.subscription ?? null,
        isLoading,
        isSubscribed,
        hasAccess,
        isActive,
        isTrial,
        daysRemaining,
        refreshSubscription,
        error,
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
};

/**
 * Hook to use subscription context
 * Must be used within SubscriptionProvider
 */
export const useSubscription = (): SubscriptionContextType => {
    const context = useContext(SubscriptionContext);

    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }

    return context;
};

export default SubscriptionContext;
