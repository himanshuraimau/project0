// Feature Gate Service - Control access to features based on subscription

import { auth } from '@clerk/nextjs/server';
import { SubscriptionService } from './subscription-service';

export class FeatureGateService {
  /**
   * Check if user can access any feature (requires active subscription)
   */
  static async canAccessFeature(userId?: string): Promise<boolean> {
    try {
      // If no userId provided, get from auth
      let targetUserId = userId;
      if (!targetUserId) {
        const { userId: authUserId } = await auth();
        if (!authUserId) return false;
        targetUserId = authUserId;
      }

      return await SubscriptionService.hasActiveSubscription(targetUserId);
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }

  /**
   * Check if current user can access features
   */
  static async currentUserCanAccessFeatures(): Promise<boolean> {
    return await SubscriptionService.currentUserHasActiveSubscription();
  }

  /**
   * Require active subscription (throws error if not subscribed)
   */
  static async requireSubscription(userId?: string): Promise<void> {
    const hasAccess = await this.canAccessFeature(userId);
    
    if (!hasAccess) {
      throw new Error('SUBSCRIPTION_REQUIRED');
    }
  }

  /**
   * Get access info for current user
   */
  static async getAccessInfo() {
    const { userId } = await auth();
    if (!userId) {
      return {
        hasAccess: false,
        subscription: null,
        reason: 'NOT_AUTHENTICATED',
      };
    }

    const subscription = await SubscriptionService.getUserSubscription(userId);
    
    if (!subscription) {
      return {
        hasAccess: false,
        subscription: null,
        reason: 'NO_SUBSCRIPTION',
      };
    }

    const displayInfo = SubscriptionService.getSubscriptionDisplayInfo(subscription);

    return {
      hasAccess: displayInfo.hasAccess,
      subscription: {
        status: displayInfo.status,
        displayStatus: displayInfo.displayStatus,
        isActive: displayInfo.isActive,
        isTrial: displayInfo.isTrial,
        daysRemaining: displayInfo.daysRemaining,
        nextBillingDate: displayInfo.nextBillingDate,
        cancelAtPeriodEnd: displayInfo.cancelAtPeriodEnd,
      },
      reason: displayInfo.hasAccess ? 'ACTIVE_SUBSCRIPTION' : displayInfo.status,
    };
  }

  /**
   * Check feature access and return appropriate response for API
   */
  static async checkAccessForAPI() {
    const accessInfo = await this.getAccessInfo();

    if (!accessInfo.hasAccess) {
      return {
        allowed: false,
        statusCode: 403,
        error: 'SUBSCRIPTION_REQUIRED',
        message: 'Active subscription required to access this feature',
        reason: accessInfo.reason,
      };
    }

    return {
      allowed: true,
      subscription: accessInfo.subscription,
    };
  }

  /**
   * Get redirect URL for users without access
   */
  static getUpgradeUrl(reason?: string): string {
    const baseUrl = '/pricing';
    if (reason) {
      return `${baseUrl}?reason=${reason}`;
    }
    return baseUrl;
  }

  /**
   * Check if user is in trial period
   */
  static async isInTrialPeriod(userId?: string): Promise<boolean> {
    try {
      let targetUserId = userId;
      if (!targetUserId) {
        const { userId: authUserId } = await auth();
        if (!authUserId) return false;
        targetUserId = authUserId;
      }

      const subscription = await SubscriptionService.getUserSubscription(targetUserId);
      if (!subscription) return false;

      return SubscriptionService.isInTrialPeriod(subscription);
    } catch (error) {
      console.error('Error checking trial period:', error);
      return false;
    }
  }

  /**
   * Get feature access summary for dashboard
   */
  static async getFeatureAccessSummary() {
    const accessInfo = await this.getAccessInfo();

    return {
      canUploadPDF: accessInfo.hasAccess,
      canProcessAudio: accessInfo.hasAccess,
      canProcessYouTube: accessInfo.hasAccess,
      canGenerateCourse: accessInfo.hasAccess,
      canProcessWebpage: accessInfo.hasAccess,
      canGenerateNotes: accessInfo.hasAccess,
      canViewNotes: true, // Always allow viewing existing notes
      canGenerateFlashcards: accessInfo.hasAccess,
      canGenerateQuizzes: accessInfo.hasAccess,
      subscription: accessInfo.subscription,
    };
  }
}