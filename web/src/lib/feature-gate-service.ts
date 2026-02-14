// Feature Gate Service - Control access to features based on subscription

import { SubscriptionService } from './subscription-service';
import { prisma } from './prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { PRO_PLAN_LIMITS, FREE_TIER_LIMITS, type UsageStats } from './config/subscription-limits';

export class FeatureGateService {
  /**
   * Get user's usage statistics (cached counters)
   */
  static async getUserUsageStats(userId: string): Promise<UsageStats> {
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
        }
      });
      
      if (!user) {
        return {
          usedNotesThisMonth: 0,
          usedCoursesThisMonth: 0,
          usedPdfProcessingThisMonth: 0,
          usedVideoProcessingThisMonth: 0,
          usedAudioProcessingThisMonth: 0,
          lastUsageResetDate: null,
        };
      }
      
      return user;
    } catch (error) {
      console.error('Error getting user usage stats:', error);
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

  /**
   * Get user's note count from the database (legacy method)
   */
  static async getUserNoteCount(userId: string): Promise<number> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { notesCount: true }
      });
      return user?.notesCount ?? 0;
    } catch (error) {
      console.error('Error getting user note count:', error);
      return 0;
    }
  }

  /**
   * Increment usage counter for a feature
   */
  static async incrementUsage(
    userId: string,
    feature: 'notes' | 'courses' | 'pdf' | 'video' | 'audio'
  ): Promise<void> {
    try {
      const fieldMap = {
        notes: 'usedNotesThisMonth',
        courses: 'usedCoursesThisMonth',
        pdf: 'usedPdfProcessingThisMonth',
        video: 'usedVideoProcessingThisMonth',
        audio: 'usedAudioProcessingThisMonth',
      };

      await prisma.user.update({
        where: { id: userId },
        data: {
          [fieldMap[feature]]: { increment: 1 }
        }
      });

      console.log(`✅ Incremented ${feature} usage for user ${userId}`);
    } catch (error) {
      console.error(`Error incrementing ${feature} usage:`, error);
    }
  }

  /**
   * Convenience methods for incrementing specific features
   */
  static async incrementNoteUsage(userId: string): Promise<void> {
    await this.incrementUsage(userId, 'notes');
  }

  /**
   * Atomically reserve one note usage slot.
   * Prevents race conditions when multiple note-creation requests happen concurrently.
   */
  static async reserveNoteUsage(userId: string): Promise<{
    allowed: boolean;
    error?: string;
    message?: string;
    notesUsed?: number;
    notesLimit?: number | null;
    statusCode: number;
    upgradeUrl?: string;
  }> {
    try {
      const hasSubscription = await SubscriptionService.hasActiveSubscription(userId);
      const subscription = await SubscriptionService.getUserSubscription(userId);

      const notesLimit = hasSubscription && subscription
        ? subscription.notesPerMonth
        : FREE_TIER_LIMITS.notesPerMonth;

      if (notesLimit === null) {
        await prisma.user.update({
          where: { id: userId },
          data: { usedNotesThisMonth: { increment: 1 } },
        });

        const usage = await this.getUserUsageStats(userId);
        return {
          allowed: true,
          notesUsed: usage.usedNotesThisMonth,
          notesLimit: null,
          statusCode: 200,
        };
      }

      const reserved = await prisma.user.updateMany({
        where: {
          id: userId,
          usedNotesThisMonth: { lt: notesLimit },
        },
        data: {
          usedNotesThisMonth: { increment: 1 },
        },
      });

      if (reserved.count === 0) {
        const usage = await this.getUserUsageStats(userId);

        if (hasSubscription) {
          return {
            allowed: false,
            error: 'MONTHLY_NOTE_LIMIT_REACHED',
            message: `You've reached your monthly note limit of ${notesLimit}.`,
            notesUsed: usage.usedNotesThisMonth,
            notesLimit,
            statusCode: 403,
          };
        }

        return {
          allowed: false,
          error: 'FREE_TIER_LIMIT_REACHED',
          message: `You've reached the free tier limit of ${FREE_TIER_LIMITS.notesPerMonth} notes. Upgrade to Pro for unlimited notes.`,
          notesUsed: usage.usedNotesThisMonth,
          notesLimit,
          statusCode: 403,
          upgradeUrl: '/pricing',
        };
      }

      const usage = await this.getUserUsageStats(userId);
      return {
        allowed: true,
        notesUsed: usage.usedNotesThisMonth,
        notesLimit,
        statusCode: 200,
      };
    } catch (error) {
      console.error('Error reserving note usage:', error);
      return {
        allowed: false,
        error: 'NOTE_USAGE_RESERVATION_FAILED',
        message: 'Failed to reserve note usage. Please try again.',
        statusCode: 500,
      };
    }
  }

  static async incrementCourseUsage(userId: string): Promise<void> {
    await this.incrementUsage(userId, 'courses');
  }

  static async incrementPdfUsage(userId: string): Promise<void> {
    await this.incrementUsage(userId, 'pdf');
  }

  static async incrementVideoUsage(userId: string): Promise<void> {
    await this.incrementUsage(userId, 'video');
  }

  static async incrementAudioUsage(userId: string): Promise<void> {
    await this.incrementUsage(userId, 'audio');
  }

  /**
   * Decrement note usage (used when note creation fails after incrementing)
   */
  static async decrementNoteUsage(userId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          usedNotesThisMonth: { decrement: 1 }
        }
      });
      console.log(`✅ Decremented note usage for user ${userId}`);
    } catch (error) {
      console.error('Error decrementing note usage:', error);
    }
  }

  /**
   * Check if user can create more courses (uses subscription limits from database)
   */
  static async canCreateCourse(userId?: string): Promise<{ allowed: boolean; reason?: string; coursesUsed?: number; coursesLimit?: number }> {
    try {
      // If no userId provided, get from auth
      let targetUserId = userId;
      if (!targetUserId) {
        const session = await auth.api.getSession({ headers: await headers() }); 
        const authUserId = session?.user?.id;
        if (!authUserId) return { allowed: false, reason: 'NOT_AUTHENTICATED' };
        targetUserId = authUserId;
      }

      if (!targetUserId) return { allowed: false, reason: 'INVALID_USER_ID' };

      // Check if user has active subscription
      const hasSubscription = await SubscriptionService.hasActiveSubscription(targetUserId);
      const subscription = await SubscriptionService.getUserSubscription(targetUserId);

      // Get cached usage stats
      const usage = await this.getUserUsageStats(targetUserId);

      if (hasSubscription && subscription) {
        // Subscribed users: check monthly limit from subscription
        const coursesLimit = subscription.coursesPerMonth;
        const coursesUsed = usage.usedCoursesThisMonth;
        
        if (coursesUsed >= coursesLimit) {
          return {
            allowed: false,
            reason: 'MONTHLY_LIMIT_REACHED',
            coursesUsed,
            coursesLimit
          };
        }

        return {
          allowed: true,
          reason: 'SUBSCRIPTION_ACTIVE',
          coursesUsed,
          coursesLimit
        };
      }

      // Free tier: no course generation allowed
      return {
        allowed: false,
        reason: 'SUBSCRIPTION_REQUIRED',
        coursesUsed: usage.usedCoursesThisMonth,
        coursesLimit: FREE_TIER_LIMITS.coursesPerMonth
      };
    } catch (error) {
      console.error('Error checking course creation access:', error);
      return { allowed: false, reason: 'ERROR' };
    }
  }

  /**
   * Check if user can create more notes (uses subscription limits from database)
   */
  static async canCreateNote(userId?: string): Promise<{ allowed: boolean; reason?: string; notesUsed?: number; notesLimit?: number | null }> {
    try {
      // If no userId provided, get from auth
      let targetUserId = userId;
      if (!targetUserId) {
        const session = await auth.api.getSession({ headers: await headers() }); 
        const authUserId = session?.user?.id;
        if (!authUserId) return { allowed: false, reason: 'NOT_AUTHENTICATED' };
        targetUserId = authUserId;
      }

      if (!targetUserId) return { allowed: false, reason: 'INVALID_USER_ID' };

      // Check if user has active subscription
      const hasSubscription = await SubscriptionService.hasActiveSubscription(targetUserId);
      const subscription = await SubscriptionService.getUserSubscription(targetUserId);

      // Get cached usage stats
      const usage = await this.getUserUsageStats(targetUserId);

      if (hasSubscription && subscription) {
        // Subscribed users: check limit from subscription (null = unlimited)
        const notesLimit = subscription.notesPerMonth;
        const notesUsed = usage.usedNotesThisMonth;

        if (notesLimit === null) {
          // Unlimited notes
          return {
            allowed: true,
            reason: 'SUBSCRIPTION_ACTIVE',
            notesUsed,
            notesLimit: null
          };
        }

        if (notesUsed >= notesLimit) {
          return {
            allowed: false,
            reason: 'MONTHLY_LIMIT_REACHED',
            notesUsed,
            notesLimit
          };
        }

        return {
          allowed: true,
          reason: 'SUBSCRIPTION_ACTIVE',
          notesUsed,
          notesLimit
        };
      }

      // Free tier: check monthly usage counter (not total note count)
      // This matches the counter we increment in incrementNoteUsage()
      const freeLimit = FREE_TIER_LIMITS.notesPerMonth;
      const notesUsed = usage.usedNotesThisMonth;

      if (notesUsed >= freeLimit) {
        return {
          allowed: false,
          reason: 'FREE_TIER_LIMIT_REACHED',
          notesUsed,
          notesLimit: freeLimit
        };
      }

      return {
        allowed: true,
        reason: 'FREE_TIER',
        notesUsed,
        notesLimit: freeLimit
      };
    } catch (error) {
      console.error('Error checking note creation access:', error);
      return { allowed: false, reason: 'ERROR' };
    }
  }

  /**
   * Check if user can access any feature (requires active subscription)
   */
  static async canAccessFeature(userId?: string): Promise<boolean> {
    try {
      // If no userId provided, get from auth
      let targetUserId = userId;
      if (!targetUserId) {
        const session = await auth.api.getSession({ headers: await headers() }); 
        const authUserId = session?.user?.id;
        if (!authUserId) return false;
        targetUserId = authUserId;
      }

      if (!targetUserId) return false;
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
    const session = await auth.api.getSession({ headers: await headers() }); const userId = session?.user?.id;
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
   * Check feature access for note creation (allows free tier)
   */
  static async checkNoteCreationAccess() {
    const session = await auth.api.getSession({ headers: await headers() }); const userId = session?.user?.id;

    if (!userId) {
      return {
        allowed: false,
        statusCode: 401,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      };
    }

    const noteAccess = await this.canCreateNote(userId);

    if (!noteAccess.allowed) {
      if (noteAccess.reason === 'FREE_TIER_LIMIT_REACHED') {
        return {
          allowed: false,
          statusCode: 403,
          error: 'FREE_TIER_LIMIT_REACHED',
          message: `You've reached the free tier limit of ${FREE_TIER_LIMITS.notesPerMonth} notes. Upgrade to Pro for unlimited notes.`,
          notesUsed: noteAccess.notesUsed,
          notesLimit: noteAccess.notesLimit,
          upgradeUrl: '/pricing?reason=note-limit',
        };
      }

      return {
        allowed: false,
        statusCode: 403,
        error: 'ACCESS_DENIED',
        message: 'Unable to create note',
      };
    }

    return {
      allowed: true,
      reason: noteAccess.reason,
      notesUsed: noteAccess.notesUsed,
      notesLimit: noteAccess.notesLimit,
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
   * Check course generation access (requires subscription + monthly limit check)
   * Free users are completely blocked from course generation
   */
  static async checkCourseGenerationAccess() {
    const session = await auth.api.getSession({ headers: await headers() }); 
    const userId = session?.user?.id;

    if (!userId) {
      return {
        allowed: false,
        statusCode: 401,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      };
    }

    const courseAccess = await this.canCreateCourse(userId);

    if (!courseAccess.allowed) {
      if (courseAccess.reason === 'SUBSCRIPTION_REQUIRED') {
        return {
          allowed: false,
          statusCode: 403,
          error: 'SUBSCRIPTION_REQUIRED',
          message: 'Active subscription required for course generation',
          upgradeUrl: '/pricing?reason=course-generation',
        };
      }

      if (courseAccess.reason === 'MONTHLY_LIMIT_REACHED') {
        return {
          allowed: false,
          statusCode: 403,
          error: 'MONTHLY_LIMIT_REACHED',
          message: `You've reached the monthly limit of ${courseAccess.coursesLimit} courses. Your limit will reset next month.`,
          coursesUsed: courseAccess.coursesUsed,
          coursesLimit: courseAccess.coursesLimit,
        };
      }

      return {
        allowed: false,
        statusCode: 403,
        error: 'ACCESS_DENIED',
        message: 'Unable to create course',
      };
    }

    return {
      allowed: true,
      reason: courseAccess.reason,
      coursesUsed: courseAccess.coursesUsed,
      coursesLimit: courseAccess.coursesLimit,
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
        const session = await auth.api.getSession({ headers: await headers() }); 
        const authUserId = session?.user?.id;
        if (!authUserId) return false;
        targetUserId = authUserId;
      }

      if (!targetUserId) return false;
      const subscription = await SubscriptionService.getUserSubscription(targetUserId);
      if (!subscription) return false;

      return SubscriptionService.isInTrialPeriod(subscription);
    } catch (error) {
      console.error('Error checking trial period:', error);
      return false;
    }
  }

  /**
   * Check post generation access (requires subscription - no free tier)
   * Note: Post generation feature not yet implemented, but this method is ready for when it is added
   */
  static async checkPostGenerationAccess() {
    const session = await auth.api.getSession({ headers: await headers() }); 
    const userId = session?.user?.id;

    if (!userId) {
      return {
        allowed: false,
        statusCode: 401,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      };
    }

    // Post generation requires active subscription (no free tier)
    const hasSubscription = await SubscriptionService.hasActiveSubscription(userId);

    if (!hasSubscription) {
      return {
        allowed: false,
        statusCode: 403,
        error: 'SUBSCRIPTION_REQUIRED',
        message: 'Active subscription required for post generation',
        upgradeUrl: '/pricing?reason=post-generation',
      };
    }

    return {
      allowed: true,
      reason: 'SUBSCRIPTION_ACTIVE',
    };
  }

  /**
   * Get feature access summary for dashboard
   */
  static async getFeatureAccessSummary() {
    const accessInfo = await this.getAccessInfo();
    const session = await auth.api.getSession({ headers: await headers() }); const userId = session?.user?.id;

    let noteAccess: { allowed: boolean; reason?: string; notesUsed?: number; notesLimit?: number | null } = {
      allowed: false,
      notesUsed: 0,
      notesLimit: FREE_TIER_LIMITS.notesPerMonth
    };
    if (userId) {
      noteAccess = await this.canCreateNote(userId);
    }

    const freeLimit = FREE_TIER_LIMITS.notesPerMonth;
    const notesLimit = noteAccess.notesLimit ?? freeLimit;

    return {
      canUploadPDF: noteAccess.allowed,
      canProcessAudio: noteAccess.allowed,
      canProcessYouTube: noteAccess.allowed,
      canGenerateCourse: accessInfo.hasAccess,
      canProcessWebpage: noteAccess.allowed,
      canGenerateNotes: noteAccess.allowed,
      canViewNotes: true, // Always allow viewing existing notes
      canGenerateFlashcards: accessInfo.hasAccess,
      canGenerateQuizzes: accessInfo.hasAccess,
      subscription: accessInfo.subscription,
      freeNotes: {
        used: noteAccess.notesUsed || 0,
        limit: notesLimit,
        remaining: Math.max(0, notesLimit - (noteAccess.notesUsed || 0)),
      },
    };
  }
}