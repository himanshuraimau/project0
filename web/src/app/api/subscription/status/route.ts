import { NextResponse, NextRequest } from 'next/server';
import { getUserFromAuth } from '@/lib/auth-helper';
import { SubscriptionService } from '@/lib/subscription-service';
import { FeatureGateService } from '@/lib/feature-gate-service';
import { PaddleSubscriptionService } from '@/lib/payments/paddle';
import { PRO_PLAN_LIMITS } from '@/lib/config/subscription-limits';
import { prisma } from '@/lib/prisma';
import { resolveInternalPlanIdFromPaddlePriceId } from '@/lib/billing';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const featureAccess = await FeatureGateService.getFeatureAccessSummary();

    // `subscription_id` and `transaction_id` are Paddle-specific query params.
    let paddleSubId = request.nextUrl.searchParams.get('subscription_id');
    const transactionId = request.nextUrl.searchParams.get('transaction_id');
    let subscription: Awaited<ReturnType<typeof SubscriptionService.getSubscriptionWithSync>> = null;

    const existingForUser = await SubscriptionService.getUserSubscription(userId);

    // If we have a transaction_id but no subscription_id, look up the subscription from the transaction
    // Only do this if the user's subscription is missing or Paddle-based.
    if (!paddleSubId && transactionId && (!existingForUser || existingForUser.provider === 'PADDLE')) {
      try {
        paddleSubId = await PaddleSubscriptionService.getSubscriptionIdFromTransaction(transactionId);
      } catch (err) {
        console.error('Error looking up subscription from transaction:', err);
      }
    }

    if (paddleSubId) {
      try {
        const paddleSub = await PaddleSubscriptionService.getSubscription(paddleSubId);

        if (paddleSub && (paddleSub.status === 'active' || paddleSub.status === 'trialing')) {
          const priceId = paddleSub.items?.[0]?.price?.id || '';
          const billingDates = PaddleSubscriptionService.extractBillingDates(paddleSub);
          const now = new Date();
          const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

           const existing = await SubscriptionService.getUserSubscription(userId);

           if (existing && existing.provider === 'REVENUECAT') {
             // Don't overwrite an App Store subscription based on Paddle query params.
             subscription = existing;
             paddleSubId = null;
           } else {
             if (existing && existing.paddleSubscriptionId !== paddleSubId) {
               await SubscriptionService.deleteSubscription(userId);
             }

             if (!existing || existing.paddleSubscriptionId !== paddleSubId) {
               await SubscriptionService.createSubscription({
                 userId,
                 provider: 'PADDLE',
                 paddleSubscriptionId: paddleSubId,
                 priceId,
                 internalPlanId: resolveInternalPlanIdFromPaddlePriceId(priceId) ?? undefined,
                 status: 'ACTIVE',
                 notesPerMonth: PRO_PLAN_LIMITS.notesPerMonth,
                 coursesPerMonth: PRO_PLAN_LIMITS.coursesPerMonth,
                 pdfProcessingPerMonth: PRO_PLAN_LIMITS.pdfProcessingPerMonth,
                 videoProcessingPerMonth: PRO_PLAN_LIMITS.videoProcessingPerMonth,
                 audioProcessingPerMonth: PRO_PLAN_LIMITS.audioProcessingPerMonth,
               });
             }

             // Save Paddle customer ID to user if available
             const paddleCustomerId = (paddleSub as any)?.customerId;
             if (paddleCustomerId) {
               await prisma.user.update({
                 where: { id: userId },
                 data: { paddleCustomerId },
               }).catch(() => {});
             }

             await SubscriptionService.activateSubscription(paddleSubId, {
               currentPeriodStart: billingDates.currentPeriodStart ?? now,
               currentPeriodEnd: billingDates.currentPeriodEnd ?? thirtyDays,
               nextBillingDate: billingDates.nextBillingDate ?? thirtyDays,
             });

             subscription = await SubscriptionService.getSubscriptionByPaddleId(paddleSubId);
           }
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

    // Last resort: if no subscription found in DB, search Paddle directly
    // Only do this if the user's subscription is missing or Paddle-based.
    if (!subscription && (!existingForUser || existingForUser.provider === 'PADDLE')) {
      try {
        const paddleSub = await PaddleSubscriptionService.findActiveSubscriptionForUser(userId);
        if (paddleSub) {
          const subId = paddleSub.id;
          const priceId = paddleSub.items?.[0]?.price?.id || '';
          const billingDates = PaddleSubscriptionService.extractBillingDates(paddleSub);
          const now = new Date();
          const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          const existing = await SubscriptionService.getUserSubscription(userId);
          if (existing && existing.provider === 'REVENUECAT') {
            // Don't overwrite an App Store subscription.
            subscription = existing;
          } else {
            if (existing && existing.paddleSubscriptionId !== subId) {
              await SubscriptionService.deleteSubscription(userId);
            }

            if (!existing || existing.paddleSubscriptionId !== subId) {
            await SubscriptionService.createSubscription({
              userId,
              provider: 'PADDLE',
              paddleSubscriptionId: subId,
              priceId,
              internalPlanId: resolveInternalPlanIdFromPaddlePriceId(priceId) ?? undefined,
              status: 'ACTIVE',
              notesPerMonth: PRO_PLAN_LIMITS.notesPerMonth,
              coursesPerMonth: PRO_PLAN_LIMITS.coursesPerMonth,
              pdfProcessingPerMonth: PRO_PLAN_LIMITS.pdfProcessingPerMonth,
              videoProcessingPerMonth: PRO_PLAN_LIMITS.videoProcessingPerMonth,
              audioProcessingPerMonth: PRO_PLAN_LIMITS.audioProcessingPerMonth,
            });
            }

            const paddleCustomerId = (paddleSub as any)?.customerId;
            if (paddleCustomerId) {
              await prisma.user.update({
                where: { id: userId },
                data: { paddleCustomerId },
              }).catch(() => {});
            }

            await SubscriptionService.activateSubscription(subId, {
              currentPeriodStart: billingDates.currentPeriodStart ?? now,
              currentPeriodEnd: billingDates.currentPeriodEnd ?? thirtyDays,
              nextBillingDate: billingDates.nextBillingDate ?? thirtyDays,
            });

            subscription = await SubscriptionService.getSubscriptionByPaddleId(subId);
          }
        }
      } catch (err) {
        console.error('Error in Paddle fallback lookup:', err);
      }
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
        priceId: subscription.priceId,
        provider: subscription.provider,
        internalPlanId: subscription.internalPlanId,
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
