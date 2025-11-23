import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { getSubscriptionStatus } from '@/lib/api/subscription';
import { Subscription, SubscriptionStatus } from '@/lib/api/types';

/**
 * Subscription Context
 * Manages subscription state and provides subscription-related functionality
 */

interface SubscriptionContextType {
    subscription: Subscription | null;
    isLoading: boolean;
    isSubscribed: boolean;
    refreshSubscription: () => Promise<void>;
    error: string | null;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
    children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Calculate if user has an active subscription
     * Returns true if status is ACTIVE or if trial is still valid
     */
    const isSubscribed = React.useMemo(() => {
        if (!subscription) return false;

        // Check if subscription is active
        if (subscription.status === SubscriptionStatus.ACTIVE) {
            return true;
        }

        // Check if trial is still valid
        if (subscription.trialEnd) {
            const trialEndDate = new Date(subscription.trialEnd);
            const now = new Date();
            return trialEndDate > now;
        }

        return false;
    }, [subscription]);

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
                setSubscription(null);
                setIsLoading(false);
                return;
            }

            console.log('🔄 Fetching subscription status...');
            const data = await getSubscriptionStatus();
            console.log('✅ Subscription status fetched:', data);
            setSubscription(data);
        } catch (err: any) {
            console.error('❌ Error fetching subscription:', err);
            // Don't set error for 404 - just means no subscription exists
            if (err.message?.includes('404') || err.message?.includes('not found')) {
                setSubscription(null);
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
        subscription,
        isLoading,
        isSubscribed,
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
