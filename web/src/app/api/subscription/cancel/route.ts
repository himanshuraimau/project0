import { NextResponse, NextRequest } from 'next/server';
import { getUserFromAuth } from '@/lib/auth-helper';
import { PaymentService } from '@/lib/payments';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { cancelAtPeriodEnd?: boolean } = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is fine
    }
    const { cancelAtPeriodEnd = true } = body;

    const subscription = await PaymentService.cancelSubscription({ userId, cancelAtPeriodEnd });

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        cancelledAt: subscription.cancelledAt,
      },
      message: cancelAtPeriodEnd
        ? `Your subscription will be cancelled at the end of the current billing period (${formatDate(subscription.currentPeriodEnd || subscription.nextBillingDate)}).`
        : 'Your subscription has been cancelled immediately.',
    });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);

    if (error.message?.includes('not found')) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    if (error.message?.includes('already cancelled')) {
      return NextResponse.json({ error: 'Subscription is already cancelled' }, { status: 400 });
    }

    if (error.message?.includes('managed')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'the end of your billing period';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
