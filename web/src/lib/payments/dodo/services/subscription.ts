import { getDodoClient } from '../config/client';
import { DODO_CONFIG, SUBSCRIPTION_CONFIG, SUBSCRIPTION_CONFIG_YEARLY, REGIONAL_PAYMENT_CONFIG, type PaymentMethodType } from '../config/constants';
import type { CreateSubscriptionParams, SubscriptionManagementResult, CreateCheckoutSessionParams, CheckoutSessionResult, RegionalCheckoutOptions } from '../types';
import { prisma } from '@/lib/prisma';

export class DodoSubscriptionService {
  private static getClient() {
    return getDodoClient();
  }

  private static getProductId(billingInterval: 'monthly' | 'yearly' = 'monthly'): string {
    return billingInterval === 'yearly'
      ? DODO_CONFIG.subscriptionProductIdYearly
      : DODO_CONFIG.subscriptionProductId;
  }

  private static getSubscriptionConfig(billingInterval: 'monthly' | 'yearly' = 'monthly') {
    return billingInterval === 'yearly' ? SUBSCRIPTION_CONFIG_YEARLY : SUBSCRIPTION_CONFIG;
  }

  /**
   * Get regional payment configuration based on region code
   */
  private static getRegionalConfig(region?: 'IN' | 'US' | 'EU' | 'DEFAULT') {
    switch (region) {
      case 'IN':
        return REGIONAL_PAYMENT_CONFIG.IN;
      case 'US':
        return REGIONAL_PAYMENT_CONFIG.US;
      default:
        return REGIONAL_PAYMENT_CONFIG.DEFAULT;
    }
  }

  /**
   * Format phone number for India (ensure +91 prefix)
   */
  private static formatIndianPhone(phone: string): string {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (cleaned.startsWith('+91')) return cleaned;
    if (cleaned.startsWith('91') && cleaned.length === 12) return '+' + cleaned;
    if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) return '+91' + cleaned;
    return phone;
  }

  /**
   * Create a checkout URL using subscriptions.create() + payment_link: true.
   *
   * This mirrors the vibepost implementation that works reliably with Indian
   * cards (3DS / RuPay) by:
   *  1. Pre-creating a Dodo customer once and persisting the ID.
   *  2. Passing a full billing address so the card gateway has data for 3DS.
   *  3. Using the Subscriptions API (not Checkout Sessions) which correctly
   *     handles 3DS authentication for Indian payment methods.
   */
  static async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResult> {
    try {
      const client = this.getClient();
      const { regionalOptions } = params;

      // ── 1. Customer: reuse stored ID or create a new one ─────────────────
      let customerId: string;

      const user = await prisma.user.findUnique({ where: { id: params.userId } });

      if (user?.dodoCustomerId) {
        customerId = user.dodoCustomerId;
        console.log('Reusing Dodo customer:', customerId);
      } else {
        const customer = await (client as any).customers.create({
          name: params.userName,
          email: params.userEmail,
        });
        customerId = customer.customer_id;
        // Persist so we reuse it on future checkouts
        await prisma.user.update({
          where: { id: params.userId },
          data: { dodoCustomerId: customerId },
        });
        console.log('Created Dodo customer:', customerId);
      }

      // ── 2. Billing address (required for 3DS / RuPay card auth) ──────────
      const addr = regionalOptions?.billingAddress;
      const billing = {
        city:    addr?.city    || 'Default City',
        country: addr?.country || 'IN',
        state:   addr?.state   || 'Default State',
        street:  addr?.street  || 'Default Address',
        zipcode: addr?.zipcode || '110001',
      };

      // ── 3. Build subscription request ─────────────────────────────────────
      const subscriptionRequest: Record<string, any> = {
        billing,
        customer: { customer_id: customerId },
        product_id: params.productId,
        payment_link: true,
        return_url: DODO_CONFIG.returnUrl,
        quantity: 1,
        metadata: {
          userId: params.userId,
          ...params.metadata,
        },
      };

      if (params.discountCode) {
        subscriptionRequest.discount_code = params.discountCode;
      }

      console.log('Creating Dodo subscription (subscriptions.create + payment_link):', {
        productId: params.productId,
        customerId,
        billingCountry: billing.country,
        billingCity: billing.city,
      });

      const subscription = await (client as any).subscriptions.create(subscriptionRequest);

      if (!subscription.payment_link) {
        throw new Error('Dodo did not return a payment_link');
      }

      return {
        success: true,
        checkoutUrl: subscription.payment_link,
        sessionId: subscription.subscription_id,
      };
    } catch (error) {
      console.error('Failed to create Dodo subscription checkout:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * @deprecated Use createCheckoutSession — kept for backward compatibility.
   */
  static async createIndiaCheckoutSession(params: {
    userId: string;
    userEmail: string;
    userName: string;
    productId: string;
    phoneNumber?: string;
    zipcode?: string;
    discountCode?: string;
    metadata?: Record<string, unknown>;
  }): Promise<CheckoutSessionResult> {
    return this.createCheckoutSession({
      ...params,
      regionalOptions: {
        region: 'IN',
        billingAddress: params.zipcode ? { country: 'IN', zipcode: params.zipcode } : undefined,
      },
    });
  }

  static async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionManagementResult> {
    try {
      const billingInterval = params.billingInterval || 'monthly';
      const productId = this.getProductId(billingInterval);

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

  static async getSubscription(subscriptionId: string): Promise<any | null> {
    try {
      const client = this.getClient();
      return await client.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      console.error('Failed to retrieve Dodo subscription:', error);
      return null;
    }
  }

  static async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<SubscriptionManagementResult> {
    try {
      const subscription = await this.getSubscription(subscriptionId);

      if (subscription?.status === 'pending') {
        const client = this.getClient();
        const updated = await client.subscriptions.update(subscriptionId, { status: 'cancelled' });
        return { success: true, subscriptionId, data: updated };
      }

      const client = this.getClient();
      const updated = await client.subscriptions.update(subscriptionId, { cancel_at_next_billing_date: cancelAtPeriodEnd });

      return { success: true, subscriptionId, data: updated };
    } catch (error) {
      console.error('Failed to cancel Dodo subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async reactivateSubscription(subscriptionId: string): Promise<SubscriptionManagementResult> {
    try {
      const subscription = await this.getSubscription(subscriptionId);
      if (subscription?.status === 'cancelled') {
        return {
          success: false,
          error: 'This subscription is already cancelled and cannot be reactivated. Please subscribe again.',
        };
      }

      const client = this.getClient();
      const updated = await client.subscriptions.update(subscriptionId, { cancel_at_next_billing_date: false });

      return { success: true, subscriptionId, data: updated };
    } catch (error) {
      console.error('Failed to reactivate Dodo subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async cancelSubscriptionImmediately(subscriptionId: string): Promise<SubscriptionManagementResult> {
    try {
      const client = this.getClient();
      const updated = await client.subscriptions.update(subscriptionId, { status: 'cancelled' });
      return { success: true, subscriptionId, data: updated };
    } catch (error) {
      console.error('Failed to cancel Dodo subscription immediately:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

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

  static isSubscriptionActive(subscription: any): boolean {
    return subscription.status === 'active' && (!subscription.cancelled_at || subscription.cancel_at_next_billing_date === false);
  }

  static isSubscriptionInTrial(subscription: any): boolean {
    if (!subscription.trial_end) return false;
    return new Date(subscription.trial_end) > new Date();
  }

  static getSubscriptionPeriodInfo(subscription: any) {
    const nextBilling = subscription.next_billing_date ? new Date(subscription.next_billing_date) : undefined;
    const prevBilling = subscription.previous_billing_date ? new Date(subscription.previous_billing_date) : undefined;

    return {
      currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start) : prevBilling,
      currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end) : nextBilling,
      nextBillingDate: nextBilling,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end) : undefined,
      isInTrial: this.isSubscriptionInTrial(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_next_billing_date || false,
    };
  }

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

      await client.subscriptions.changePlan(subscriptionId, {
        product_id: newProductId,
        proration_billing_mode: options?.prorationBehavior || 'full_immediately',
        quantity: options?.quantity || 1,
      });

      const updated = await this.getSubscription(subscriptionId);

      return { success: true, subscriptionId, data: updated };
    } catch (error) {
      console.error('Failed to change Dodo subscription plan:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to change subscription plan',
      };
    }
  }

  /** @deprecated Use changePlan instead */
  static async upgradeSubscription(subscriptionId: string, newProductId: string): Promise<SubscriptionManagementResult> {
    return this.changePlan(subscriptionId, newProductId);
  }
}
