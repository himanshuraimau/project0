import { NextResponse, NextRequest } from 'next/server';
import { getUserFromAuth } from '@/lib/auth-helper';
import { PaymentService } from '@/lib/payments';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      message: 'Your subscription has been reactivated successfully!',
    });
  } catch (error: any) {
    console.error('Error reactivating subscription:', error);

    if (error.message?.includes('not found')) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to reactivate subscription' },
      { status: 500 }
    );
  }
}
