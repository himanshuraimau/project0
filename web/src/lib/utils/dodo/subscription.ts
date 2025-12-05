// Dodo Payments subscription management service

import { getDodoClient } from './client';
import { DODO_CONFIG, SUBSCRIPTION_CONFIG, SUBSCRIPTION_CONFIG_YEARLY } from './constants';
import type { 
  CreateSubscriptionParams, 
  SubscriptionManagementResult,
  DodoSubscriptionCreateRequest 
} from './types';

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

      console.log('Creating Dodo subscription with params:', {
        email: params.userEmail,
        productId,
        billingInterval,
        environment: DODO_CONFIG.environment,
        hasApiKey: !!DODO_CONFIG.apiKey,
        apiKeyLength: DODO_CONFIG.apiKey?.length,
        apiKeyPrefix: DODO_CONFIG.apiKey?.substring(0, 15) + '...',
      });

      const createRequest = {
        billing: {
          ...params.billingAddress,
          country: params.billingAddress.country as any, // Cast to satisfy Dodo's specific type requirements
        },
        customer: {
          email: params.userEmail,
          name: params.userName,
        },
        product_id: productId,
        quantity: 1,
        payment_link: true,
        return_url: DODO_CONFIG.returnUrl,
        // Only include trial_period_days if it's greater than 0
        ...(params.trialDays && params.trialDays > 0 ? { trial_period_days: params.trialDays } : {}),
        metadata: {
          userId: params.userId,
          billingInterval,
          ...params.metadata,
        },
      };

      console.log('Dodo subscription request:', JSON.stringify(createRequest, null, 2));

      const client = this.getClient();
      const response = await client.subscriptions.create(createRequest);

      console.log('Dodo subscription created successfully:', {
        subscriptionId: response.subscription_id,
        hasPaymentLink: !!response.payment_link,
      });

      return {
        success: true,
        subscriptionId: response.subscription_id,
        paymentLink: response.payment_link || undefined,
        data: response,
      };
    } catch (error) {
      console.error('Failed to create Dodo subscription:', error);
      
      // Enhanced error logging for debugging
      if (error && typeof error === 'object') {
        const err = error as any;
        console.error('Error details:', {
          status: err.status,
          headers: err.headers,
          message: err.message,
          stack: err.stack,
        });

        // Provide helpful error messages based on status code
        if (err.status === 401) {
          console.error('\n⚠️  AUTHENTICATION ERROR (401):');
          console.error('   Your Dodo Payments API key is invalid or expired.');
          console.error('   Please follow these steps:');
          console.error('   1. Go to https://dashboard.dodopayments.com/');
          console.error('   2. Navigate to Settings > API Keys');
          console.error('   3. Generate a new API key for TEST MODE');
          console.error('   4. Update DODO_PAYMENTS_API_KEY in your .env file');
          console.error('   5. Restart your development server\n');
          
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