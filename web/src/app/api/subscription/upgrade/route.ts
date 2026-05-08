import { getUserFromAuth } from '@/lib/auth-helper';
import { PaymentService } from '@/lib/payments';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription, changeType } = await PaymentService.changePlan({
      userId,
      targetBillingInterval: 'yearly',
      immediate: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully upgraded to Yearly plan. The prorated charge was applied immediately.',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        priceId: subscription.priceId,
      },
      changeType,
      scheduledChange: false,
    });
  } catch (error: any) {
    console.error('Error upgrading subscription:', error);

    if (error.message?.includes('not found')) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    if (error.message?.includes('already on') || error.message?.includes('must be active')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to upgrade subscription' },
      { status: 500 }
    );
  }
}
