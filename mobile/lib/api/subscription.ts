import apiClient, { handleApiResponse, handleApiError } from './client';
import {
  SubscriptionStatusResponse,
  GetSubscriptionStatusParams,
  CreateSubscriptionRequest,
  CreateSubscriptionBackendResponse,
  CreateSubscriptionApiEnvelope,
  CreateSubscriptionResponse,
  LegacyCreateSubscriptionResponse,
  SubscriptionPortalResponse,
  PaymentLinkResponse,
  CancelPendingResponse,
  ApiResponse,
} from './types';

/**
 * Subscription API Module
 * Handles subscription management with Paddle Billing
 */

/**
 * Get subscription status for the authenticated user
 * Returns full subscription status including access info
 */
export const getSubscriptionStatus = async (
  params?: GetSubscriptionStatusParams
): Promise<SubscriptionStatusResponse> => {
  try {
    console.log('📡 API: Calling GET /subscription/status...');
    const response = await apiClient.get<SubscriptionStatusResponse>('/subscription/status', {
      params: {
        ...(params?.transactionId ? { transaction_id: params.transactionId } : {}),
        ...(params?.subscriptionId ? { subscription_id: params.subscriptionId } : {}),
      },
    });
    console.log('📡 API: Response received from /subscription/status');
    console.log('📡 API: Response status:', response.status);
    console.log('📡 API: Response data:', JSON.stringify(response.data, null, 2));
    // The subscription status endpoint returns data directly, not wrapped in ApiResponse
    return response.data;
  } catch (error: any) {
    console.error('📡 API: Error in getSubscriptionStatus');
    console.error('📡 API: Error message:', error.message);
    console.error('📡 API: Error response:', error.response?.data);
    console.error('📡 API: Error status:', error.response?.status);
    return handleApiError(error);
  }
};

/**
 * Create a new subscription
 * @param data - Subscription creation data
 */
export const createSubscription = async (
  data: CreateSubscriptionRequest
): Promise<CreateSubscriptionResponse> => {
  try {
    const response = await apiClient.post<CreateSubscriptionBackendResponse>(
      '/subscription/mobile-checkout',
      data
    );

    const payload = response.data as CreateSubscriptionBackendResponse;

    // New response shape: { success, data: { checkoutUrl } }
    if (
      (payload as CreateSubscriptionApiEnvelope)?.success &&
      (payload as CreateSubscriptionApiEnvelope)?.data?.checkoutUrl
    ) {
      return {
        checkoutUrl: (payload as CreateSubscriptionApiEnvelope).data!.checkoutUrl,
        expiresAt: (payload as CreateSubscriptionApiEnvelope).data!.expiresAt,
      };
    }

    // Legacy fallback: { checkoutUrl, sessionId? }
    if ((payload as LegacyCreateSubscriptionResponse)?.checkoutUrl) {
      return {
        checkoutUrl: (payload as LegacyCreateSubscriptionResponse).checkoutUrl,
      };
    }

    throw new Error((payload as CreateSubscriptionApiEnvelope)?.error || 'No checkout URL returned');
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (): Promise<{ message: string }> => {
  try {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      '/subscription/cancel'
    );
    return handleApiResponse<{ message: string }>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get subscription portal URL for managing subscription
 */
export const getSubscriptionPortal = async (): Promise<SubscriptionPortalResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<SubscriptionPortalResponse>>(
      '/subscription/portal'
    );
    return handleApiResponse<SubscriptionPortalResponse>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get payment link for a pending subscription
 * Used when user abandons checkout and needs to complete payment later
 */
export const getPaymentLink = async (): Promise<PaymentLinkResponse> => {
  try {
    const response = await apiClient.get<ApiResponse<PaymentLinkResponse>>(
      '/subscription/payment-link'
    );
    return handleApiResponse<PaymentLinkResponse>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Cancel a pending subscription
 * Used when user abandons checkout and wants to cancel the pending subscription
 */
export const cancelPendingSubscription = async (): Promise<CancelPendingResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<CancelPendingResponse>>(
      '/subscription/cancel-pending'
    );
    return handleApiResponse<CancelPendingResponse>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export default {
  getSubscriptionStatus,
  createSubscription,
  cancelSubscription,
  getSubscriptionPortal,
  getPaymentLink,
  cancelPendingSubscription,
};
