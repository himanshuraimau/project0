/**
 * Centralized Payment Service
 * Consolidates all payment-related business logic
 * Integrates with: Dodo Payments, SubscriptionService, FeatureGateService
 */

import { DodoSubscriptionService, type BillingInterval } from './dodo';
import { SubscriptionService } from '../subscription-service';
import { FeatureGateService } from '../feature-gate-service';
import { PRO_PLAN_LIMITS } from '../config/subscription-limits';

export type PlanComparison = 'same' | 'upgrade' | 'downgrade';

export interface CreateSubscriptionParams {
  userId: string;
  userEmail: string;
  userName: string;
  billingInterval: BillingInterval;
  discountCode?: string;
}

export interface PlanChangeParams {
  userId: string;
  targetBillingInterval: BillingInterval;
  immediate?: boolean; // true = immediate with proration, false = scheduled at renewal
}

export interface CancelSubscriptionParams {
  userId: string;
  cancelAtPeriodEnd?: boolean;
}

/**
 * Main Payment Service Class
 */
export class PaymentService {
  
  /**
   * Compare billing intervals (monthly vs yearly)
   * Since we only have one tier (PRO), we consider yearly an "upgrade" from monthly
   */
  static compareBillingIntervals(
    current: BillingInterval,
    requested: BillingInterval
  ): PlanComparison {
    if (current === requested) return 'same';
    // Yearly is considered an upgrade (better value)
    if (current === 'monthly' && requested === 'yearly') return 'upgrade';
    return 'downgrade';
  }

  /**
   * Get product ID for billing interval
   */
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

  /**
   * Get subscription amount for billing interval
   */
  static getSubscriptionAmount(billingInterval: BillingInterval): number {
    return billingInterval === 'yearly' ? 89.00 : 19.99;
  }

  /**
   * Get billing interval from product ID
   */
  static getBillingIntervalFromProductId(productId: string): BillingInterval {
    const yearlyProductId = process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO_SUBSCRIPTION_YEARLY;
    return productId === yearlyProductId ? 'yearly' : 'monthly';
  }

  /**
   * Create a new subscription
   * Handles: existing subscription cancellation, discount codes, feature limits
   */
  static async createSubscription(params: CreateSubscriptionParams) {
    const { userId, userEmail, userName, billingInterval, discountCode } = params;

    // Check for existing subscription
    const existingSubscription = await SubscriptionService.getSubscriptionWithSync(userId);

    if (existingSubscription) {
      if (existingSubscription.status === 'ACTIVE') {
        // If user already has active subscription, shouldn't create a new one
        throw new Error('You already have an active subscription');
      }

      // If user has a PENDING subscription, cancel it first
      if (existingSubscription.status === 'PENDING') {
        console.log('User has pending subscription, cancelling it first...');
        try {
          await DodoSubscriptionService.cancelSubscription(
            existingSubscription.dodoSubscriptionId,
            false
          );
          await SubscriptionService.deleteSubscription(userId);
        } catch (error) {
          console.error('Error cancelling pending subscription:', error);
          // Continue anyway - we'll try to create a new one
        }
      }

      // If user has a stale (failed/cancelled/expired) subscription, delete the DB record so
      // the webhook can create a fresh one when the new checkout session fires subscription.created
      if (['CANCELLED', 'FAILED', 'EXPIRED', 'ON_HOLD'].includes(existingSubscription.status)) {
        console.log('Removing stale subscription record before checkout:', existingSubscription.status);
        try {
          await SubscriptionService.deleteSubscription(userId);
        } catch (error) {
          console.error('Error deleting stale subscription:', error);
        }
      }
    }

    // Get product ID and amount
    const productId = this.getProductId(billingInterval);
    const amount = this.getSubscriptionAmount(billingInterval);

    // Create a Dodo Checkout Session (no pre-filled billing address).
    // Dodo will collect contact info → billing address (for tax) → payment in that order.
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
      },
    });

    if (!checkoutSession.success || !checkoutSession.checkoutUrl) {
      throw new Error(checkoutSession.error || 'Failed to create checkout session');
    }

    // NOTE: We do NOT create a DB subscription record here.
    // Dodo fires `subscription.created` (PENDING) immediately once the checkout session
    // starts on Dodo's side. The webhook handler creates the DB record at that point,
    // using the userId and productId stored in the session metadata.
    // This means the checkout URL can be returned directly without an upfront DB write.

    return {
      checkoutUrl: checkoutSession.checkoutUrl,
      sessionId: checkoutSession.sessionId,
      // Provide a stub so callers that reference result.subscription don't crash
      subscription: { id: checkoutSession.sessionId ?? '', status: 'PENDING' } as any,
    };
  }

  /**
   * Change subscription plan (monthly <-> yearly)
   * @param immediate - true for immediate change with proration, false to schedule at renewal
   */
  static async changePlan(params: PlanChangeParams) {
    const { userId, targetBillingInterval, immediate = true } = params;

    // Get current subscription
    const existingSubscription = await SubscriptionService.getSubscriptionWithSync(userId);

    if (!existingSubscription) {
      throw new Error('No active subscription found');
    }

    // Verify subscription is active with Dodo
    const dodoSubscription = await DodoSubscriptionService.getSubscription(
      existingSubscription.dodoSubscriptionId
    );

    if (!dodoSubscription) {
      throw new Error('Could not verify subscription status. Please try again.');
    }

    if (dodoSubscription.status !== 'active') {
      if (dodoSubscription.status === 'pending') {
        throw new Error('Please complete your pending payment before changing plans.');
      }
      throw new Error(`Subscription must be active to change plans. Current status: ${dodoSubscription.status}`);
    }

    // Get current and target billing intervals
    const currentBillingInterval = this.getBillingIntervalFromProductId(dodoSubscription.product_id);
    const comparison = this.compareBillingIntervals(currentBillingInterval, targetBillingInterval);

    if (comparison === 'same') {
      throw new Error(`You are already on the ${targetBillingInterval} plan`);
    }

    const targetProductId = this.getProductId(targetBillingInterval);

    if (immediate) {
      // IMMEDIATE CHANGE: Execute now with proration (like Vibepost)
      console.log(`Executing immediate plan change: ${currentBillingInterval} -> ${targetBillingInterval}`);
      
      // Call Dodo changePlan API with proration
      // full_immediately = charge full new plan price ($89), billing cycle resets (per client spec for now)
      const changeResult = await DodoSubscriptionService.changePlan(
        existingSubscription.dodoSubscriptionId,
        targetProductId,
        {
          prorationBehavior: 'full_immediately',
          quantity: 1,
        }
      );

      if (!changeResult.success) {
        throw new Error(changeResult.error || 'Failed to change subscription plan');
      }

      // Update database immediately
      await SubscriptionService.updateSubscriptionProductId(
        existingSubscription.dodoSubscriptionId,
        targetProductId
      );

      // Update amount in database
      const newAmount = this.getSubscriptionAmount(targetBillingInterval);
      await SubscriptionService.updateSubscriptionMetadata(
        existingSubscription.dodoSubscriptionId,
        {
          ...((existingSubscription.metadata as any) || {}),
          amount: newAmount,
        }
      );

      // Get updated subscription
      const updatedSubscription = await SubscriptionService.getSubscriptionWithSync(userId);

      return {
        subscription: updatedSubscription!,
        changeType: comparison,
        scheduledChange: false,
      };
    } else {
      // SCHEDULED CHANGE: Store in metadata, execute at renewal
      console.log(`Scheduling plan change for next billing cycle: ${currentBillingInterval} -> ${targetBillingInterval}`);
      
      // Clear any existing scheduled change first
      const metadata = (existingSubscription.metadata as any) || {};
      delete metadata.scheduledProductId;
      delete metadata.scheduledPlanType;
      delete metadata.scheduledAt;

      // Store the scheduled change
      await SubscriptionService.updateSubscriptionMetadata(
        existingSubscription.dodoSubscriptionId,
        {
          ...metadata,
          scheduledProductId: targetProductId,
          scheduledPlanType: targetBillingInterval,
          scheduledAt: new Date().toISOString(),
        }
      );

      // Get updated subscription with new metadata
      const updatedSubscription = await SubscriptionService.getSubscriptionWithSync(userId);

      return {
        subscription: updatedSubscription!,
        changeType: comparison,
        scheduledChange: true,
      };
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(params: CancelSubscriptionParams) {
    const { userId, cancelAtPeriodEnd = true } = params;

    // Get user's subscription
    const subscription = await SubscriptionService.getUserSubscription(userId);

    if (!subscription) {
      throw new Error('No subscription found');
    }

    if (subscription.status === 'CANCELLED') {
      throw new Error('Subscription is already cancelled');
    }

    // Check for scheduled plan change - clear it before canceling
    const metadata = (subscription.metadata as any) || {};
    const hasScheduledChange = metadata.scheduledProductId && metadata.scheduledProductId !== subscription.productId;
    
    if (hasScheduledChange) {
      console.log('User has scheduled plan change - clearing it before cancellation');
      delete metadata.scheduledProductId;
      delete metadata.scheduledPlanType;
      delete metadata.scheduledAt;
      await SubscriptionService.updateSubscriptionMetadata(
        subscription.dodoSubscriptionId,
        metadata
      );
    }

    if (cancelAtPeriodEnd) {
      // Cancel at period end: subscription stays ACTIVE in Dodo and in our DB until period end.
      // User keeps access and can reactivate before the period ends.
      const cancelResult = await DodoSubscriptionService.cancelSubscription(
        subscription.dodoSubscriptionId,
        true
      );
      if (!cancelResult.success) {
        throw new Error(cancelResult.error || 'Failed to cancel subscription with Dodo');
      }
      const updatedSubscription = await SubscriptionService.updateSubscriptionCancelState(
        subscription.dodoSubscriptionId,
        true
      );
      return updatedSubscription;
    }

    // Cancel immediately: no further renewals, no reactivation.
    const cancelResult = await DodoSubscriptionService.cancelSubscriptionImmediately(
      subscription.dodoSubscriptionId
    );
    if (!cancelResult.success) {
      throw new Error(cancelResult.error || 'Failed to cancel subscription with Dodo');
    }
    const updatedSubscription = await SubscriptionService.updateSubscriptionStatus(
      subscription.dodoSubscriptionId,
      'CANCELLED',
      {
        nextBillingDate: null,
        cancelledAt: new Date(),
        cancelAtPeriodEnd: true,
      }
    );
    return updatedSubscription;
  }

  /**
   * Reactivate (uncancel) a subscription
   */
  static async reactivateSubscription(userId: string) {
    const subscription = await SubscriptionService.getUserSubscription(userId);

    if (!subscription) {
      throw new Error('No subscription found');
    }

    if (subscription.status !== 'ACTIVE' || !subscription.cancelAtPeriodEnd) {
      throw new Error('Only subscriptions cancelled at period end can be reactivated');
    }

    // Update Dodo: only send cancel_at_next_billing_date: false (do not send status).
    // Dodo only allows updating status to "cancelled", not back to "active".
    const reactivateResult = await DodoSubscriptionService.reactivateSubscription(
      subscription.dodoSubscriptionId
    );

    if (!reactivateResult.success) {
      throw new Error(reactivateResult.error || 'Failed to reactivate subscription');
    }

    // Update database
    await SubscriptionService.updateSubscriptionCancelState(
      subscription.dodoSubscriptionId,
      false
    );

    // Get updated subscription
    const updatedSubscription = await SubscriptionService.getUserSubscription(userId);

    return updatedSubscription!;
  }

  /**
   * Get subscription status and billing info
   */
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

    // Check for scheduled plan change
    const metadata = (subscription.metadata as any) || {};
    const scheduledChange = metadata.scheduledProductId
      ? {
          targetBillingInterval: metadata.scheduledPlanType as BillingInterval,
          scheduledAt: metadata.scheduledAt,
        }
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
