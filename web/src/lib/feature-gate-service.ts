// Feature Gate Service - Control access to features based on subscription

import { SubscriptionService } from './subscription-service';
import { prisma } from './prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const FREE_TIER_NOTE_LIMIT = 1; // Changed from 3 to 1 free note
const MONTHLY_COURSE_LIMIT = 5; // Maximum courses per month

export class FeatureGateService {
  /**
   * Get user's note count from the database
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
   * Get user's course count for the current month
   */
  static async getUserMonthlyCourseCount(userId: string): Promise<number> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const courseCount = await prisma.course.count({
        where: {
          userId,
          createdAt: {
            gte: startOfMonth
          }
        }
      });
      
      return courseCount;
    } catch (error) {
      console.error('Error getting user monthly course count:', error);
      return 0;
    }
  }

  /**
   * Check if user can create more courses (limit: 5 per month for subscribed users, no course generation for free users)
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

      if (hasSubscription) {
        // Subscribed users: check monthly limit
        const courseCount = await this.getUserMonthlyCourseCount(targetUserId);
        
        if (courseCount >= MONTHLY_COURSE_LIMIT) {
          return {
            allowed: false,
            reason: 'MONTHLY_LIMIT_REACHED',
            coursesUsed: courseCount,
            coursesLimit: MONTHLY_COURSE_LIMIT
          };
        }

        return {
          allowed: true,
          reason: 'SUBSCRIPTION_ACTIVE',
          coursesUsed: courseCount,
          coursesLimit: MONTHLY_COURSE_LIMIT
        };
      }

      // Free tier: no course generation allowed (course generation requires subscription)
      return {
        allowed: false,
        reason: 'SUBSCRIPTION_REQUIRED',
        coursesUsed: 0,
        coursesLimit: 0
      };
    } catch (error) {
      console.error('Error checking course creation access:', error);
      return { allowed: false, reason: 'ERROR' };
    }
  }

  /**
   * Check if user can create more notes (free tier: 1 note, subscription: unlimited)
   */
  static async canCreateNote(userId?: string): Promise<{ allowed: boolean; reason?: string; notesUsed?: number; notesLimit?: number }> {
    try {
      // If no userId provided, get from auth
      let targetUserId = userId;
      if (!targetUserId) {
        const session = await auth.api.getSession({ headers: await headers() }); 
        const authUserId = session?.user?.id;
        if (!authUserId) return { allowed: false, reason: 'NOT_AUTHENTICATED' };
        targetUserId = authUserId;
      }

      // Check if user has active subscription
      if (!targetUserId) return { allowed: false, reason: 'INVALID_USER_ID' };
      const hasSubscription = await SubscriptionService.hasActiveSubscription(targetUserId);

      if (hasSubscription) {
        return { allowed: true, reason: 'SUBSCRIPTION_ACTIVE' };
      }

      // Free tier: check note count limit
      const noteCount = await this.getUserNoteCount(targetUserId);

      if (noteCount >= FREE_TIER_NOTE_LIMIT) {
        return {
          allowed: false,
          reason: 'FREE_TIER_LIMIT_REACHED',
          notesUsed: noteCount,
          notesLimit: FREE_TIER_NOTE_LIMIT
        };
      }

      return {
        allowed: true,
        reason: 'FREE_TIER',
        notesUsed: noteCount,
        notesLimit: FREE_TIER_NOTE_LIMIT
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
          message: `You've reached the free tier limit of ${FREE_TIER_NOTE_LIMIT} notes. Upgrade to Pro for unlimited notes.`,
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
          message: `You've reached the monthly limit of ${MONTHLY_COURSE_LIMIT} courses. Your limit will reset next month.`,
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

    let noteAccess: { allowed: boolean; reason?: string; notesUsed?: number; notesLimit?: number } = {
      allowed: false,
      notesUsed: 0,
      notesLimit: FREE_TIER_NOTE_LIMIT
    };
    if (userId) {
      noteAccess = await this.canCreateNote(userId);
    }

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
        limit: noteAccess.notesLimit || FREE_TIER_NOTE_LIMIT,
        remaining: Math.max(0, (noteAccess.notesLimit || FREE_TIER_NOTE_LIMIT) - (noteAccess.notesUsed || 0)),
      },
    };
  }
}