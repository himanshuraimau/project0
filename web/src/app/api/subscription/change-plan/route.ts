// API endpoint to change subscription plan (e.g., monthly to yearly)
// Supports both immediate (with proration) and scheduled (at renewal) changes
// Default behavior: Schedules change at next billing cycle (no immediate charge)

import { NextResponse, NextRequest } from 'next/server';
import { PaymentService } from '@/lib/payments';
import { getUserFromAuth } from '@/lib/auth-helper';
import type { BillingInterval } from '@/lib/payments';

interface ChangePlanRequest {
  targetPlan: 'yearly' | 'monthly';
  immediate?: boolean; // If true, change immediately with proration; if false, schedule at renewal
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

    const body: ChangePlanRequest = await request.json();
    const { targetPlan, immediate = false } = body; // Default to scheduled change

    if (!targetPlan || !['yearly', 'monthly'].includes(targetPlan)) {
      return NextResponse.json(
        { error: 'Invalid target plan. Must be "yearly" or "monthly".' },
        { status: 400 }
      );
    }

    // Change plan using centralized PaymentService
    const { subscription, changeType, scheduledChange } = await PaymentService.changePlan({
      userId,
      targetBillingInterval: targetPlan as BillingInterval,
      immediate,
    });

    // Format the response message
    let message: string;
    if (immediate) {
      message = changeType === 'upgrade'
        ? `Successfully upgraded to ${targetPlan} plan. The change is effective immediately and you were charged a prorated amount.`
        : `Successfully changed to ${targetPlan} plan. The change is effective immediately with a prorated credit applied.`;
    } else {
      message = `Successfully scheduled plan change to ${targetPlan}. You'll continue on your current plan until ${formatDate(subscription.nextBillingDate)}, then switch to ${targetPlan}.`;
    }

    return NextResponse.json({
      success: true,
      message,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        productId: subscription.productId,
      },
      changeType,
      scheduledChange: immediate ? false : scheduledChange,
    });
  } catch (error: any) {
    console.error('Error changing subscription plan:', error);

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
      { error: error.message || 'Failed to change subscription plan' },
      { status: 500 }
    );
  }
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'your next billing date';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
