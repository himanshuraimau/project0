import { PaddleSubscriptionService, type BillingInterval } from './paddle';
import { SubscriptionService } from '../subscription-service';
import { FeatureGateService } from '../feature-gate-service';
import { BillingOrchestrator, getInternalPlanConfig, resolveInternalPlanIdFromPaddlePriceId } from '@/lib/billing';

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

  static getPriceId(billingInterval: BillingInterval): string {
    return PaddleSubscriptionService.getPriceId(billingInterval);
  }

  static getSubscriptionAmount(billingInterval: BillingInterval): number {
    return billingInterval === 'yearly' ? 89.00 : 19.00;
  }

  static getBillingIntervalFromPriceId(priceId: string): BillingInterval {
    return PaddleSubscriptionService.getBillingIntervalFromPriceId(priceId);
  }

  static async getCheckoutData(params: CreateSubscriptionParams) {
    const { userId, userEmail, billingInterval, discountCode } = params;

    const existingSubscription = await SubscriptionService.getUserSubscription(userId);

    if (existingSubscription) {
      if (existingSubscription.status === 'ACTIVE') {
        throw new Error('You already have an active subscription');
      }

      if (['CANCELLED', 'FAILED', 'EXPIRED', 'PENDING'].includes(existingSubscription.status)) {
        try {
          await SubscriptionService.deleteSubscription(userId);
        } catch (error) {
          console.error('Error deleting stale subscription:', error);
        }
      }
    }

    const checkout = await BillingOrchestrator.getCheckoutData({
      userId,
      userEmail,
      billingInterval,
      discountCode,
    });

    return checkout;
  }

  static async changePlan(params: PlanChangeParams) {
    const { userId, targetBillingInterval, immediate = true } = params;

    const existingSubscription = await SubscriptionService.getSubscriptionWithSync(userId);

    if (!existingSubscription) {
      throw new Error('No active subscription found');
    }

    if (existingSubscription.provider !== 'PADDLE') {
      throw new Error('Plan changes are managed in your App Store subscription settings.');
    }

    const paddleSubscription = await PaddleSubscriptionService.getSubscription(
      existingSubscription.paddleSubscriptionId
    );

    if (!paddleSubscription) {
      throw new Error('Could not verify subscription status. Please try again.');
    }

    if (paddleSubscription.status !== 'active' && paddleSubscription.status !== 'trialing') {
      throw new Error(`Subscription must be active to change plans. Current status: ${paddleSubscription.status}`);
    }

    const currentPriceId = paddleSubscription.items?.[0]?.price?.id;
    if (!currentPriceId) {
      throw new Error('Could not determine current plan');
    }

    const currentBillingInterval = this.getBillingIntervalFromPriceId(currentPriceId);
    const comparison = this.compareBillingIntervals(currentBillingInterval, targetBillingInterval);

    if (comparison === 'same') {
      throw new Error(`You are already on the ${targetBillingInterval} plan`);
    }

    const targetPriceId = this.getPriceId(targetBillingInterval);

    if (immediate) {
      const changeResult = await PaddleSubscriptionService.changePlan(
        existingSubscription.paddleSubscriptionId,
        targetPriceId,
        'prorated_immediately'
      );

      if (!changeResult.success) {
        throw new Error(changeResult.error || 'Failed to change subscription plan');
      }

      await SubscriptionService.updateSubscriptionPriceId(
        existingSubscription.paddleSubscriptionId,
        targetPriceId,
        resolveInternalPlanIdFromPaddlePriceId(targetPriceId) ?? undefined
      );

      const updatedSubscription = await SubscriptionService.getSubscriptionWithSync(userId);

      return {
        subscription: updatedSubscription!,
        changeType: comparison,
        scheduledChange: false,
      };
    }

    const metadata = (existingSubscription.metadata as any) || {};
    delete metadata.scheduledPriceId;
    delete metadata.scheduledPlanType;
    delete metadata.scheduledAt;

    await SubscriptionService.updateSubscriptionMetadata(existingSubscription.paddleSubscriptionId, {
      ...metadata,
      scheduledPriceId: targetPriceId,
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

  static async cancelSubscription(params: CancelSubscriptionParams) {
    const { userId, cancelAtPeriodEnd = true } = params;
    await BillingOrchestrator.cancelSubscription(userId, cancelAtPeriodEnd);
    return await SubscriptionService.getUserSubscription(userId);
  }

  static async reactivateSubscription(userId: string) {
    await BillingOrchestrator.reactivateSubscription(userId);
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
    const scheduledChange = metadata.scheduledPriceId
      ? { targetBillingInterval: metadata.scheduledPlanType as BillingInterval, scheduledAt: metadata.scheduledAt }
      : null;

    const currentBillingInterval = subscription.provider === 'PADDLE'
      ? this.getBillingIntervalFromPriceId(subscription.priceId)
      : getInternalPlanConfig(subscription.internalPlanId as any)?.interval ?? null;

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
