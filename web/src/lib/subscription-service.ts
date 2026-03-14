import { prisma } from '@/lib/prisma';
import { PaddleSubscriptionService } from '@/lib/payments/paddle';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import type { SubscriptionStatus } from '@prisma/client';

export class SubscriptionService {
  static async getUserSubscription(userId: string) {
    try {
      return await prisma.subscription.findUnique({
        where: { userId },
        include: { user: true },
      });
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      return null;
    }
  }

  static async getSubscriptionByPaddleId(paddleSubscriptionId: string) {
    try {
      return await prisma.subscription.findUnique({
        where: { paddleSubscriptionId },
        include: { user: true },
      });
    } catch (error) {
      console.error('Error fetching subscription by Paddle ID:', error);
      return null;
    }
  }

  static async getCurrentUserSubscription() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) throw new Error('User not authenticated');
    return await this.getUserSubscription(session.user.id);
  }

  static async createSubscription(params: {
    userId: string;
    paddleSubscriptionId: string;
    priceId: string;
    status?: SubscriptionStatus;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    nextBillingDate?: Date;
    trialEnd?: Date;
    metadata?: any;
    notesPerMonth?: number | null;
    coursesPerMonth?: number;
    pdfProcessingPerMonth?: number | null;
    videoProcessingPerMonth?: number | null;
    audioProcessingPerMonth?: number | null;
    paddleDiscountId?: string;
    amount?: number;
  }) {
    try {
      const subscription = await prisma.subscription.create({
        data: {
          userId: params.userId,
          paddleSubscriptionId: params.paddleSubscriptionId,
          priceId: params.priceId,
          status: params.status || 'PENDING',
          currentPeriodStart: params.currentPeriodStart,
          currentPeriodEnd: params.currentPeriodEnd,
          nextBillingDate: params.nextBillingDate,
          trialEnd: params.trialEnd,
          metadata: params.metadata,
          notesPerMonth: params.notesPerMonth,
          coursesPerMonth: params.coursesPerMonth ?? 5,
          pdfProcessingPerMonth: params.pdfProcessingPerMonth,
          videoProcessingPerMonth: params.videoProcessingPerMonth,
          audioProcessingPerMonth: params.audioProcessingPerMonth,
          paddleDiscountId: params.paddleDiscountId,
          amount: params.amount,
        },
        include: { user: true },
      });

      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription in database');
    }
  }

  static async updateSubscriptionStatus(
    paddleSubscriptionId: string,
    status: SubscriptionStatus,
    additionalData?: {
      currentPeriodStart?: Date;
      currentPeriodEnd?: Date;
      nextBillingDate?: Date | null;
      cancelledAt?: Date;
      cancelAtPeriodEnd?: boolean;
      priceId?: string;
    }
  ) {
    try {
      return await prisma.subscription.update({
        where: { paddleSubscriptionId },
        data: {
          status,
          ...additionalData,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating subscription status:', error);
      throw new Error('Failed to update subscription status');
    }
  }

  static async activateSubscription(
    paddleSubscriptionId: string,
    billingInfo: {
      currentPeriodStart: Date;
      currentPeriodEnd: Date;
      nextBillingDate: Date;
    }
  ) {
    return await this.updateSubscriptionStatus(paddleSubscriptionId, 'ACTIVE', billingInfo);
  }

  static async cancelSubscription(paddleSubscriptionId: string, cancelAtPeriodEnd: boolean = true) {
    if (cancelAtPeriodEnd) {
      return await this.updateSubscriptionCancelState(paddleSubscriptionId, true, {});
    }
    return await this.updateSubscriptionStatus(paddleSubscriptionId, 'CANCELLED', {
      cancelledAt: new Date(),
      cancelAtPeriodEnd: false,
    });
  }

  static async updateSubscriptionCancelState(
    paddleSubscriptionId: string,
    cancelAtPeriodEnd: boolean,
    periodUpdates?: { currentPeriodEnd?: Date; nextBillingDate?: Date }
  ) {
    try {
      return await prisma.subscription.update({
        where: { paddleSubscriptionId },
        data: {
          cancelAtPeriodEnd,
          cancelledAt: cancelAtPeriodEnd ? new Date() : null,
          ...periodUpdates,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating subscription cancel state:', error);
      throw new Error('Failed to update subscription cancel state');
    }
  }

  static async failSubscription(paddleSubscriptionId: string) {
    return await this.updateSubscriptionStatus(paddleSubscriptionId, 'FAILED');
  }

  static async renewSubscription(paddleSubscriptionId: string, nextBillingDate: Date) {
    const subscription = await prisma.subscription.findUnique({
      where: { paddleSubscriptionId },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    return await this.updateSubscriptionStatus(paddleSubscriptionId, 'ACTIVE', {
      currentPeriodStart: subscription.currentPeriodEnd || new Date(),
      currentPeriodEnd: nextBillingDate,
      nextBillingDate,
    });
  }

  static async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      let subscription = await this.getUserSubscription(userId);
      if (!subscription) return false;

      if (subscription.status === 'PENDING') {
        subscription = await this.getSubscriptionWithSync(userId);
        if (!subscription) return false;
      }

      if (subscription.status !== 'ACTIVE') return false;

      if (subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd) {
        if (new Date() > subscription.currentPeriodEnd) return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  static async currentUserHasActiveSubscription(): Promise<boolean> {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) return false;
    return await this.hasActiveSubscription(session.user.id);
  }

  private static syncInFlight = new Map<string, Promise<any>>();

  static async getSubscriptionWithSync(userId: string) {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) return null;

    const inFlight = this.syncInFlight.get(userId);
    if (inFlight) return inFlight;

    const syncPromise = this._doSyncWithPaddle(userId, subscription);
    this.syncInFlight.set(userId, syncPromise);
    try {
      return await syncPromise;
    } finally {
      this.syncInFlight.delete(userId);
    }
  }

  private static async _doSyncWithPaddle(
    userId: string,
    subscription: NonNullable<Awaited<ReturnType<typeof SubscriptionService.getUserSubscription>>>
  ) {
    try {
      const paddleSubscription = await PaddleSubscriptionService.getSubscription(
        subscription.paddleSubscriptionId
      );

      if (!paddleSubscription) {
        console.warn('Paddle subscription not found, marking as failed:', subscription.paddleSubscriptionId);
        await this.updateSubscriptionStatus(subscription.paddleSubscriptionId, 'FAILED');
        return await this.getUserSubscription(userId);
      }

      const paddleStatus = PaddleSubscriptionService.mapPaddleStatus(paddleSubscription.status) as SubscriptionStatus;
      const billingDates = PaddleSubscriptionService.extractBillingDates(paddleSubscription);

      await this.updateSubscriptionStatus(subscription.paddleSubscriptionId, paddleStatus, {
        currentPeriodStart: billingDates.currentPeriodStart,
        currentPeriodEnd: billingDates.currentPeriodEnd,
        nextBillingDate: billingDates.nextBillingDate,
        cancelAtPeriodEnd: billingDates.cancelAtPeriodEnd,
      });

      const paddlePriceId = paddleSubscription.items?.[0]?.price?.id;
      if (paddlePriceId && subscription.priceId !== paddlePriceId) {
        await this.updateSubscriptionPriceId(subscription.paddleSubscriptionId, paddlePriceId);
      }

      return await this.getUserSubscription(userId);
    } catch (error) {
      console.error('Error syncing with Paddle:', error);
      return subscription;
    }
  }

  static async deleteSubscription(userId: string) {
    try {
      await prisma.subscription.delete({ where: { userId } });
    } catch (error) {
      console.error('Error deleting subscription:', error);
      throw new Error('Failed to delete subscription');
    }
  }

  static async updateSubscriptionPriceId(paddleSubscriptionId: string, newPriceId: string) {
    try {
      const currentSub = await prisma.subscription.findUnique({
        where: { paddleSubscriptionId },
      });

      const metadata = (currentSub?.metadata as any) || {};
      delete metadata.scheduledPriceId;
      delete metadata.scheduledPlanType;
      delete metadata.scheduledAt;

      return await prisma.subscription.update({
        where: { paddleSubscriptionId },
        data: {
          priceId: newPriceId,
          metadata,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating subscription price ID:', error);
      throw new Error('Failed to update subscription price ID');
    }
  }

  static async updateSubscriptionMetadata(paddleSubscriptionId: string, metadata: Record<string, any>) {
    try {
      return await prisma.subscription.update({
        where: { paddleSubscriptionId },
        data: { metadata, updatedAt: new Date() },
      });
    } catch (error) {
      console.error('Error updating subscription metadata:', error);
      throw new Error('Failed to update subscription metadata');
    }
  }

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

  static isInTrialPeriod(subscription: any): boolean {
    if (!subscription?.trialEnd) return false;
    return new Date() < new Date(subscription.trialEnd);
  }

  static getDaysUntilEnd(subscription: any): number | null {
    if (!subscription?.currentPeriodEnd) return null;
    const diffTime = new Date(subscription.currentPeriodEnd).getTime() - Date.now();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

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
    const isCancelled = subscription.status === 'CANCELLED';
    const isTrial = this.isInTrialPeriod(subscription);
    const daysRemaining = this.getDaysUntilEnd(subscription);

    const hasAccess =
      (isActive && (!subscription.cancelAtPeriodEnd || (daysRemaining != null && daysRemaining > 0))) ||
      (isCancelled && daysRemaining != null && daysRemaining > 0);

    return {
      status: subscription.status,
      displayStatus: this.getDisplayStatus(subscription),
      hasAccess,
      isActive,
      isTrial,
      daysRemaining,
      nextBillingDate: subscription.nextBillingDate,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      cancelledAt: subscription.cancelledAt,
    };
  }

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
      PAUSED: 'Paused',
      PAST_DUE: 'Payment Issue',
      CANCELLED: 'Cancelled',
      FAILED: 'Failed',
      EXPIRED: 'Expired',
    };

    return statusMap[status] || status;
  }

  static async updateSubscriptionLimits(
    paddleSubscriptionId: string,
    limits: {
      notesPerMonth?: number | null;
      coursesPerMonth?: number;
      pdfProcessingPerMonth?: number | null;
      videoProcessingPerMonth?: number | null;
      audioProcessingPerMonth?: number | null;
    }
  ) {
    try {
      return await prisma.subscription.update({
        where: { paddleSubscriptionId },
        data: { ...limits, updatedAt: new Date() },
      });
    } catch (error) {
      console.error('Error updating subscription limits:', error);
      throw new Error('Failed to update subscription limits');
    }
  }

  static async resetUsageCounters(userId: string) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          usedNotesThisMonth: 0,
          usedCoursesThisMonth: 0,
          usedPdfProcessingThisMonth: 0,
          usedVideoProcessingThisMonth: 0,
          usedAudioProcessingThisMonth: 0,
          lastUsageResetDate: new Date(),
        },
      });
    } catch (error) {
      console.error('Error resetting usage counters:', error);
      throw new Error('Failed to reset usage counters');
    }
  }

  static async getUsageStats(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          usedNotesThisMonth: true,
          usedCoursesThisMonth: true,
          usedPdfProcessingThisMonth: true,
          usedVideoProcessingThisMonth: true,
          usedAudioProcessingThisMonth: true,
          lastUsageResetDate: true,
        },
      });

      return user || {
        usedNotesThisMonth: 0,
        usedCoursesThisMonth: 0,
        usedPdfProcessingThisMonth: 0,
        usedVideoProcessingThisMonth: 0,
        usedAudioProcessingThisMonth: 0,
        lastUsageResetDate: null,
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return {
        usedNotesThisMonth: 0,
        usedCoursesThisMonth: 0,
        usedPdfProcessingThisMonth: 0,
        usedVideoProcessingThisMonth: 0,
        usedAudioProcessingThisMonth: 0,
        lastUsageResetDate: null,
      };
    }
  }
}
