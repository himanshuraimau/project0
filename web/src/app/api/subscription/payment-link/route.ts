// API endpoint to get payment link for a pending subscription

import { NextResponse, NextRequest } from 'next/server';
import { getUserFromAuth } from '@/lib/auth-helper';
import { SubscriptionService } from '@/lib/subscription-service';
import { PaddleSubscriptionService } from '@/lib/payments/paddle';

export async function GET(request: NextRequest) {
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

    // Only allow getting payment link for pending subscriptions
    if (subscription.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Payment link is only available for pending subscriptions' },
        { status: 400 }
      );
    }

    // Get payment link from subscription metadata (stored at creation time)
    const paymentLink = subscription.metadata && typeof subscription.metadata === 'object' 
      ? (subscription.metadata as any).paymentLink 
      : null;

    if (!paymentLink) {
      return NextResponse.json(
        { error: 'Payment link not available. Please create a new subscription.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentLink,
    });
  } catch (error: any) {
    console.error('Error getting payment link:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get payment link' },
      { status: 500 }
    );
  }
}
