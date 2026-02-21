import { NextResponse, NextRequest } from 'next/server';
import { getUserFromAuth } from '@/lib/auth-helper';
import { SubscriptionService } from '@/lib/subscription-service';
import { FeatureGateService } from '@/lib/feature-gate-service';
import { DodoSubscriptionService } from '@/lib/payments/dodo';
import { PRO_PLAN_LIMITS } from '@/lib/config/subscription-limits';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const featureAccess = await FeatureGateService.getFeatureAccessSummary();

    // Fast-path: Dodo appends ?subscription_id=sub_xxx to return_url after checkout
    const dodoSubIdFromUrl = request.nextUrl.searchParams.get('subscription_id');
    let subscription: Awaited<ReturnType<typeof SubscriptionService.getSubscriptionWithSync>> = null;

    if (dodoSubIdFromUrl) {
      try {
        const dodoSub = await DodoSubscriptionService.getSubscription(dodoSubIdFromUrl);

        if (dodoSub && (dodoSub.status === 'active' || dodoSub.status === 'pending')) {
          const productId: string = dodoSub.product_id || process.env.NEXT_PUBLIC_DODO_PAYMENT_SUBSCRIPTION_ID!;
          const periodInfo = DodoSubscriptionService.getSubscriptionPeriodInfo(dodoSub);
          const now = new Date();
          const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          const existing = await SubscriptionService.getUserSubscription(userId);

          if (existing && existing.dodoSubscriptionId !== dodoSubIdFromUrl) {
            await SubscriptionService.deleteSubscription(userId);
          }

          if (!existing || existing.dodoSubscriptionId !== dodoSubIdFromUrl) {
            await SubscriptionService.createSubscription({
              userId,
              dodoSubscriptionId: dodoSubIdFromUrl,
              productId,
              status: 'PENDING',
              notesPerMonth: PRO_PLAN_LIMITS.notesPerMonth,
              coursesPerMonth: PRO_PLAN_LIMITS.coursesPerMonth,
              pdfProcessingPerMonth: PRO_PLAN_LIMITS.pdfProcessingPerMonth,
              videoProcessingPerMonth: PRO_PLAN_LIMITS.videoProcessingPerMonth,
              audioProcessingPerMonth: PRO_PLAN_LIMITS.audioProcessingPerMonth,
            });
          }

          if (dodoSub.status === 'active') {
            await SubscriptionService.activateSubscription(dodoSubIdFromUrl, {
              currentPeriodStart: periodInfo.currentPeriodStart ?? now,
              currentPeriodEnd: periodInfo.currentPeriodEnd ?? thirtyDays,
              nextBillingDate: periodInfo.nextBillingDate ?? thirtyDays,
            });
          }

          subscription = await SubscriptionService.getSubscriptionByDodoId(dodoSubIdFromUrl);
        } else {
          subscription = await SubscriptionService.getSubscriptionWithSync(userId);
        }
      } catch (err) {
        console.error('Error in fast-path sync:', err);
        subscription = await SubscriptionService.getSubscriptionWithSync(userId);
      }
    } else {
      subscription = await SubscriptionService.getSubscriptionWithSync(userId);
    }

    if (!subscription) {
      const response = NextResponse.json({
        hasSubscription: false,
        subscription: null,
        access: { hasAccess: false, reason: 'NO_SUBSCRIPTION' },
        features: featureAccess,
      });
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      return response;
    }

    const displayInfo = SubscriptionService.getSubscriptionDisplayInfo(subscription);

    const response = NextResponse.json({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        displayStatus: displayInfo.displayStatus,
        productId: subscription.productId,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        nextBillingDate: subscription.nextBillingDate,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        cancelledAt: subscription.cancelledAt,
        trialEnd: subscription.trialEnd,
        createdAt: subscription.createdAt,
        metadata: subscription.metadata || {},
      },
      access: {
        hasAccess: displayInfo.hasAccess,
        isActive: displayInfo.isActive,
        isTrial: displayInfo.isTrial,
        daysRemaining: displayInfo.daysRemaining,
      },
      features: featureAccess,
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription status' }, { status: 500 });
  }
}
