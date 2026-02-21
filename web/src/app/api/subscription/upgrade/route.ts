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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const yearlyProductId = DODO_CONFIG.subscriptionProductIdYearly;
    if (!yearlyProductId) {
      return NextResponse.json({ error: 'Yearly product not configured' }, { status: 500 });
    }

    const existingSubscription = await SubscriptionService.getSubscriptionWithSync(userId);

    if (!existingSubscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const dodoSubscription = await DodoSubscriptionService.getSubscription(existingSubscription.dodoSubscriptionId);

    if (!dodoSubscription) {
      return NextResponse.json({ error: 'Could not verify subscription status. Please try again.' }, { status: 400 });
    }

    if (dodoSubscription.status !== 'active') {
      return NextResponse.json({
        error: dodoSubscription.status === 'pending'
          ? 'Please complete your pending payment before upgrading.'
          : 'Subscription must be active to upgrade. Current status: ' + dodoSubscription.status,
      }, { status: 400 });
    }

    if (dodoSubscription.product_id === yearlyProductId) {
      return NextResponse.json({ error: 'You are already on the yearly plan' }, { status: 400 });
    }

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    const monthlyPeriodEnd = existingSubscription.nextBillingDate || existingSubscription.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

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

    return NextResponse.json({
      success: true,
      requiresPayment: true,
      paymentLink: yearlyCheckoutSession.checkoutUrl,
      message: 'Please complete payment to upgrade to yearly plan.',
      sessionId: yearlyCheckoutSession.sessionId,
    });
  } catch (error: any) {
    console.error('Error upgrading subscription:', error);
    return NextResponse.json({ error: error.message || 'Failed to upgrade subscription' }, { status: 500 });
  }
}
