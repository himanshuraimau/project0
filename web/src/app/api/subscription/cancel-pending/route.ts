import { NextResponse, NextRequest } from 'next/server';
import { getUserFromAuth } from '@/lib/auth-helper';
import { SubscriptionService } from '@/lib/subscription-service';
import { PaddleSubscriptionService } from '@/lib/payments/paddle';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await SubscriptionService.getUserSubscription(userId);

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    if (subscription.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This endpoint is only for pending subscriptions. Use /api/subscription/cancel for active subscriptions.' },
        { status: 400 }
      );
    }

    const cancelResult = await PaddleSubscriptionService.cancelSubscription(
      subscription.paddleSubscriptionId,
      'immediately'
    );

    if (!cancelResult.success) {
      console.warn('Failed to cancel pending subscription in Paddle:', cancelResult.error);
    }

    try {
      await SubscriptionService.deleteSubscription(userId);
    } catch (error) {
      console.error('Error deleting subscription from database:', error);
      if (cancelResult.success) {
        return NextResponse.json({
          success: true,
          message: 'Pending subscription cancelled. Please refresh the page.',
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
