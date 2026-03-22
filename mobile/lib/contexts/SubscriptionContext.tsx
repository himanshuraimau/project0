import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GetSubscriptionStatusParams, Subscription, SubscriptionStatus, SubscriptionStatusResponse } from '@/lib/api/types';
import { useSession } from '@/lib/auth/auth-client';
import { mapRevenueCatCustomerInfoToSubscriptionStatus, useRevenueCat } from '@/lib/revenuecat';
import { isDemoMode } from '@/lib/revenuecat/config';

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
    const { data: session, isPending } = useSession();

    if (isDemoMode()) {
        const demoSubscription: Subscription = {
            id: 'demo_subscription',
            userId: session?.user?.id ?? 'demo_user',
            status: SubscriptionStatus.ACTIVE,
            priceId: 'demo_price',
            billingProvider: 'TEST_STORE',
            entitlementId: 'pro',
            store: 'demo',
            environment: 'sandbox',
            cancelAtPeriodEnd: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const demoValue: SubscriptionContextType = {
            subscription: session?.user ? demoSubscription : null,
            isLoading: isPending,
            isSubscribed: Boolean(session?.user),
            hasAccess: Boolean(session?.user),
            isActive: Boolean(session?.user),
            isTrial: false,
            daysRemaining: null,
            error: null,
            refreshSubscription: async () => {},
        };
        return (
            <SubscriptionContext.Provider value={demoValue}>
                {children}
            </SubscriptionContext.Provider>
        );
    }

    return <SubscriptionProviderInner>{children}</SubscriptionProviderInner>;
};

const SubscriptionProviderInner: React.FC<SubscriptionProviderProps> = ({ children }) => {
    const { data: session, isPending } = useSession();
    const {
        customerInfo,
        isLoading: revenueCatLoading,
        error: revenueCatError,
        refreshCustomerInfo,
    } = useRevenueCat();
    const [subscriptionData, setSubscriptionData] = useState<SubscriptionStatusResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    /**
     * True only when the user currently has premium access (active entitlement).
     * RevenueCat keeps expired entitlements in `all`, so hasSubscription alone stays true after expiry;
     * gating paywall and "Pro" UI on access avoids treating lapsed users as subscribed.
     */
    const isSubscribed = React.useMemo(() => {
        return Boolean(subscriptionData?.hasSubscription && subscriptionData?.access?.hasAccess);
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
        void params;
        try {
            setError(null);

            // Check if user is authenticated using Better Auth session
            if (!session?.user) {
                console.log('📭 No active session, skipping subscription fetch');
                setSubscriptionData(null);
                return;
            }

            console.log('🔄 Fetching RevenueCat subscription status...');
            const nextCustomerInfo = await refreshCustomerInfo();
            const data = mapRevenueCatCustomerInfoToSubscriptionStatus(nextCustomerInfo);

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

        if (isPending) {
            return;
        }

        if (!session?.user) {
            setSubscriptionData(null);
            setError(null);
            return;
        }

        const mapped = mapRevenueCatCustomerInfoToSubscriptionStatus(customerInfo);
        setSubscriptionData(mapped);
        setError(revenueCatError);
    }, [session, isPending, customerInfo, revenueCatError]);

    const value: SubscriptionContextType = {
        subscription: subscriptionData?.subscription ?? null,
        isLoading: isPending || revenueCatLoading,
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
