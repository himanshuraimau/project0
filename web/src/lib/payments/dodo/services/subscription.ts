// Dodo Payments subscription management service

import { getDodoClient } from '../config/client';
import { DODO_CONFIG, SUBSCRIPTION_CONFIG, SUBSCRIPTION_CONFIG_YEARLY } from '../config/constants';
import type { 
  CreateSubscriptionParams, 
  SubscriptionManagementResult,
} from '../types';

export class DodoSubscriptionService {
  /**
   * Get or create the Dodo client (lazy initialization)
   */
  private static getClient() {
    return getDodoClient();
  }

  /**
   * Get the appropriate product ID based on billing interval
   */
  private static getProductId(billingInterval: 'monthly' | 'yearly' = 'monthly'): string {
    return billingInterval === 'yearly' 
      ? DODO_CONFIG.subscriptionProductIdYearly 
      : DODO_CONFIG.subscriptionProductId;
  }

  /**
   * Get the appropriate subscription config based on billing interval
   */
  private static getSubscriptionConfig(billingInterval: 'monthly' | 'yearly' = 'monthly') {
    return billingInterval === 'yearly' ? SUBSCRIPTION_CONFIG_YEARLY : SUBSCRIPTION_CONFIG;
  }

  /**
   * Create a new subscription with Dodo Payments
   */
  static async createSubscription(
    params: CreateSubscriptionParams
  ): Promise<SubscriptionManagementResult> {
    try {
      const billingInterval = params.billingInterval || 'monthly';
      const productId = this.getProductId(billingInterval);

      // Validate configuration before making the request
      if (!DODO_CONFIG.apiKey) {
        throw new Error('DODO_PAYMENTS_API_KEY is not configured');
      }
      
      if (!productId) {
        const envVar = billingInterval === 'yearly' 
          ? 'NEXT_PUBLIC_DODO_PRODUCT_ID_PRO_SUBSCRIPTION_YEARLY'
          : 'NEXT_PUBLIC_DODO_PAYMENT_SUBSCRIPTION_ID';
        throw new Error(`${envVar} is not configured`);
      }

      const createRequest = {
        billing: {
          ...params.billingAddress,
          country: params.billingAddress.country as any,
        },
        customer: {
          email: params.userEmail,
          name: params.userName,
        },
        product_id: productId,
        quantity: 1,
        payment_link: true,
        return_url: DODO_CONFIG.returnUrl,
        ...(params.trialDays && params.trialDays > 0 ? { trial_period_days: params.trialDays } : {}),
        ...(params.discountCode ? { discount_id: params.discountCode } : {}),
        metadata: {
          userId: params.userId,
          billingInterval,
          ...params.metadata,
        },
      };

      const client = this.getClient();
      const response = await client.subscriptions.create(createRequest);

      return {
        success: true,
        subscriptionId: response.subscription_id,
        paymentLink: response.payment_link || undefined,
        data: response,
      };
    } catch (error) {
      console.error('Failed to create Dodo subscription:', error);
      
      if (error && typeof error === 'object') {
        const err = error as any;
        if (err.status === 401) {
          return {
            success: false,
            error: 'Invalid or expired API key. Please generate a new API key from Dodo Payments dashboard.',
          };
        }
      }

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
      const client = this.getClient();
      const subscription = await client.subscriptions.retrieve(subscriptionId);
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
      const subscription = await this.getSubscription(subscriptionId);
      
      if (subscription?.status === 'pending') {
        // Use PATCH to cancel pending subscriptions
        const client = this.getClient();
        const updated = await client.subscriptions.update(subscriptionId, {
          status: 'cancelled',
        });
        
        return {
          success: true,
          subscriptionId,
          data: updated,
        };
      }

      // For active subscriptions, use PATCH update - Dodo has no /cancel endpoint
      const client = this.getClient();
      const updated = await client.subscriptions.update(subscriptionId, {
        cancel_at_next_billing_date: cancelAtPeriodEnd,
      });

      return {
        success: true,
        subscriptionId,
        data: updated,
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
      const client = this.getClient();
      const response = await client.subscriptions.list({
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
   * Dodo uses previous_billing_date + next_billing_date; fallback when current_period_* is missing
   */
  static getSubscriptionPeriodInfo(subscription: any) {
    const nextBilling = subscription.next_billing_date
      ? new Date(subscription.next_billing_date)
      : undefined;
    const prevBilling = subscription.previous_billing_date
      ? new Date(subscription.previous_billing_date)
      : undefined;
    return {
      currentPeriodStart: subscription.current_period_start
        ? new Date(subscription.current_period_start)
        : prevBilling,
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end)
        : nextBilling,
      nextBillingDate: nextBilling,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end) : undefined,
      isInTrial: this.isSubscriptionInTrial(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_next_billing_date || false,
    };
  }

  /**
   * Change subscription plan to a new product (e.g., monthly to yearly)
   * Uses Dodo's dedicated changePlan API endpoint - charges saved payment method on file.
   * For payment screen / redirect flow, use createSubscription with payment_link instead.
   * Proration modes: difference_immediately (price diff), prorated_immediately (time-based)
   */
  static async changePlan(
    subscriptionId: string,
    newProductId: string,
    options?: {
      prorationBehavior?: 'prorated_immediately' | 'full_immediately' | 'difference_immediately';
      quantity?: number;
    }
  ): Promise<SubscriptionManagementResult> {
    try {
      const client = this.getClient();
      
      // Use Dodo SDK's dedicated changePlan method
      // This properly handles product changes with proration
      await client.subscriptions.changePlan(subscriptionId, {
        product_id: newProductId,
        proration_billing_mode: options?.prorationBehavior || 'full_immediately',
        quantity: options?.quantity || 1,
      });

      // Get the updated subscription to return
      const updated = await this.getSubscription(subscriptionId);

      return {
        success: true,
        subscriptionId,
        data: updated,
      };
    } catch (error) {
      console.error('Failed to change Dodo subscription plan:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to change subscription plan',
      };
    }
  }

  /**
   * @deprecated Use changePlan instead for better proration handling
   * Upgrade subscription to a new product (e.g., monthly to yearly)
   */
  static async upgradeSubscription(
    subscriptionId: string,
    newProductId: string
  ): Promise<SubscriptionManagementResult> {
    return this.changePlan(subscriptionId, newProductId);
  }
}
