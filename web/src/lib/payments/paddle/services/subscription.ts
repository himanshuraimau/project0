import { getPaddleClient } from '../config/client';
import { PADDLE_CONFIG } from '../config/constants';
import type { BillingInterval, SubscriptionManagementResult } from '../types';

export class PaddleSubscriptionService {
  private static get client() {
    return getPaddleClient();
  }

  static getPriceId(billingInterval: BillingInterval): string {
    return billingInterval === 'yearly'
      ? PADDLE_CONFIG.yearlyPriceId
      : PADDLE_CONFIG.monthlyPriceId;
  }

  static getBillingIntervalFromPriceId(priceId: string): BillingInterval {
    return priceId === PADDLE_CONFIG.yearlyPriceId ? 'yearly' : 'monthly';
  }

  static async getSubscription(subscriptionId: string) {
    try {
      return await this.client.subscriptions.get(subscriptionId);
    } catch (error) {
      console.error('Failed to get Paddle subscription:', error);
      return null;
    }
  }

  static async getSubscriptionIdFromTransaction(transactionId: string): Promise<string | null> {
    try {
      const transaction = await this.client.transactions.get(transactionId);
      return (transaction as any).subscriptionId || null;
    } catch (error) {
      console.error('Failed to get Paddle transaction:', error);
      return null;
    }
  }

  static async cancelSubscription(
    subscriptionId: string,
    effectiveFrom: 'next_billing_period' | 'immediately' = 'next_billing_period'
  ): Promise<SubscriptionManagementResult> {
    try {
      const result = await this.client.subscriptions.cancel(subscriptionId, {
        effectiveFrom,
      });

      return { success: true, subscriptionId, data: result };
    } catch (error) {
      console.error('Failed to cancel Paddle subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel subscription',
      };
    }
  }

  static async reactivateSubscription(subscriptionId: string): Promise<SubscriptionManagementResult> {
    try {
      const subscription = await this.getSubscription(subscriptionId);

      if (!subscription) {
        return { success: false, error: 'Subscription not found' };
      }

      if (subscription.scheduledChange?.action === 'cancel') {
        const result = await this.client.subscriptions.update(subscriptionId, {
          scheduledChange: null,
        });
        return { success: true, subscriptionId, data: result };
      }

      if (subscription.status === 'canceled') {
        return {
          success: false,
          error: 'This subscription is fully cancelled and cannot be reactivated. Please subscribe again.',
        };
      }

      return { success: false, error: 'Subscription does not have a pending cancellation to undo' };
    } catch (error) {
      console.error('Failed to reactivate Paddle subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reactivate subscription',
      };
    }
  }

  static async changePlan(
    subscriptionId: string,
    newPriceId: string,
    prorationBillingMode: 'prorated_immediately' | 'prorated_next_billing_period' | 'full_immediately' | 'full_next_billing_period' | 'do_not_bill' = 'prorated_immediately'
  ): Promise<SubscriptionManagementResult> {
    try {
      const result = await this.client.subscriptions.update(subscriptionId, {
        items: [{ priceId: newPriceId, quantity: 1 }],
        prorationBillingMode,
      });

      return { success: true, subscriptionId, data: result };
    } catch (error) {
      console.error('Failed to change Paddle subscription plan:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to change plan',
      };
    }
  }

  static async previewPlanChange(subscriptionId: string, newPriceId: string) {
    try {
      return await this.client.subscriptions.previewUpdate(subscriptionId, {
        items: [{ priceId: newPriceId, quantity: 1 }],
        prorationBillingMode: 'prorated_immediately',
      });
    } catch (error) {
      console.error('Failed to preview plan change:', error);
      return null;
    }
  }

  static async getPortalUrl(customerId: string, subscriptionId: string) {
    try {
      const session = await this.client.customerPortalSessions.create(customerId, [subscriptionId]);
      return session.urls?.general?.overview ?? null;
    } catch (error) {
      console.error('Failed to create portal session:', error);
      return null;
    }
  }

  static async findActiveSubscriptionForUser(userId: string): Promise<any | null> {
    try {
      const subscriptions = this.client.subscriptions.list({ status: ['active', 'trialing'] });
      for await (const sub of subscriptions) {
        const customData = (sub as any).customData || (sub as any).custom_data;
        if (customData?.userId === userId) {
          return sub;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to find active subscription for user:', error);
      return null;
    }
  }

  static mapPaddleStatus(paddleStatus: string): string {
    const statusMap: Record<string, string> = {
      active: 'ACTIVE',
      trialing: 'ACTIVE',
      paused: 'PAUSED',
      past_due: 'PAST_DUE',
      canceled: 'CANCELLED',
    };
    return statusMap[paddleStatus] || 'FAILED';
  }

  static extractBillingDates(subscription: any) {
    const currentPeriod = subscription.currentBillingPeriod;
    return {
      currentPeriodStart: currentPeriod?.startsAt ? new Date(currentPeriod.startsAt) : undefined,
      currentPeriodEnd: currentPeriod?.endsAt ? new Date(currentPeriod.endsAt) : undefined,
      nextBillingDate: subscription.nextBilledAt ? new Date(subscription.nextBilledAt) : undefined,
      cancelAtPeriodEnd: subscription.scheduledChange?.action === 'cancel',
    };
  }
}
