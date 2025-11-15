import apiClient, { handleApiResponse, handleApiError } from './client';
import {
  Subscription,
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
  SubscriptionPortalResponse,
  ApiResponse,
} from './types';

/**
 * Subscription API Module
 * Handles subscription management with Dodo Payments
 */

/**
 * Get subscription status for the authenticated user
 */
export const getSubscriptionStatus = async (): Promise<Subscription> => {
  try {
    const response = await apiClient.get<ApiResponse<Subscription>>('/subscription/status');
    return handleApiResponse<Subscription>(response);
  } catch (error) {
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
    const response = await apiClient.post<ApiResponse<CreateSubscriptionResponse>>(
      '/subscription/create',
      data
    );
    return handleApiResponse<CreateSubscriptionResponse>(response);
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

export default {
  getSubscriptionStatus,
  createSubscription,
  cancelSubscription,
  getSubscriptionPortal,
};
