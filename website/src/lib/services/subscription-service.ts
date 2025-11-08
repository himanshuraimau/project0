// Subscription Service - Database operations for subscription management

import { prisma } from '@/lib/services/prisma';
import { auth } from '@clerk/nextjs/server';
import { DodoSubscriptionService } from '@/lib/payments/subscription';
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
   * Get current user's subscription (requires auth)
   */
  static async getCurrentUserSubscription() {
    const { userId } = await auth();
    if (!userId) throw new Error('User not authenticated');

    return await this.getUserSubscription(userId);
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
   * Cancel subscription
   */
  static async cancelSubscription(
    dodoSubscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ) {
    return await this.updateSubscriptionStatus(dodoSubscriptionId, 'CANCELLED', {
      cancelledAt: new Date(),
      cancelAtPeriodEnd,
    });
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
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription) return false;

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
    const { userId } = await auth();
    if (!userId) return false;
    
    return await this.hasActiveSubscription(userId);
  }

  /**
   * Get subscription with Dodo sync
   */
  static async getSubscriptionWithSync(userId: string) {
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription) return null;

    // Sync with Dodo to get latest status
    try {
      const dodoSubscription = await DodoSubscriptionService.getSubscription(
        subscription.dodoSubscriptionId
      );

      if (dodoSubscription) {
        // Update our database with latest info from Dodo
        const periodInfo = DodoSubscriptionService.getSubscriptionPeriodInfo(dodoSubscription);
        
        await this.updateSubscriptionStatus(
          subscription.dodoSubscriptionId,
          dodoSubscription.status.toUpperCase() as SubscriptionStatus,
          {
            currentPeriodStart: periodInfo.currentPeriodStart || undefined,
            currentPeriodEnd: periodInfo.currentPeriodEnd || undefined,
            nextBillingDate: periodInfo.nextBillingDate,
            cancelAtPeriodEnd: periodInfo.cancelAtPeriodEnd,
          }
        );
      }

      // Fetch updated subscription
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
    const daysRemaining = this.getDaysUntilEnd(subscription);
    const hasAccess = isActive && (!subscription.cancelAtPeriodEnd || (daysRemaining && daysRemaining > 0));

    return {
      status: subscription.status,
      displayStatus: this.getDisplayStatus(subscription),
      hasAccess,
      isActive,
      isTrial,
      daysRemaining,
      nextBillingDate: subscription.nextBillingDate,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      cancelledAt: subscription.cancelledAt,
    };
  }

  /**
   * Get human-readable display status
   */
  private static getDisplayStatus(subscription: any): string {
    const status = subscription.status;
    const isTrial = this.isInTrialPeriod(subscription);
    
    if (status === 'ACTIVE') {
      if (isTrial) return 'Active (Trial)';
      if (subscription.cancelAtPeriodEnd) return 'Active (Cancelling)';
      return 'Active';
    }
    
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