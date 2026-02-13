// API endpoint to change subscription plan (e.g., monthly to yearly)
// Uses PATCH API to update the existing subscription's product_id
// Dodo handles proration automatically - no immediate charge, changes at next billing cycle

import { NextResponse, NextRequest } from 'next/server';
import { SubscriptionService } from '@/lib/subscription-service';
import { DODO_CONFIG, DodoSubscriptionService } from '@/lib/payments/dodo';
import { getUserFromAuth } from '@/lib/auth-helper';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { targetPlan } = body; // 'yearly' or 'monthly'

    if (!targetPlan || !['yearly', 'monthly'].includes(targetPlan)) {
      return NextResponse.json(
        { error: 'Invalid target plan. Must be "yearly" or "monthly".' },
        { status: 400 }
      );
    }

    // Get product IDs
    const monthlyProductId = DODO_CONFIG.subscriptionProductId;
    const yearlyProductId = DODO_CONFIG.subscriptionProductIdYearly;

    if (!monthlyProductId || !yearlyProductId) {
      return NextResponse.json(
        { error: 'Product IDs not configured' },
        { status: 500 }
      );
    }

    const targetProductId = targetPlan === 'yearly' ? yearlyProductId : monthlyProductId;

    // Get current subscription and sync with Dodo
    const existingSubscription = await SubscriptionService.getSubscriptionWithSync(userId);

    if (!existingSubscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Verify with Dodo that subscription is active
    const dodoSubscription = await DodoSubscriptionService.getSubscription(
      existingSubscription.dodoSubscriptionId
    );

    if (!dodoSubscription) {
      return NextResponse.json(
        { error: 'Could not verify subscription status. Please try again.' },
        { status: 400 }
      );
    }

    if (dodoSubscription.status !== 'active') {
      return NextResponse.json(
        {
          error:
            dodoSubscription.status === 'pending'
              ? 'Please complete your pending payment before changing plans.'
              : `Subscription must be active to change plans. Current status: ${dodoSubscription.status}`,
        },
        { status: 400 }
      );
    }

    // Check if already on target plan
    if (dodoSubscription.product_id === targetProductId) {
      return NextResponse.json(
        { error: `You are already on the ${targetPlan} plan` },
        { status: 400 }
      );
    }

    // IMPORTANT: Do NOT call changePlan() or update() on Dodo
    // Storing the scheduled change in metadata only
    // The actual change will be applied when the subscription renews
    console.log(`Scheduling plan change from ${dodoSubscription.product_id} to ${targetProductId} for next billing cycle...`);
    
    // Store the scheduled change in metadata
    await SubscriptionService.updateSubscriptionMetadata(
      existingSubscription.dodoSubscriptionId,
      {
        ...((existingSubscription.metadata as any) || {}),
        scheduledProductId: targetProductId,
        scheduledPlanType: targetPlan,
        scheduledAt: new Date().toISOString(),
      }
    );

    // Force a sync to get the latest data
    const updated = await SubscriptionService.getSubscriptionWithSync(userId);

    return NextResponse.json({
      success: true,
      message: `Successfully scheduled plan change to ${targetPlan}. You'll continue on your current plan until ${new Date(existingSubscription.nextBillingDate || '').toLocaleDateString()}, then upgrade to ${targetPlan}.`,
      subscription: updated,
      scheduledChange: true,
    });
  } catch (error: any) {
    console.error('Error changing subscription plan:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to change subscription plan' },
      { status: 500 }
    );
  }
}
