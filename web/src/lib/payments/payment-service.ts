import { DodoSubscriptionService, type BillingInterval, type RegionalCheckoutOptions } from './dodo';
import { SubscriptionService } from '../subscription-service';
import { FeatureGateService } from '../feature-gate-service';

export type PlanComparison = 'same' | 'upgrade' | 'downgrade';

// Region codes for payment method selection
export type PaymentRegion = 'IN' | 'US' | 'EU' | 'DEFAULT';

export interface CreateSubscriptionParams {
  userId: string;
  userEmail: string;
  userName: string;
  billingInterval: BillingInterval;
  discountCode?: string;
  // Regional payment options (for UPI, Google Pay, etc.)
  region?: PaymentRegion;
  phoneNumber?: string;
  zipcode?: string;
  city?: string;
  state?: string;
  street?: string;
}

export interface PlanChangeParams {
  userId: string;
  targetBillingInterval: BillingInterval;
  immediate?: boolean;
}

export interface CancelSubscriptionParams {
  userId: string;
  cancelAtPeriodEnd?: boolean;
}

export class PaymentService {
  static compareBillingIntervals(current: BillingInterval, requested: BillingInterval): PlanComparison {
    if (current === requested) return 'same';
    if (current === 'monthly' && requested === 'yearly') return 'upgrade';
    return 'downgrade';
  }

  static getProductId(billingInterval: BillingInterval): string {
    const productId = billingInterval === 'yearly'
      ? process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO_SUBSCRIPTION_YEARLY
      : process.env.NEXT_PUBLIC_DODO_PAYMENT_SUBSCRIPTION_ID;

    if (!productId) {
      const envVar = billingInterval === 'yearly'
        ? 'NEXT_PUBLIC_DODO_PRODUCT_ID_PRO_SUBSCRIPTION_YEARLY'
        : 'NEXT_PUBLIC_DODO_PAYMENT_SUBSCRIPTION_ID';
      throw new Error(`${envVar} not configured`);
    }

    return productId;
  }

  static getSubscriptionAmount(billingInterval: BillingInterval): number {
    return billingInterval === 'yearly' ? 89.00 : 19.99;
  }

  static getBillingIntervalFromProductId(productId: string): BillingInterval {
    const yearlyProductId = process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO_SUBSCRIPTION_YEARLY;
    return productId === yearlyProductId ? 'yearly' : 'monthly';
  }

  static async createSubscription(params: CreateSubscriptionParams) {
    const { userId, userEmail, userName, billingInterval, discountCode, region, phoneNumber, zipcode, city, state, street } = params;

    const existingSubscription = await SubscriptionService.getSubscriptionWithSync(userId);

    if (existingSubscription) {
      if (existingSubscription.status === 'ACTIVE') {
        throw new Error('You already have an active subscription');
      }

      if (existingSubscription.status === 'PENDING') {
        try {
          await DodoSubscriptionService.cancelSubscription(existingSubscription.dodoSubscriptionId, false);
          await SubscriptionService.deleteSubscription(userId);
        } catch (error) {
          console.error('Error cancelling pending subscription:', error);
        }
      }

      if (['CANCELLED', 'FAILED', 'EXPIRED', 'ON_HOLD'].includes(existingSubscription.status)) {
        try {
          await SubscriptionService.deleteSubscription(userId);
        } catch (error) {
          console.error('Error deleting stale subscription:', error);
        }
      }
    }

    const productId = this.getProductId(billingInterval);
    const amount = this.getSubscriptionAmount(billingInterval);

    // Always build regional options with billing address for 3DS card auth.
    // Even when no region is selected, we need billing data.
    const hasBillingInput = zipcode || city || state || street;
    const effectiveRegion = region || 'IN';
    const regionalOptions: RegionalCheckoutOptions = {
      region: effectiveRegion,
      phoneNumber,
      billingAddress: {
        country: effectiveRegion === 'US' ? 'US' : 'IN',
        zipcode: zipcode || '',
        city: city || '',
        state: state || '',
        street: street || '',
      },
    };

    const checkoutSession = await DodoSubscriptionService.createCheckoutSession({
      userId,
      userEmail,
      userName,
      productId,
      discountCode,
      metadata: {
        billingInterval,
        productId,
        amount: String(amount),
        region: region || 'DEFAULT',
      },
      regionalOptions,
    });

    if (!checkoutSession.success || !checkoutSession.checkoutUrl) {
      throw new Error(checkoutSession.error || 'Failed to create checkout session');
    }

    return {
      checkoutUrl: checkoutSession.checkoutUrl,
      sessionId: checkoutSession.sessionId,
      subscription: { id: checkoutSession.sessionId ?? '', status: 'PENDING' } as any,
    };
  }

  /**
   * Create a subscription with India payment methods (UPI + Google Pay)
   * 
   * Requirements:
   * - Billing country will be set to IN
   * - Currency will be INR
   * - For non-Indian merchants: Adaptive Currency must be enabled in Dodo dashboard
   * 
   * Test UPI IDs (test_mode only):
   * - success@upi → successful payment
   * - failure@upi → failed payment
   */
  static async createIndiaSubscription(params: Omit<CreateSubscriptionParams, 'region'> & {
    phoneNumber?: string;
    zipcode?: string;
  }) {
    return this.createSubscription({
      ...params,
      region: 'IN',
    });
  }

  static async changePlan(params: PlanChangeParams) {
    const { userId, targetBillingInterval, immediate = true } = params;

    const existingSubscription = await SubscriptionService.getSubscriptionWithSync(userId);

    if (!existingSubscription) {
      throw new Error('No active subscription found');
    }

    const dodoSubscription = await DodoSubscriptionService.getSubscription(existingSubscription.dodoSubscriptionId);

    if (!dodoSubscription) {
      throw new Error('Could not verify subscription status. Please try again.');
    }

    if (dodoSubscription.status !== 'active') {
      if (dodoSubscription.status === 'pending') {
        throw new Error('Please complete your pending payment before changing plans.');
      }
      throw new Error(`Subscription must be active to change plans. Current status: ${dodoSubscription.status}`);
    }

    const currentBillingInterval = this.getBillingIntervalFromProductId(dodoSubscription.product_id);
    const comparison = this.compareBillingIntervals(currentBillingInterval, targetBillingInterval);

    if (comparison === 'same') {
      throw new Error(`You are already on the ${targetBillingInterval} plan`);
    }

    const targetProductId = this.getProductId(targetBillingInterval);

    if (immediate) {
      const changeResult = await DodoSubscriptionService.changePlan(
        existingSubscription.dodoSubscriptionId,
        targetProductId,
        { prorationBehavior: 'full_immediately', quantity: 1 }
      );

      if (!changeResult.success) {
        throw new Error(changeResult.error || 'Failed to change subscription plan');
      }

      await SubscriptionService.updateSubscriptionProductId(existingSubscription.dodoSubscriptionId, targetProductId);

      const newAmount = this.getSubscriptionAmount(targetBillingInterval);
      await SubscriptionService.updateSubscriptionMetadata(existingSubscription.dodoSubscriptionId, {
        ...((existingSubscription.metadata as any) || {}),
        amount: newAmount,
      });

      const updatedSubscription = await SubscriptionService.getSubscriptionWithSync(userId);

      return {
        subscription: updatedSubscription!,
        changeType: comparison,
        scheduledChange: false,
      };
    } else {
      const metadata = (existingSubscription.metadata as any) || {};
      delete metadata.scheduledProductId;
      delete metadata.scheduledPlanType;
      delete metadata.scheduledAt;

      await SubscriptionService.updateSubscriptionMetadata(existingSubscription.dodoSubscriptionId, {
        ...metadata,
        scheduledProductId: targetProductId,
        scheduledPlanType: targetBillingInterval,
        scheduledAt: new Date().toISOString(),
      });

      const updatedSubscription = await SubscriptionService.getSubscriptionWithSync(userId);

      return {
        subscription: updatedSubscription!,
        changeType: comparison,
        scheduledChange: true,
      };
    }
  }

  static async cancelSubscription(params: CancelSubscriptionParams) {
    const { userId, cancelAtPeriodEnd = true } = params;

    const subscription = await SubscriptionService.getUserSubscription(userId);

    if (!subscription) {
      throw new Error('No subscription found');
    }

    if (subscription.status === 'CANCELLED') {
      throw new Error('Subscription is already cancelled');
    }

    const metadata = (subscription.metadata as any) || {};
    const hasScheduledChange = metadata.scheduledProductId && metadata.scheduledProductId !== subscription.productId;

    if (hasScheduledChange) {
      delete metadata.scheduledProductId;
      delete metadata.scheduledPlanType;
      delete metadata.scheduledAt;
      await SubscriptionService.updateSubscriptionMetadata(subscription.dodoSubscriptionId, metadata);
    }

    if (cancelAtPeriodEnd) {
      const cancelResult = await DodoSubscriptionService.cancelSubscription(subscription.dodoSubscriptionId, true);
      if (!cancelResult.success) {
        throw new Error(cancelResult.error || 'Failed to cancel subscription with Dodo');
      }
      return await SubscriptionService.updateSubscriptionCancelState(subscription.dodoSubscriptionId, true);
    }

    const cancelResult = await DodoSubscriptionService.cancelSubscriptionImmediately(subscription.dodoSubscriptionId);
    if (!cancelResult.success) {
      throw new Error(cancelResult.error || 'Failed to cancel subscription with Dodo');
    }

    return await SubscriptionService.updateSubscriptionStatus(subscription.dodoSubscriptionId, 'CANCELLED', {
      nextBillingDate: null,
      cancelledAt: new Date(),
      cancelAtPeriodEnd: true,
    });
  }

  static async reactivateSubscription(userId: string) {
    const subscription = await SubscriptionService.getUserSubscription(userId);

    if (!subscription) {
      throw new Error('No subscription found');
    }

    if (subscription.status !== 'ACTIVE' || !subscription.cancelAtPeriodEnd) {
      throw new Error('Only subscriptions cancelled at period end can be reactivated');
    }

    const reactivateResult = await DodoSubscriptionService.reactivateSubscription(subscription.dodoSubscriptionId);

    if (!reactivateResult.success) {
      throw new Error(reactivateResult.error || 'Failed to reactivate subscription');
    }

    await SubscriptionService.updateSubscriptionCancelState(subscription.dodoSubscriptionId, false);

    return await SubscriptionService.getUserSubscription(userId);
  }

  static async getSubscriptionInfo(userId: string) {
    const subscription = await SubscriptionService.getUserSubscription(userId);

    if (!subscription) {
      return {
        hasSubscription: false,
        status: null,
        billingInterval: null,
        amount: null,
        nextBillingDate: null,
        cancelAtPeriodEnd: false,
        scheduledChange: null,
      };
    }

    const metadata = (subscription.metadata as any) || {};
    const scheduledChange = metadata.scheduledProductId
      ? { targetBillingInterval: metadata.scheduledPlanType as BillingInterval, scheduledAt: metadata.scheduledAt }
      : null;

    const currentBillingInterval = this.getBillingIntervalFromProductId(subscription.productId);

    return {
      hasSubscription: true,
      status: subscription.status,
      billingInterval: currentBillingInterval,
      amount: subscription.amount,
      nextBillingDate: subscription.nextBillingDate,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
      scheduledChange,
      usageStats: await FeatureGateService.getUserUsageStats(userId),
    };
  }
}
