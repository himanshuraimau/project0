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
    const { targetPlan, immediate = true } = body;

    if (!targetPlan || !['yearly', 'monthly'].includes(targetPlan)) {
      return NextResponse.json(
        { error: 'Invalid target plan. Must be "yearly" or "monthly".' },
        { status: 400 }
      );
    }

    const { subscription, changeType, scheduledChange } = await PaymentService.changePlan({
      userId,
      targetBillingInterval: targetPlan as BillingInterval,
      immediate,
    });

    let message: string;
    if (immediate) {
      message = changeType === 'upgrade'
        ? `Successfully upgraded to ${targetPlan} plan. The prorated charge was applied immediately.`
        : `Successfully changed to ${targetPlan} plan. The prorated charge was applied immediately.`;
    } else {
      message = `Successfully scheduled plan change to ${targetPlan}. You'll switch at your next billing date.`;
    }

    return NextResponse.json({
      success: true,
      message,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        priceId: subscription.priceId,
      },
      changeType,
      scheduledChange: immediate ? false : scheduledChange,
    });
  } catch (error: any) {
    console.error('Error changing subscription plan:', error);

    if (error.message?.includes('not found')) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    if (error.message?.includes('already on') || error.message?.includes('must be active')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to change subscription plan' },
      { status: 500 }
    );
  }
}
