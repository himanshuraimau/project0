// API endpoint to get user's subscription status

import { NextResponse, NextRequest } from 'next/server';
import { getUserFromAuth } from '@/lib/auth-helper';
import { SubscriptionService } from '@/lib/subscription-service';
import { FeatureGateService } from '@/lib/feature-gate-service';
import { DodoSubscriptionService } from '@/lib/payments/dodo';
import { prisma } from '@/lib/prisma';
import { PRO_PLAN_LIMITS } from '@/lib/config/subscription-limits';

// Prevent caching of this endpoint
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);

    console.log('=== SUBSCRIPTION STATUS API ===');
    console.log('userId:', userId);
    console.log('URL params:', Object.fromEntries(request.nextUrl.searchParams.entries()));

    if (!userId) {
      console.log('❌ Unauthorized - no userId');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get feature access summary (needed for free tier too)
    const featureAccess = await FeatureGateService.getFeatureAccessSummary();

    // --- Fast-path for post-checkout redirect ---
    // Dodo appends ?subscription_id=sub_xxx&status=active to the return_url.
    // IMPORTANT: Always check URL params first, because the user may have just completed
    // a new subscription payment, and we need to sync that one - not any stale DB record.
    const dodoSubIdFromUrl = request.nextUrl.searchParams.get('subscription_id');
    let subscription: Awaited<ReturnType<typeof SubscriptionService.getSubscriptionWithSync>> = null;
    
    console.log('dodoSubIdFromUrl:', dodoSubIdFromUrl);
    
    if (dodoSubIdFromUrl) {
      // URL has subscription_id - this takes priority (user just came from checkout)
      console.log('🔄 Fast-path: subscription_id found in URL, fetching from Dodo...');
      try {
        const dodoSub = await DodoSubscriptionService.getSubscription(dodoSubIdFromUrl);
        console.log('Dodo subscription response:', dodoSub ? {
          subscription_id: dodoSub.subscription_id,
          status: dodoSub.status,
          product_id: dodoSub.product_id,
          customer: dodoSub.customer,
          metadata: dodoSub.metadata,
        } : 'null/undefined');
        
        if (dodoSub && (dodoSub.status === 'active' || dodoSub.status === 'pending')) {
          const productId: string =
            dodoSub.product_id ||
            process.env.NEXT_PUBLIC_DODO_PAYMENT_SUBSCRIPTION_ID!;
          const periodInfo = DodoSubscriptionService.getSubscriptionPeriodInfo(dodoSub);
          const now = new Date();
          const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          console.log('productId:', productId);
          console.log('periodInfo:', periodInfo);

          // Check if we have an existing DB record
          const existing = await SubscriptionService.getUserSubscription(userId);
          console.log('Existing DB subscription:', existing ? {
            id: existing.id,
            dodoSubscriptionId: existing.dodoSubscriptionId,
            status: existing.status,
            productId: existing.productId,
          } : 'none');
          
          // If existing record points to a DIFFERENT Dodo subscription, delete it first
          if (existing && existing.dodoSubscriptionId !== dodoSubIdFromUrl) {
            console.log('⚠️ Deleting stale subscription:', existing.dodoSubscriptionId, '→', dodoSubIdFromUrl);
            await SubscriptionService.deleteSubscription(userId);
          }

          // Create new record if needed (no existing, or we just deleted the old one)
          if (!existing || existing.dodoSubscriptionId !== dodoSubIdFromUrl) {
            console.log('➕ Creating new subscription record...');
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
            console.log('✅ Subscription record created');
          } else {
            console.log('ℹ️ Subscription record already exists with correct dodoSubscriptionId');
          }

          // Activate if Dodo says it's active
          if (dodoSub.status === 'active') {
            console.log('🚀 Activating subscription...');
            await SubscriptionService.activateSubscription(dodoSubIdFromUrl, {
              currentPeriodStart: periodInfo.currentPeriodStart ?? now,
              currentPeriodEnd: periodInfo.currentPeriodEnd ?? thirtyDays,
              nextBillingDate: periodInfo.nextBillingDate ?? thirtyDays,
            });
            console.log('✅ Subscription activated');
          } else {
            console.log('ℹ️ Dodo status is', dodoSub.status, '- not activating yet');
          }

          subscription = await SubscriptionService.getSubscriptionByDodoId(dodoSubIdFromUrl);
          console.log('📦 Final subscription from DB:', subscription ? {
            id: subscription.id,
            status: subscription.status,
            dodoSubscriptionId: subscription.dodoSubscriptionId,
          } : 'null');
        } else {
          console.log('⚠️ Dodo subscription not found or inactive:', dodoSubIdFromUrl, dodoSub?.status);
          // Fall back to normal sync
          subscription = await SubscriptionService.getSubscriptionWithSync(userId);
          console.log('Fallback subscription:', subscription ? { status: subscription.status } : 'null');
        }
      } catch (err) {
        console.error('❌ Error in fast-path sync:', err);
        // Fall back to normal sync on error
        subscription = await SubscriptionService.getSubscriptionWithSync(userId);
        console.log('Fallback subscription after error:', subscription ? { status: subscription.status } : 'null');
      }
    } else {
      // No URL param - normal flow, sync existing subscription
      console.log('📋 Normal flow: no subscription_id in URL, syncing existing...');
      subscription = await SubscriptionService.getSubscriptionWithSync(userId);
      console.log('Synced subscription:', subscription ? {
        id: subscription.id,
        status: subscription.status,
        dodoSubscriptionId: subscription.dodoSubscriptionId,
      } : 'null');
    }

    if (!subscription) {
      console.log('❌ NO SUBSCRIPTION - returning hasSubscription: false');
      console.log('=== END SUBSCRIPTION STATUS API ===\n');
      const response = NextResponse.json({
        hasSubscription: false,
        subscription: null,
        access: {
          hasAccess: false,
          reason: 'NO_SUBSCRIPTION',
        },
        features: featureAccess,
      });
      
      // Prevent caching
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      return response;
    }

    // Get display info
    const displayInfo = SubscriptionService.getSubscriptionDisplayInfo(subscription);
    console.log('✅ HAS SUBSCRIPTION - displayInfo:', displayInfo);
    console.log('=== END SUBSCRIPTION STATUS API ===\n');

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

    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}
