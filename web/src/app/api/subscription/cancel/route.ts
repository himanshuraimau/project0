// API endpoint to cancel user's subscription

import { NextResponse, NextRequest } from 'next/server';
import { getUserFromAuth } from '@/lib/auth-helper';
import { SubscriptionService } from '@/lib/subscription-service';
import { DodoSubscriptionService } from '@/lib/payments/dodo';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get body params
    const body = await request.json();
    const { cancelAtPeriodEnd = true } = body;

    // Get user's subscription
    const subscription = await SubscriptionService.getUserSubscription(userId);

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    if (subscription.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Subscription is already cancelled' },
        { status: 400 }
      );
    }

    // Cancel subscription with Dodo
    const cancelResult = await DodoSubscriptionService.cancelSubscription(
      subscription.dodoSubscriptionId,
      cancelAtPeriodEnd
    );

    if (!cancelResult.success) {
      throw new Error(cancelResult.error || 'Failed to cancel subscription with Dodo');
    }

    // Update subscription in database
    const updatedSubscription = await SubscriptionService.cancelSubscription(
      subscription.id,
      cancelAtPeriodEnd
    );

    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        cancelAtPeriodEnd: updatedSubscription.cancelAtPeriodEnd,
        cancelledAt: updatedSubscription.cancelledAt,
      },
      message: cancelAtPeriodEnd
        ? 'Your subscription will be cancelled at the end of the current billing period.'
        : 'Your subscription has been cancelled immediately.',
    });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
