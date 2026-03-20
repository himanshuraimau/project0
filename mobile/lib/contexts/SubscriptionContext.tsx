import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSubscriptionStatus } from '@/lib/api/subscription';
import { GetSubscriptionStatusParams, Subscription, SubscriptionStatusResponse } from '@/lib/api/types';
import { useSession } from '@/lib/auth/auth-client';

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
    refreshSubscription: (params?: GetSubscriptionStatusParams) => Promise<void>;
    error: string | null;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
    children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
    console.log('🎯 SubscriptionProvider component rendering...');

    const { data: session, isPending } = useSession();
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
    const fetchSubscriptionStatus = async (params?: GetSubscriptionStatusParams) => {
        try {
            setIsLoading(true);
            setError(null);

            // Check if user is authenticated using Better Auth session
            if (!session?.user) {
                console.log('📭 No active session, skipping subscription fetch');
                setSubscriptionData(null);
                setIsLoading(false);
                return;
            }

            console.log('🔄 Fetching subscription status...');
            const data = await getSubscriptionStatus(params);

            // DETAILED LOGGING FOR DEBUGGING
            console.log('═══════════════════════════════════════════');
            console.log('📊 SUBSCRIPTION STATUS RESPONSE:');
            console.log('═══════════════════════════════════════════');
            console.log('Full response:', JSON.stringify(data, null, 2));
            console.log('-------------------------------------------');
            console.log('hasSubscription:', data?.hasSubscription);
            console.log('-------------------------------------------');
            console.log('subscription object:', data?.subscription);
            if (data?.subscription) {
                console.log('  - id:', data.subscription.id);
                console.log('  - status:', data.subscription.status);
                console.log('  - priceId:', data.subscription.priceId);
                console.log('  - legacy productId:', data.subscription.productId);
                console.log('  - currentPeriodEnd:', data.subscription.currentPeriodEnd);
            }
            console.log('-------------------------------------------');
            console.log('access object:', data?.access);
            if (data?.access) {
                console.log('  - hasAccess:', data.access.hasAccess);
                console.log('  - isActive:', data.access.isActive);
                console.log('  - isTrial:', data.access.isTrial);
                console.log('  - daysRemaining:', data.access.daysRemaining);
            }
            console.log('═══════════════════════════════════════════');

            setSubscriptionData(data);
        } catch (err: any) {
            console.error('❌ Error fetching subscription:', err);
            console.error('Error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
            });
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
    const refreshSubscription = async (params?: GetSubscriptionStatusParams) => {
        console.log('🔄 Manual refresh subscription called');
        await fetchSubscriptionStatus(params);
    };

    // Fetch subscription status when session is ready
    useEffect(() => {
        console.log('🚀 SubscriptionContext useEffect triggered');
        console.log('  - isPending:', isPending);
        console.log('  - session:', session?.user ? 'User logged in' : 'No user');

        if (!isPending) {
            fetchSubscriptionStatus();
        }
    }, [session, isPending]);

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
