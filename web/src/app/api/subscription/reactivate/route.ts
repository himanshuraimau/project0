// API endpoint to reactivate a cancelled subscription
// Allows users to uncancel their subscription before it expires

import { NextResponse, NextRequest } from 'next/server';
import { getUserFromAuth } from '@/lib/auth-helper';
import { PaymentService } from '@/lib/payments';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Reactivate subscription using centralized PaymentService
    const subscription = await PaymentService.reactivateSubscription(userId);
    if (!subscription) {
      throw new Error('No subscription found');
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
      message: 'Your subscription has been reactivated successfully! It will continue at the end of your current billing period.',
    });
  } catch (error: any) {
    console.error('Error reactivating subscription:', error);

    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    if (error.message?.includes('not cancelled')) {
      return NextResponse.json(
        { error: 'Subscription is not cancelled and does not need reactivation' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to reactivate subscription' },
      { status: 500 }
    );
  }
}
