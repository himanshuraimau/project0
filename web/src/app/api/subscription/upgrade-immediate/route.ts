import { NextResponse, NextRequest } from 'next/server';
import { PaymentService } from '@/lib/payments';
import { getUserFromAuth } from '@/lib/auth-helper';
import type { BillingInterval } from '@/lib/payments';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetPlan } = body;

    if (!targetPlan || !['yearly', 'monthly'].includes(targetPlan)) {
      return NextResponse.json(
        { error: 'Invalid target plan. Must be "yearly" or "monthly".' },
        { status: 400 }
      );
    }

    const { subscription, changeType } = await PaymentService.changePlan({
      userId,
      targetBillingInterval: targetPlan as BillingInterval,
      immediate: true,
    });

    const message = changeType === 'upgrade'
      ? `Successfully upgraded to ${targetPlan} plan. The prorated charge was applied immediately.`
      : `Successfully changed to ${targetPlan} plan. The prorated charge was applied immediately.`;

    return NextResponse.json({
      success: true,
      message,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        priceId: subscription.priceId,
        nextBillingDate: subscription.nextBillingDate,
      },
      changeType,
      immediate: true,
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
