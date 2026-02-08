// API endpoint to get user's subscription status

import { NextResponse, NextRequest } from 'next/server';
import { getUserFromAuth } from '@/lib/auth-helper';
import { SubscriptionService } from '@/lib/subscription-service';
import { FeatureGateService } from '@/lib/feature-gate-service';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get subscription with sync from Dodo
    const subscription = await SubscriptionService.getSubscriptionWithSync(userId);

    // Get feature access summary (needed for free tier too)
    const featureAccess = await FeatureGateService.getFeatureAccessSummary();

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        subscription: null,
        access: {
          hasAccess: false,
          reason: 'NO_SUBSCRIPTION',
        },
        features: featureAccess,
      });
    }

    // Get display info
    const displayInfo = SubscriptionService.getSubscriptionDisplayInfo(subscription);

    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        displayStatus: displayInfo.displayStatus,
        productId: subscription.productId,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        nextBillingDate: subscription.nextBillingDate,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        cancelledAt: subscription.cancelledAt,
        trialEnd: subscription.trialEnd,
        createdAt: subscription.createdAt,
      },
      access: {
        hasAccess: displayInfo.hasAccess,
        isActive: displayInfo.isActive,
        isTrial: displayInfo.isTrial,
        daysRemaining: displayInfo.daysRemaining,
      },
      features: featureAccess,
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}