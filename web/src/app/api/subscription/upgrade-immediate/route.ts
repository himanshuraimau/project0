// API endpoint for immediate plan upgrades with proration
// Changes plan instantly and charges/credits prorated amount
// For scheduled changes (at renewal), use /change-plan instead

import { NextResponse, NextRequest } from 'next/server';
import { PaymentService } from '@/lib/payments';
import { getUserFromAuth } from '@/lib/auth-helper';
import type { BillingInterval } from '@/lib/payments';

interface ImmediateUpgradeRequest {
  targetPlan: 'yearly' | 'monthly';
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: ImmediateUpgradeRequest = await request.json();
    const { targetPlan } = body;

    if (!targetPlan || !['yearly', 'monthly'].includes(targetPlan)) {
      return NextResponse.json(
        { error: 'Invalid target plan. Must be "yearly" or "monthly".' },
        { status: 400 }
      );
    }

    // Change plan immediately with proration
    const { subscription, changeType } = await PaymentService.changePlan({
      userId,
      targetBillingInterval: targetPlan as BillingInterval,
      immediate: true, // immediate=true for instant change with proration
    });

    // Format the response message based on change type
    const message = changeType === 'upgrade'
      ? `Successfully upgraded to ${targetPlan} plan! The change is effective immediately and you were charged a prorated amount for the remainder of your billing period.`
      : changeType === 'downgrade'
      ? `Successfully downgraded to ${targetPlan} plan. The change is effective immediately and a prorated credit has been applied to your account.`
      : `Successfully changed to ${targetPlan} plan. The change is effective immediately.`;

    return NextResponse.json({
      success: true,
      message,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        productId: subscription.productId,
        nextBillingDate: subscription.nextBillingDate,
      },
      changeType,
      immediate: true,
    });
  } catch (error: any) {
    console.error('Error upgrading subscription:', error);

    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    if (error.message?.includes('already on')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error.message?.includes('must be active')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to upgrade subscription' },
      { status: 500 }
    );
  }
}
