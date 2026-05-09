import apiClient, { handleApiError } from './client';
import type { SubscriptionStatusResponse, GetSubscriptionStatusParams } from './types';

/**
 * Subscription API — server status for cross-checks (e.g. settings).
 * Purchases on mobile are via RevenueCat (native IAP), not Paddle.
 */
export const getSubscriptionStatus = async (
  params?: GetSubscriptionStatusParams
): Promise<SubscriptionStatusResponse> => {
  try {
    const response = await apiClient.get<SubscriptionStatusResponse>('/subscription/status', {
      params: {
        ...(params?.transactionId ? { transaction_id: params.transactionId } : {}),
        ...(params?.subscriptionId ? { subscription_id: params.subscriptionId } : {}),
      },
    });
    return response.data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

export interface SyncRCSubscriptionParams {
  entitlementId?: string;
  productId: string;
  store: string;
  originalTransactionId?: string;
  isActive: boolean;
  expiresDate?: string;
  purchaseDate?: string;
  managementUrl?: string;
}

export const syncRevenueCatSubscription = async (
  params: SyncRCSubscriptionParams
): Promise<{ synced: boolean; subscription?: any }> => {
  try {
    const response = await apiClient.post('/subscription/sync-revenuecat', params);
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      console.warn('sync-revenuecat endpoint not available on this backend version');
      return { synced: false };
    }
    console.error('Failed to sync RC subscription to backend:', error);
    return { synced: false };
  }
};

export default {
  getSubscriptionStatus,
  syncRevenueCatSubscription,
};
