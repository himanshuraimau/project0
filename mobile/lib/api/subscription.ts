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

export default {
  getSubscriptionStatus,
};
