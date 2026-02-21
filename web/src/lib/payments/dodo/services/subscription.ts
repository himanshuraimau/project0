import { getDodoClient } from '../config/client';
import { DODO_CONFIG, SUBSCRIPTION_CONFIG, SUBSCRIPTION_CONFIG_YEARLY, REGIONAL_PAYMENT_CONFIG, type PaymentMethodType } from '../config/constants';
import type { CreateSubscriptionParams, SubscriptionManagementResult, CreateCheckoutSessionParams, CheckoutSessionResult, RegionalCheckoutOptions } from '../types';

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
   * Build checkout session request with regional payment method support
   * 
   * IMPORTANT: Regional params (billing_currency, allowed_payment_method_types) 
   * only work when Adaptive Currency is enabled in Dodo dashboard.
   */
  private static buildCheckoutRequest(params: CreateCheckoutSessionParams) {
    const { regionalOptions } = params;
    const hasRegion = regionalOptions?.region && regionalOptions.region !== 'DEFAULT';

    const customerData: Record<string, any> = {
      email: params.userEmail,
      name: params.userName,
    };

    // Add phone number if provided (required for UPI)
    // Format for India to ensure +91 prefix
    if (regionalOptions?.phoneNumber) {
      const phone = regionalOptions.region === 'IN' 
        ? this.formatIndianPhone(regionalOptions.phoneNumber)
        : regionalOptions.phoneNumber;
      customerData.phone_number = phone;
    }

    const request: Record<string, any> = {
      product_cart: [{ product_id: params.productId, quantity: 1 }],
      customer: customerData,
      return_url: DODO_CONFIG.returnUrl,
      metadata: {
        userId: params.userId,
        ...params.metadata,
      },
    };

    // Add discount code if provided
    if (params.discountCode) {
      request.discount_code = params.discountCode;
    }

    // Only add regional payment configuration if a specific region is selected
    // This ensures the default checkout behavior works when no region is specified
    if (hasRegion) {
      const regionalConfig = this.getRegionalConfig(regionalOptions.region);

      // Add allowed payment methods
      const paymentMethods = regionalOptions.allowedPaymentMethods || regionalConfig.paymentMethods;
      if (paymentMethods && paymentMethods.length > 0) {
        request.allowed_payment_method_types = paymentMethods;
      }

      // Add billing currency
      const billingCurrency = regionalOptions.billingCurrency || regionalConfig.currency;
      if (billingCurrency) {
        request.billing_currency = billingCurrency;
      }

      // Add billing address - ensure zipcode is never empty for India
      // Use provided address or construct from regional config
      if (regionalOptions.billingAddress && regionalOptions.billingAddress.zipcode) {
        request.billing_address = regionalOptions.billingAddress;
      } else if (regionalConfig.country) {
        // Use provided zipcode or default pincode for the region
        const defaultZipcode = regionalConfig.country === 'IN' ? '110001' : '10001';
        const zipcode = regionalOptions.billingAddress?.zipcode || defaultZipcode;
        
        request.billing_address = {
          country: regionalConfig.country,
          zipcode: zipcode,
        };
      }
    }

    return request;
  }

  /**
   * Create a checkout session with support for regional payment methods (UPI, Google Pay, etc.)
   * 
   * For India (UPI + Google Pay):
   * - Set regionalOptions.region = 'IN'
   * - Billing currency will be set to INR
   * - UPI, Google Pay, Credit, and Debit cards will be enabled
   * 
   * Test UPI IDs (test_mode only):
   * - success@upi → successful payment
   * - failure@upi → failed payment
   */
  static async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResult> {
    try {
      const client = this.getClient();
      const request = this.buildCheckoutRequest(params);

      console.log('Creating checkout session with config:', {
        productId: params.productId,
        region: params.regionalOptions?.region,
        paymentMethods: request.allowed_payment_method_types,
        currency: request.billing_currency,
        billingCountry: request.billing_address?.country,
      });

      const session = await (client as any).checkoutSessions.create(request);

      return {
        success: true,
        checkoutUrl: session.checkout_url,
        sessionId: session.session_id,
      };
    } catch (error) {
      console.error('Failed to create Dodo checkout session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a checkout session specifically configured for India (UPI + Google Pay)
   * 
   * Requirements for UPI:
   * 1. Billing country must be IN
   * 2. Currency must be INR
   * 3. For non-Indian merchants: Adaptive Currency must be enabled in Dodo dashboard
   * 
   * Test UPI IDs:
   * - success@upi → successful payment
   * - failure@upi → failed payment
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
        billingCurrency: 'INR',
        billingCountry: 'IN',
        phoneNumber: params.phoneNumber,
        billingAddress: params.zipcode ? {
          country: 'IN',
          zipcode: params.zipcode,
        } : undefined,
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
