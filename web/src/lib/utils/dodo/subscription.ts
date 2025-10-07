// Dodo Payments subscription management service

import { getDodoClient } from './client';
import { DODO_CONFIG, SUBSCRIPTION_CONFIG } from './constants';
import type { 
  CreateSubscriptionParams, 
  SubscriptionManagementResult,
  DodoSubscriptionCreateRequest 
} from './types';

export class DodoSubscriptionService {
  private static client = getDodoClient();

  /**
   * Create a new subscription with Dodo Payments
   */
  static async createSubscription(
    params: CreateSubscriptionParams
  ): Promise<SubscriptionManagementResult> {
    try {
      const createRequest = {
        billing: {
          ...params.billingAddress,
          country: params.billingAddress.country as any, // Cast to satisfy Dodo's specific type requirements
        },
        customer: {
          email: params.userEmail,
          name: params.userName,
        },
        product_id: DODO_CONFIG.subscriptionProductId,
        quantity: 1,
        payment_link: true,
        return_url: DODO_CONFIG.returnUrl,
        trial_period_days: params.trialDays || SUBSCRIPTION_CONFIG.trialDays,
        metadata: {
          userId: params.userId,
          ...params.metadata,
        },
      };

      const response = await this.client.subscriptions.create(createRequest);

      return {
        success: true,
        subscriptionId: response.subscription_id,
        paymentLink: response.payment_link || undefined,
        data: response,
      };
    } catch (error) {
      console.error('Failed to create Dodo subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Retrieve subscription details from Dodo
   */
  static async getSubscription(
    subscriptionId: string
  ): Promise<any | null> {
    try {
      const subscription = await this.client.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Failed to retrieve Dodo subscription:', error);
      return null;
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<SubscriptionManagementResult> {
    try {
      // Note: Dodo Payments cancellation - using a generic approach
      // This may need to be adjusted based on actual Dodo API
      const response = await fetch(`${DODO_CONFIG.baseUrl}/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DODO_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancel_at_next_billing_date: cancelAtPeriodEnd,
        }),
      });

      if (!response.ok) {
        throw new Error(`Cancel request failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        subscriptionId,
        data,
      };
    } catch (error) {
      console.error('Failed to cancel Dodo subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * List all subscriptions for debugging/admin purposes
   */
  static async listSubscriptions(params?: {
    customerId?: string;
    status?: 'pending' | 'active' | 'on_hold' | 'cancelled' | 'failed' | 'expired';
    pageSize?: number;
  }): Promise<any[]> {
    try {
      const response = await this.client.subscriptions.list({
        customer_id: params?.customerId,
        status: params?.status,
        page_size: params?.pageSize || 10,
      });

      return response.items || [];
    } catch (error) {
      console.error('Failed to list Dodo subscriptions:', error);
      return [];
    }
  }

  /**
   * Sync subscription status from Dodo to our database
   */
  static async syncSubscriptionStatus(
    subscriptionId: string
  ): Promise<any | null> {
    try {
      const dodoSubscription = await this.getSubscription(subscriptionId);
      
      if (!dodoSubscription) {
        console.error('Subscription not found in Dodo:', subscriptionId);
        return null;
      }

      // TODO: Update our database with the latest status
      // This will be implemented when we create the database service

      return dodoSubscription;
    } catch (error) {
      console.error('Failed to sync subscription status:', error);
      return null;
    }
  }

  /**
   * Check if a subscription is active
   */
  static isSubscriptionActive(subscription: any): boolean {
    return subscription.status === 'active' && 
           (!subscription.cancelled_at || subscription.cancel_at_next_billing_date === false);
  }

  /**
   * Check if a subscription is in trial period
   */
  static isSubscriptionInTrial(subscription: any): boolean {
    if (!subscription.trial_end) return false;
    return new Date(subscription.trial_end) > new Date();
  }

  /**
   * Get subscription billing period info
   */
  static getSubscriptionPeriodInfo(subscription: any) {
    return {
      currentPeriodStart: subscription.current_period_start 
        ? new Date(subscription.current_period_start) 
        : null,
      currentPeriodEnd: subscription.current_period_end 
        ? new Date(subscription.current_period_end) 
        : null,
      nextBillingDate: new Date(subscription.next_billing_date),
      trialEnd: subscription.trial_end 
        ? new Date(subscription.trial_end) 
        : null,
      isInTrial: this.isSubscriptionInTrial(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_next_billing_date || false,
    };
  }
}