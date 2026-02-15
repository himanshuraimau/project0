// API endpoint to upgrade subscription from monthly to yearly
// Uses payment link flow: cancel monthly at period end + create new yearly subscription with payment.
// User is redirected to Dodo checkout to complete payment - matches "Continue to Payment" dialog promise.
// For one-click upgrades (charge saved card, no redirect), use /api/subscription/change-plan instead.

import { NextResponse, NextRequest } from 'next/server';
import { SubscriptionService } from '@/lib/subscription-service';
import { DODO_CONFIG, DodoSubscriptionService } from '@/lib/payments/dodo';
import { getUserFromAuth } from '@/lib/auth-helper';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const yearlyProductId = DODO_CONFIG.subscriptionProductIdYearly;
    if (!yearlyProductId) {
      return NextResponse.json(
        { error: 'Yearly product not configured' },
        { status: 500 }
      );
    }

    // Get current subscription and sync with Dodo (reconcile)
    const existingSubscription = await SubscriptionService.getSubscriptionWithSync(userId);

    if (!existingSubscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Verify with Dodo that payment has cleared - only allow upgrade for active, paid subscriptions
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
              ? 'Please complete your pending payment before upgrading.'
              : 'Subscription must be active to upgrade. Current status: ' + dodoSubscription.status,
        },
        { status: 400 }
      );
    }

    // Check if already on yearly plan (use Dodo as source of truth)
    if (dodoSubscription.product_id === yearlyProductId) {
      return NextResponse.json(
        { error: 'You are already on the yearly plan' },
        { status: 400 }
      );
    }

    // Get user details
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Step 1: Cancel current monthly subscription at period end (user keeps access until then)
    console.log('Scheduling monthly subscription to cancel at period end...');
    const cancelResult = await DodoSubscriptionService.cancelSubscription(
      existingSubscription.dodoSubscriptionId,
      true
    );

    if (!cancelResult.success) {
      throw new Error(cancelResult.error || 'Failed to schedule cancellation');
    }

    // Get monthly period end from Dodo response (user keeps access until this date)
    const dodoData = cancelResult.data as { next_billing_date?: string } | undefined;
    const monthlyPeriodEnd = dodoData?.next_billing_date
      ? new Date(dodoData.next_billing_date)
      : existingSubscription.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Step 2: Create NEW yearly subscription with payment link - user pays here to confirm upgrade
    console.log('Creating new yearly subscription with payment link...');
    const yearlySubscription = await DodoSubscriptionService.createSubscription({
      userId,
      userEmail: session.user.email,
      userName: session.user.name || session.user.email.split('@')[0],
      billingAddress: {
        city: 'Default City',
        country: 'US',
        state: 'CA',
        street: 'Default Street',
        zipcode: '00000',
      },
      billingInterval: 'yearly',
    });

    if (!yearlySubscription.success || !yearlySubscription.paymentLink) {
      throw new Error(yearlySubscription.error || 'Failed to create yearly subscription');
    }

    // Step 3: Replace our DB record - we now track the new yearly subscription (PENDING until payment)
    await SubscriptionService.replaceWithPendingYearlyUpgrade(
      userId,
      yearlySubscription.subscriptionId!,
      yearlyProductId,
      monthlyPeriodEnd
    );

    return NextResponse.json({
      success: true,
      requiresPayment: true,
      paymentLink: yearlySubscription.paymentLink,
      message: 'Please complete payment to upgrade to yearly plan.',
      subscriptionId: yearlySubscription.subscriptionId,
    });
  } catch (error: any) {
    console.error('Error upgrading subscription:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to upgrade subscription' },
      { status: 500 }
    );
  }
}
