// API endpoint to cancel/delete a pending subscription

import { NextResponse, NextRequest } from 'next/server';
import { getUserFromAuth } from '@/lib/auth-helper';
import { SubscriptionService } from '@/lib/subscription-service';
import { DodoSubscriptionService } from '@/lib/utils/dodo/subscription';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's subscription
    const subscription = await SubscriptionService.getUserSubscription(userId);

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    // Only allow canceling pending subscriptions through this endpoint
    if (subscription.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This endpoint is only for pending subscriptions. Use /api/subscription/cancel for active subscriptions.' },
        { status: 400 }
      );
    }

    // Cancel subscription with Dodo (for pending, this will mark it as cancelled)
    const cancelResult = await DodoSubscriptionService.cancelSubscription(
      subscription.dodoSubscriptionId,
      false // Don't wait for period end, cancel immediately
    );

    if (!cancelResult.success) {
      // If cancel fails, we can still delete from our database
      console.warn('Failed to cancel subscription in Dodo, deleting from database anyway:', cancelResult.error);
    }

    // Delete subscription from our database (since it's pending and never activated)
    // This allows the user to create a new subscription
    try {
      await SubscriptionService.deleteSubscription(userId);
    } catch (error) {
      console.error('Error deleting subscription from database:', error);
      // If delete fails but Dodo cancel succeeded, still return success
      if (cancelResult.success) {
        return NextResponse.json({
          success: true,
          message: 'Pending subscription cancelled in Dodo. Please refresh the page.',
        });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Pending subscription cancelled successfully',
    });
  } catch (error: any) {
    console.error('Error cancelling pending subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel pending subscription' },
      { status: 500 }
    );
  }
}
