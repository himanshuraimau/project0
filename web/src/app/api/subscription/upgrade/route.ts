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

    // Step 1: Get the monthly period end date — user keeps access until this date while yearly payment is pending.
    // NOTE: We do NOT cancel the monthly here. Cancellation of the old monthly happens ONLY after the yearly
    // payment is successfully confirmed (in the webhook handler via cancelReplacedMonthlySubscriptionIfAny).
    // Cancelling early would drop the user's subscription if they abandon the checkout page.
    const monthlyPeriodEnd =
      existingSubscription.nextBillingDate ||
      existingSubscription.currentPeriodEnd ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Step 2: Create a Dodo Checkout Session for the yearly plan.
    // Dodo will collect contact info → billing address (tax) → payment in that order.
    // We pass metadata so the webhook knows this is a yearly upgrade and which monthly to cancel.
    console.log('Creating yearly checkout session...');
    const yearlyCheckoutSession = await DodoSubscriptionService.createCheckoutSession({
      userId,
      userEmail: session.user.email,
      userName: session.user.name || session.user.email.split('@')[0],
      productId: yearlyProductId,
      metadata: {
        isYearlyUpgrade: 'true',
        replacedMonthlyDodoSubscriptionId: existingSubscription.dodoSubscriptionId,
        productId: yearlyProductId,
        monthlyPeriodEnd: monthlyPeriodEnd.toISOString(),
      },
    });

    if (!yearlyCheckoutSession.success || !yearlyCheckoutSession.checkoutUrl) {
      throw new Error(yearlyCheckoutSession.error || 'Failed to create yearly checkout session');
    }

    // NOTE: We do NOT update the DB here. The `subscription.created` webhook fires as soon as the
    // checkout session is initiated by Dodo. The webhook handler reads the metadata (isYearlyUpgrade,
    // replacedMonthlyDodoSubscriptionId) and calls SubscriptionService.replaceWithPendingYearlyUpgrade
    // at that point. This keeps the DB consistent with what Dodo actually knows about.

    return NextResponse.json({
      success: true,
      requiresPayment: true,
      paymentLink: yearlyCheckoutSession.checkoutUrl,
      message: 'Please complete payment to upgrade to yearly plan.',
      sessionId: yearlyCheckoutSession.sessionId,
    });
  } catch (error: any) {
    console.error('Error upgrading subscription:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to upgrade subscription' },
      { status: 500 }
    );
  }
}
