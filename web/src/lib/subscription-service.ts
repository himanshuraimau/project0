// Subscription Service - Database operations for subscription management

import { prisma } from '@/lib/prisma';
import { DodoSubscriptionService } from '@/lib/payments/dodo';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import type { SubscriptionStatus } from '@prisma/client';

export class SubscriptionService {
  /**
   * Get user's subscription from database
   */
  static async getUserSubscription(userId: string) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
        include: { user: true },
      });

      return subscription;
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      return null;
    }
  }

  /**
   * Get subscription by Dodo subscription ID
   */
  static async getSubscriptionByDodoId(dodoSubscriptionId: string) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { dodoSubscriptionId },
        include: { user: true },
      });

      return subscription;
    } catch (error) {
      console.error('Error fetching subscription by Dodo ID:', error);
      return null;
    }
  }

  /**
   * Get current user's subscription (requires auth)
   */
  static async getCurrentUserSubscription() {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    if (!session?.user?.id) throw new Error('User not authenticated');

    return await this.getUserSubscription(session.user.id);
  }

  /**
   * Create a new subscription in database
   */
  static async createSubscription(params: {
    userId: string;
    dodoSubscriptionId: string;
    productId: string;
    status?: SubscriptionStatus;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    nextBillingDate?: Date;
    trialEnd?: Date;
    metadata?: any;
  }) {
    try {
      const subscription = await prisma.subscription.create({
        data: {
          userId: params.userId,
          dodoSubscriptionId: params.dodoSubscriptionId,
          productId: params.productId,
          status: params.status || 'PENDING',
          currentPeriodStart: params.currentPeriodStart,
          currentPeriodEnd: params.currentPeriodEnd,
          nextBillingDate: params.nextBillingDate,
          trialEnd: params.trialEnd,
          metadata: params.metadata,
        },
        include: { user: true },
      });

      console.log('Subscription created in database:', subscription.id);
      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription in database');
    }
  }

  /**
   * Update subscription status
   */
  static async updateSubscriptionStatus(
    dodoSubscriptionId: string,
    status: SubscriptionStatus,
    additionalData?: {
      currentPeriodStart?: Date;
      currentPeriodEnd?: Date;
      nextBillingDate?: Date;
      cancelledAt?: Date;
      cancelAtPeriodEnd?: boolean;
      productId?: string;
    }
  ) {
    try {
      const subscription = await prisma.subscription.update({
        where: { dodoSubscriptionId },
        data: {
          status,
          ...additionalData,
          updatedAt: new Date(),
        },
      });

      console.log('Subscription status updated:', {
        id: subscription.id,
        status: subscription.status,
        productId: subscription.productId,
      });

      return subscription;
    } catch (error) {
      console.error('Error updating subscription status:', error);
      throw new Error('Failed to update subscription status');
    }
  }

  /**
   * Activate subscription
   */
  static async activateSubscription(
    dodoSubscriptionId: string,
    billingInfo: {
      currentPeriodStart: Date;
      currentPeriodEnd: Date;
      nextBillingDate: Date;
    }
  ) {
    return await this.updateSubscriptionStatus(
      dodoSubscriptionId,
      'ACTIVE',
      billingInfo
    );
  }

  /**
   * Put subscription on hold
   */
  static async holdSubscription(dodoSubscriptionId: string) {
    return await this.updateSubscriptionStatus(dodoSubscriptionId, 'ON_HOLD');
  }

  /**
   * Cancel subscription (immediately - use updateSubscriptionCancelState for cancel at period end)
   */
  static async cancelSubscription(
    dodoSubscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ) {
    if (cancelAtPeriodEnd) {
      // Keep status ACTIVE so user retains access until period end
      return await this.updateSubscriptionCancelState(dodoSubscriptionId, true, {});
    }
    return await this.updateSubscriptionStatus(dodoSubscriptionId, 'CANCELLED', {
      cancelledAt: new Date(),
      cancelAtPeriodEnd: false,
    });
  }

  /**
   * Update cancel-at-period-end state. Keeps status ACTIVE so user retains access.
   */
  static async updateSubscriptionCancelState(
    dodoSubscriptionId: string,
    cancelAtPeriodEnd: boolean,
    periodUpdates?: { currentPeriodEnd?: Date; nextBillingDate?: Date }
  ) {
    try {
      const subscription = await prisma.subscription.update({
        where: { dodoSubscriptionId },
        data: {
          cancelAtPeriodEnd,
          cancelledAt: new Date(),
          ...periodUpdates,
          updatedAt: new Date(),
        },
      });

      console.log('Subscription cancel state updated:', {
        id: subscription.id,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      });

      return subscription;
    } catch (error) {
      console.error('Error updating subscription cancel state:', error);
      throw new Error('Failed to update subscription cancel state');
    }
  }

  /**
   * Mark subscription as failed
   */
  static async failSubscription(dodoSubscriptionId: string) {
    return await this.updateSubscriptionStatus(dodoSubscriptionId, 'FAILED');
  }

  /**
   * Renew subscription (update billing dates)
   */
  static async renewSubscription(
    dodoSubscriptionId: string,
    nextBillingDate: Date
  ) {
    const subscription = await prisma.subscription.findUnique({
      where: { dodoSubscriptionId },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    return await this.updateSubscriptionStatus(
      dodoSubscriptionId,
      'ACTIVE',
      {
        currentPeriodStart: subscription.currentPeriodEnd || new Date(),
        currentPeriodEnd: nextBillingDate,
        nextBillingDate,
      }
    );
  }

  /**
   * Check if user has active subscription
   */
  static async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      let subscription = await this.getUserSubscription(userId);

      if (!subscription) return false;

      // If subscription is PENDING, try to sync with Dodo to see if it's activated
      if (subscription.status === 'PENDING') {
        // Pending upgrade from monthly: grant access until old monthly period ends
        const meta = subscription.metadata as { upgradeFromMonthly?: boolean; monthlyPeriodEnd?: string } | null;
        if (meta?.upgradeFromMonthly && meta.monthlyPeriodEnd) {
          const periodEnd = new Date(meta.monthlyPeriodEnd);
          if (new Date() < periodEnd) return true;
        }
        console.log('Subscription is PENDING, syncing with Dodo...');
        subscription = await this.getSubscriptionWithSync(userId);
        if (!subscription) return false;
      }

      // Check if subscription is active
      if (subscription.status !== 'ACTIVE') return false;

      // Check if subscription is cancelled and past end date
      if (subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd) {
        if (new Date() > subscription.currentPeriodEnd) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  /**
   * Check if current user has active subscription
   */
  static async currentUserHasActiveSubscription(): Promise<boolean> {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    if (!session?.user?.id) return false;

    return await this.hasActiveSubscription(session.user.id);
  }

  /**
   * Get subscription with Dodo sync and reconcile
   * Dodo is the source of truth: status, product_id, period dates.
   * Reconciles our DB when there's a mismatch (e.g. failed upgrade, pending payment).
   */
  static async getSubscriptionWithSync(userId: string) {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription) return null;

    try {
      const dodoSubscription = await DodoSubscriptionService.getSubscription(
        subscription.dodoSubscriptionId
      );

      if (!dodoSubscription) {
        // Dodo returns null (e.g. subscription deleted/not found) - mark as failed
        console.warn('Dodo subscription not found, marking as failed:', subscription.dodoSubscriptionId);
        await this.updateSubscriptionStatus(subscription.dodoSubscriptionId, 'FAILED');
        return await this.getUserSubscription(userId);
      }

      const periodInfo = DodoSubscriptionService.getSubscriptionPeriodInfo(dodoSubscription);
      const dodoStatus = dodoSubscription.status.toUpperCase() as SubscriptionStatus;
      const dodoProductId = dodoSubscription.product_id;
      const meta = subscription.metadata as { upgradeFromMonthly?: boolean } | null;

      // Pending upgrade: preserve monthlyPeriodEnd (user keeps access until then)
      const preserveUpgradePeriod =
        meta?.upgradeFromMonthly && subscription.status === 'PENDING' && dodoStatus === 'PENDING';

      const periodUpdates = preserveUpgradePeriod
        ? {} // Don't overwrite period - we stored monthly end in replaceWithPendingYearlyUpgrade
        : {
            currentPeriodStart: periodInfo.currentPeriodStart,
            currentPeriodEnd: periodInfo.currentPeriodEnd,
            nextBillingDate: periodInfo.nextBillingDate,
            cancelAtPeriodEnd: periodInfo.cancelAtPeriodEnd,
          };

      // Reconcile: sync status, period dates, cancel state from Dodo
      await this.updateSubscriptionStatus(subscription.dodoSubscriptionId, dodoStatus, periodUpdates);

      // Reconcile product_id: Dodo is source of truth (handles failed upgrades, plan changes)
      if (subscription.productId !== dodoProductId) {
        console.log('Reconciling product ID from Dodo:', {
          dbProductId: subscription.productId,
          dodoProductId,
        });
        await this.updateSubscriptionProductId(subscription.dodoSubscriptionId, dodoProductId);
      }

      return await this.getUserSubscription(userId);
    } catch (error) {
      console.error('Error syncing with Dodo:', error);
      return subscription; // Return cached version on error
    }
  }

  /**
   * Delete subscription (for cleanup/testing)
   */
  static async deleteSubscription(userId: string) {
    try {
      await prisma.subscription.delete({
        where: { userId },
      });

      console.log('Subscription deleted for user:', userId);
    } catch (error) {
      console.error('Error deleting subscription:', error);
      throw new Error('Failed to delete subscription');
    }
  }

  /**
   * Replace subscription for upgrade: switch to new Dodo subscription (yearly, payment pending)
   * User keeps access until monthlyPeriodEnd (from old monthly) while yearly payment is pending.
   */
  static async replaceWithPendingYearlyUpgrade(
    userId: string,
    newDodoSubscriptionId: string,
    yearlyProductId: string,
    monthlyPeriodEnd: Date
  ) {
    try {
      const subscription = await prisma.subscription.update({
        where: { userId },
        data: {
          dodoSubscriptionId: newDodoSubscriptionId,
          productId: yearlyProductId,
          status: 'PENDING',
          cancelAtPeriodEnd: false,
          cancelledAt: null,
          currentPeriodEnd: monthlyPeriodEnd, // Keep access until old monthly period ends
          nextBillingDate: null,
          metadata: { upgradeFromMonthly: true, monthlyPeriodEnd: monthlyPeriodEnd.toISOString() },
          updatedAt: new Date(),
        },
      });

      console.log('Subscription replaced for yearly upgrade:', { userId, newDodoSubscriptionId });
      return subscription;
    } catch (error) {
      console.error('Error replacing subscription for upgrade:', error);
      throw new Error('Failed to replace subscription for upgrade');
    }
  }

  /**
   * Update subscription product ID (for upgrades/downgrades)
   */
  static async updateSubscriptionProductId(
    dodoSubscriptionId: string,
    newProductId: string
  ) {
    try {
      // Clear any scheduled change metadata when updating product ID
      const currentSub = await prisma.subscription.findUnique({
        where: { dodoSubscriptionId },
      });
      
      const metadata = currentSub?.metadata as any || {};
      delete metadata.scheduledProductId;
      delete metadata.scheduledPlanType;
      delete metadata.scheduledAt;

      const subscription = await prisma.subscription.update({
        where: { dodoSubscriptionId },
        data: {
          productId: newProductId,
          metadata,
          updatedAt: new Date(),
        },
      });

      console.log('Subscription product ID updated:', {
        id: subscription.id,
        productId: subscription.productId,
      });

      return subscription;
    } catch (error) {
      console.error('Error updating subscription product ID:', error);
      throw new Error('Failed to update subscription product ID');
    }
  }

  /**
   * Update subscription metadata
   */
  static async updateSubscriptionMetadata(
    dodoSubscriptionId: string,
    metadata: Record<string, any>
  ) {
    try {
      const subscription = await prisma.subscription.update({
        where: { dodoSubscriptionId },
        data: {
          metadata,
          updatedAt: new Date(),
        },
      });

      console.log('Subscription metadata updated:', {
        id: subscription.id,
      });

      return subscription;
    } catch (error) {
      console.error('Error updating subscription metadata:', error);
      throw new Error('Failed to update subscription metadata');
    }
  }

  /**
   * Get subscription statistics
   */
  static async getSubscriptionStats() {
    try {
      const stats = await prisma.subscription.groupBy({
        by: ['status'],
        _count: true,
      });

      const total = await prisma.subscription.count();

      return {
        total,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat.status] = stat._count;
          return acc;
        }, {} as Record<string, number>),
      };
    } catch (error) {
      console.error('Error getting subscription stats:', error);
      return { total: 0, byStatus: {} };
    }
  }

  /**
   * Check if subscription is in trial period
   */
  static isInTrialPeriod(subscription: any): boolean {
    if (!subscription?.trialEnd) return false;
    return new Date() < new Date(subscription.trialEnd);
  }

  /**
   * Get days until subscription ends
   */
  static getDaysUntilEnd(subscription: any): number | null {
    if (!subscription?.currentPeriodEnd) return null;

    const now = new Date();
    const end = new Date(subscription.currentPeriodEnd);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * Get subscription display info
   */
  static getSubscriptionDisplayInfo(subscription: any) {
    if (!subscription) {
      return {
        status: 'NO_SUBSCRIPTION',
        displayStatus: 'No Subscription',
        hasAccess: false,
        isActive: false,
        isTrial: false,
        daysRemaining: null,
        nextBillingDate: null,
      };
    }

    const isActive = subscription.status === 'ACTIVE';
    const isTrial = this.isInTrialPeriod(subscription);
    const meta = subscription.metadata as { upgradeFromMonthly?: boolean; monthlyPeriodEnd?: string } | null;
    const isPendingUpgrade = !!(subscription.status === 'PENDING' && meta?.upgradeFromMonthly && meta.monthlyPeriodEnd);
    const monthlyEnd = isPendingUpgrade ? new Date(meta!.monthlyPeriodEnd!) : null;
    const daysRemaining = monthlyEnd
      ? Math.ceil((monthlyEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      : this.getDaysUntilEnd(subscription);
    const hasAccess =
      isActive && (!subscription.cancelAtPeriodEnd || (daysRemaining && daysRemaining > 0)) ||
      (isPendingUpgrade && monthlyEnd && new Date() < monthlyEnd);

    return {
      status: subscription.status,
      displayStatus: this.getDisplayStatus(subscription, isPendingUpgrade),
      hasAccess,
      isActive: isActive || (isPendingUpgrade && hasAccess),
      isTrial,
      daysRemaining,
      nextBillingDate: subscription.nextBillingDate,
      currentPeriodEnd: subscription.currentPeriodEnd || monthlyEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      cancelledAt: subscription.cancelledAt,
    };
  }

  /**
   * Get human-readable display status
   */
  private static getDisplayStatus(subscription: any, isPendingUpgrade?: boolean): string {
    const status = subscription.status;
    const isTrial = this.isInTrialPeriod(subscription);

    if (status === 'ACTIVE') {
      if (isTrial) return 'Active (Trial)';
      if (subscription.cancelAtPeriodEnd) return 'Active (Cancelling)';
      return 'Active';
    }

    if (isPendingUpgrade) return 'Payment pending - complete to upgrade';

    const statusMap: Record<string, string> = {
      PENDING: 'Pending',
      ON_HOLD: 'Payment Issue',
      CANCELLED: 'Cancelled',
      FAILED: 'Failed',
      EXPIRED: 'Expired',
    };

    return statusMap[status] || status;
  }
}