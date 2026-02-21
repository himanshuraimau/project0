// Webhook endpoint to handle Dodo Payments subscription events
// Uses Standard Webhooks specification

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'standardwebhooks';
import { DodoSubscriptionService } from '@/lib/payments/dodo';
import { SubscriptionService } from '@/lib/subscription-service';
import { prisma } from '@/lib/prisma';
import { PRO_PLAN_LIMITS } from '@/lib/config/subscription-limits';
import { updateLoopsContact } from '@/lib/loops';

/**
 * Reset usage counters for a user (called on subscription renewal)
 */
async function resetUsageCounters(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        usedNotesThisMonth: 0,
        usedCoursesThisMonth: 0,
        usedPdfProcessingThisMonth: 0,
        usedVideoProcessingThisMonth: 0,
        usedAudioProcessingThisMonth: 0,
        lastUsageResetDate: new Date()
      }
    });
    
    console.log(`🔄 Reset usage counters for user ${userId}`);
  } catch (error) {
    console.error('Error resetting usage counters:', error);
    // Don't throw - this shouldn't fail the webhook
  }
}

export async function POST(request: Request) {
  try {
    // Get webhook headers (Standard Webhooks format)
    const headersList = await headers();
    const webhookId = headersList.get('webhook-id');
    const webhookSignature = headersList.get('webhook-signature');
    const webhookTimestamp = headersList.get('webhook-timestamp');

    const webhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
    if (!webhookSecret) {
      console.error('DODO_PAYMENTS_WEBHOOK_KEY not configured');
      return NextResponse.json(
        { error: 'Webhook configuration error' },
        { status: 500 }
      );
    }

    if (!webhookId || !webhookSignature || !webhookTimestamp) {
      console.error('Missing required webhook headers:', { webhookId: !!webhookId, webhookSignature: !!webhookSignature, webhookTimestamp: !!webhookTimestamp });
      return NextResponse.json(
        { error: 'Missing webhook headers' },
        { status: 400 }
      );
    }

    const body = await request.text();

    // Use standardwebhooks library to verify (recommended by Dodo)
    const wh = new Webhook(webhookSecret);
    let payload: any;
    
    try {
      payload = wh.verify(body, {
        'webhook-id': webhookId,
        'webhook-signature': webhookSignature,
        'webhook-timestamp': webhookTimestamp,
      });
    } catch (verifyError) {
      console.error('Webhook signature verification failed:', verifyError);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const eventType = payload.type;

    console.log('✅ Received Dodo webhook:', eventType);
    console.log('Webhook payload:', JSON.stringify(payload, null, 2));

    // Handle different event types
    switch (eventType) {
      case 'subscription.created':
        await handleSubscriptionCreated(payload);
        break;

      case 'subscription.activated':
      case 'subscription.active':
        await handleSubscriptionActivated(payload);
        break;

      case 'subscription.updated':
        await handleSubscriptionUpdated(payload);
        break;

      case 'subscription.payment_succeeded':
        await handlePaymentSucceeded(payload);
        break;

      case 'subscription.payment_failed':
        await handlePaymentFailed(payload);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload);
        break;

      case 'subscription.failed':
        await handleSubscriptionFailed(payload);
        break;

      case 'subscription.expired':
        await handleSubscriptionExpired(payload);
        break;

      case 'subscription.renewed':
        await handleSubscriptionRenewed(payload);
        break;

      case 'subscription.plan_changed':
        await handleSubscriptionPlanChanged(payload);
        break;

      case 'subscription.on_hold':
        await handleSubscriptionOnHold(payload);
        break;

      default:
        console.log('Unhandled webhook event:', eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handler functions for each event type

async function handleSubscriptionCreated(payload: any) {
  const subscriptionId = payload.data.subscription_id;
  const metadata: Record<string, string> = payload.data.metadata || {};

  // 1. Prefer userId stored in session/subscription metadata (set by us at checkout creation)
  // 2. Fall back to looking up the user by their customer email (always present in Dodo webhooks)
  // 3. Last resort: Dodo's own customer_id (almost certainly won't match our userId — kept for logging)
  let customerId: string | undefined = metadata.userId;

  if (!customerId) {
    const customerEmail = payload.data.customer?.email;
    if (customerEmail) {
      try {
        const user = await prisma.user.findUnique({ where: { email: customerEmail } });
        if (user) {
          customerId = user.id;
          console.log('Resolved userId from customer email:', customerEmail, '->', customerId);
        }
      } catch (err) {
        console.error('Error looking up user by email in subscription.created webhook:', err);
      }
    }
  }

  if (!customerId) {
    console.error('Cannot resolve userId in subscription.created webhook. metadata:', metadata, 'customer:', payload.data.customer);
    return;
  }

  // Determine the product ID from Dodo's data first, then fallback to metadata, then env
  const productId: string =
    payload.data.product_id ||
    metadata.productId ||
    process.env.NEXT_PUBLIC_DODO_PAYMENT_SUBSCRIPTION_ID!;

  // --- Yearly upgrade path ---
  if (metadata.isYearlyUpgrade === 'true') {
    const replacedMonthlyDodoId = metadata.replacedMonthlyDodoSubscriptionId;
    const monthlyPeriodEnd = metadata.monthlyPeriodEnd
      ? new Date(metadata.monthlyPeriodEnd)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    console.log('Processing yearly upgrade in subscription.created:', { customerId, subscriptionId });

    // replaceWithPendingYearlyUpgrade updates the existing monthly DB row to point at the
    // new yearly Dodo subscription (PENDING) and stores the old monthly ID for later cancellation.
    await SubscriptionService.replaceWithPendingYearlyUpgrade(
      customerId,
      subscriptionId,
      productId,
      monthlyPeriodEnd,
      replacedMonthlyDodoId
    );

    console.log('DB updated to pending yearly upgrade:', subscriptionId);
    return;
  }

  // --- New subscription path ---
  // Check if subscription already exists (guard against duplicate webhooks)
  const existing = await SubscriptionService.getUserSubscription(customerId);
  if (existing) {
    // Same subscription ID — idempotent, nothing to do
    if (existing.dodoSubscriptionId === subscriptionId) {
      console.log('subscription.created already processed (idempotent):', subscriptionId);
      return;
    }
    
    // Different subscription ID — this is a NEW subscription for this user.
    // The old one might be stale (cancelled, failed, expired) or the user is replacing it.
    // Delete the old record so we can create the new one (unique constraint on userId).
    const oldStatus = existing.status;
    console.log('Deleting old subscription to create new one:', {
      userId: customerId,
      oldDodoId: existing.dodoSubscriptionId,
      oldStatus,
      newDodoId: subscriptionId,
    });
    
    try {
      await SubscriptionService.deleteSubscription(customerId);
    } catch (deleteErr) {
      console.error('Error deleting old subscription in subscription.created webhook:', deleteErr);
      // If delete fails, the create below will also fail due to unique constraint
      // Let it fail and log the error
    }
  }

  // Create fresh subscription record
  await SubscriptionService.createSubscription({
    userId: customerId,
    dodoSubscriptionId: subscriptionId,
    productId,
    status: 'PENDING',
  });

  console.log('Subscription created:', subscriptionId);
}

/**
 * When a yearly subscription (from monthly→yearly upgrade) becomes active, cancel the old
 * monthly subscription in Dodo immediately so Dodo does not show a leftover monthly renewal.
 */
async function cancelReplacedMonthlySubscriptionIfAny(subscription: {
  dodoSubscriptionId: string;
  metadata: unknown;
}): Promise<void> {
  const metadata = (subscription.metadata as Record<string, unknown>) || {};
  const replacedMonthlyDodoId = metadata.replacedMonthlyDodoSubscriptionId as string | undefined;
  if (!replacedMonthlyDodoId) return;
  try {
    const cancelResult = await DodoSubscriptionService.cancelSubscriptionImmediately(replacedMonthlyDodoId);
    if (cancelResult.success) {
      console.log('Cancelled old monthly subscription in Dodo after yearly upgrade:', replacedMonthlyDodoId);
    } else {
      console.warn('Could not cancel old monthly subscription in Dodo:', cancelResult.error);
    }
  } catch (err) {
    console.error('Error cancelling old monthly subscription in Dodo:', err);
  }
  const { replacedMonthlyDodoSubscriptionId: _, ...restMeta } = metadata;
  await SubscriptionService.updateSubscriptionMetadata(subscription.dodoSubscriptionId, restMeta);
}

/**
 * When a PENDING yearly upgrade is cancelled or fails (user abandoned checkout),
 * restore the DB subscription record to point back at the old monthly subscription
 * instead of deleting the record. The monthly subscription in Dodo was never cancelled
 * (we no longer cancel it eagerly), so the user keeps uninterrupted access.
 *
 * Returns true if restoration was performed, false if we should fall back to delete.
 */
async function restoreToOldMonthlySubscriptionIfAny(subscription: {
  userId: string;
  dodoSubscriptionId: string;
  metadata: unknown;
}): Promise<boolean> {
  const metadata = (subscription.metadata as Record<string, unknown>) || {};
  const replacedMonthlyDodoId = metadata.replacedMonthlyDodoSubscriptionId as string | undefined;

  // Not an upgrade flow — fall back to default (delete) behaviour
  if (!replacedMonthlyDodoId) return false;

  try {
    // Fetch the old monthly from Dodo so we can restore accurate billing info
    const oldMonthly = await DodoSubscriptionService.getSubscription(replacedMonthlyDodoId);
    if (!oldMonthly) {
      console.warn('Could not fetch old monthly subscription from Dodo for restore:', replacedMonthlyDodoId);
      return false;
    }

    const periodInfo = DodoSubscriptionService.getSubscriptionPeriodInfo(oldMonthly);

    // Restore the DB record to point at the old monthly subscription
    await prisma.subscription.update({
      where: { userId: subscription.userId },
      data: {
        dodoSubscriptionId: replacedMonthlyDodoId,
        productId: oldMonthly.product_id || undefined,
        status: oldMonthly.status?.toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'ACTIVE',
        cancelAtPeriodEnd: periodInfo.cancelAtPeriodEnd ?? false,
        cancelledAt: null,
        currentPeriodStart: periodInfo.currentPeriodStart ?? undefined,
        currentPeriodEnd: periodInfo.currentPeriodEnd ?? undefined,
        nextBillingDate: periodInfo.nextBillingDate ?? undefined,
        metadata: {},
        updatedAt: new Date(),
      },
    });

    console.log(
      'Restored DB subscription back to old monthly after abandoned yearly upgrade:',
      { userId: subscription.userId, restoredDodoId: replacedMonthlyDodoId }
    );
    return true;
  } catch (err) {
    console.error('Error restoring monthly subscription after abandoned upgrade:', err);
    return false;
  }
}

async function handleSubscriptionActivated(payload: any) {
  const subscriptionId = payload.data.subscription_id;
  const metadata: Record<string, string> = payload.data.metadata || {};

  const now = new Date();
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const periodStart = payload.data.current_period_start
    ? new Date(payload.data.current_period_start)
    : now;
  const periodEnd = payload.data.current_period_end
    ? new Date(payload.data.current_period_end)
    : thirtyDaysFromNow;
  const nextBilling = payload.data.next_billing_date
    ? new Date(payload.data.next_billing_date)
    : thirtyDaysFromNow;
  const productId: string =
    payload.data.product_id ||
    metadata.productId ||
    process.env.NEXT_PUBLIC_DODO_PAYMENT_SUBSCRIPTION_ID!;

  let subscription = await SubscriptionService.getSubscriptionByDodoId(subscriptionId);

  if (!subscription) {
    // Checkout-session flow: no DB record was pre-created.
    // Resolve user by metadata.userId first, then fall back to customer email.
    let userId: string | undefined = metadata.userId;

    if (!userId) {
      const customerEmail = payload.data.customer?.email;
      if (customerEmail) {
        try {
          const user = await prisma.user.findUnique({ where: { email: customerEmail } });
          if (user) {
            userId = user.id;
            console.log('handleSubscriptionActivated: resolved userId from email', customerEmail, '->', userId);
          }
        } catch (err) {
          console.error('Error looking up user by email in subscription.active:', err);
        }
      }
    }

    if (!userId) {
      console.error('handleSubscriptionActivated: cannot resolve userId — cannot create subscription record', {
        subscriptionId,
        metadata,
        customer: payload.data.customer,
      });
      return;
    }

    // Check if this is a yearly upgrade (indicated by metadata from the checkout session)
    const isYearlyUpgrade = metadata.isYearlyUpgrade === 'true';

    if (isYearlyUpgrade) {
      // replaceWithPendingYearlyUpgrade then immediately activate below
      const replacedMonthlyDodoId = metadata.replacedMonthlyDodoSubscriptionId;
      const monthlyPeriodEnd = metadata.monthlyPeriodEnd
        ? new Date(metadata.monthlyPeriodEnd)
        : thirtyDaysFromNow;
      await SubscriptionService.replaceWithPendingYearlyUpgrade(
        userId,
        subscriptionId,
        productId,
        monthlyPeriodEnd,
        replacedMonthlyDodoId
      );
    } else {
      // Fresh subscription — delete any stale row for this user first (unique constraint)
      try {
        const existing = await SubscriptionService.getUserSubscription(userId);
        if (existing && existing.dodoSubscriptionId !== subscriptionId) {
          console.log('handleSubscriptionActivated: deleting stale subscription', {
            userId,
            oldDodoId: existing.dodoSubscriptionId,
            oldStatus: existing.status,
            newDodoId: subscriptionId,
          });
          await SubscriptionService.deleteSubscription(userId);
        }
      } catch (deleteErr) {
        console.error('handleSubscriptionActivated: error deleting stale subscription', deleteErr);
      }

      await SubscriptionService.createSubscription({
        userId,
        dodoSubscriptionId: subscriptionId,
        productId,
        status: 'PENDING',
        notesPerMonth: PRO_PLAN_LIMITS.notesPerMonth,
        coursesPerMonth: PRO_PLAN_LIMITS.coursesPerMonth,
        pdfProcessingPerMonth: PRO_PLAN_LIMITS.pdfProcessingPerMonth,
        videoProcessingPerMonth: PRO_PLAN_LIMITS.videoProcessingPerMonth,
        audioProcessingPerMonth: PRO_PLAN_LIMITS.audioProcessingPerMonth,
      });
    }

    // Re-fetch so the activate call below has the full record
    subscription = await SubscriptionService.getSubscriptionByDodoId(subscriptionId);
    if (!subscription) {
      console.error('handleSubscriptionActivated: record still not found after upsert', subscriptionId);
      return;
    }
  }

  await SubscriptionService.activateSubscription(subscription.dodoSubscriptionId, {
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    nextBillingDate: nextBilling,
  });

  await cancelReplacedMonthlySubscriptionIfAny(subscription);

  // Update feature limits to PRO on activation (in case they weren't set at create time)
  try {
    await prisma.subscription.update({
      where: { dodoSubscriptionId: subscriptionId },
      data: {
        notesPerMonth: PRO_PLAN_LIMITS.notesPerMonth,
        coursesPerMonth: PRO_PLAN_LIMITS.coursesPerMonth,
        pdfProcessingPerMonth: PRO_PLAN_LIMITS.pdfProcessingPerMonth,
        videoProcessingPerMonth: PRO_PLAN_LIMITS.videoProcessingPerMonth,
        audioProcessingPerMonth: PRO_PLAN_LIMITS.audioProcessingPerMonth,
      },
    });
  } catch (err) {
    console.error('Error updating feature limits on activation:', err);
  }

  const userEmail = subscription.user?.email || payload.data.customer?.email;
  if (userEmail) {
    const r = await updateLoopsContact({ email: userEmail, plan: 'pro' });
    if (!r.success) console.warn('Loops plan sync (pro):', r.message);
  }
  console.log('Subscription activated:', subscriptionId);
}

async function handleSubscriptionUpdated(payload: any) {
  const subscriptionId = payload.data.subscription_id;
  const status = payload.data.status?.toUpperCase();
  const subscription = await SubscriptionService.getSubscriptionByDodoId(subscriptionId);

  if (!subscription) {
    console.log('Subscription not found in database for update:', subscriptionId);
    return;
  }

  // Handle status changes
  if (status) {
    const statusMap: Record<string, any> = {
      'ACTIVE': async () => {
        // If subscription was pending and is now active, activate it
        if (subscription.status === 'PENDING') {
          await SubscriptionService.activateSubscription(subscription.dodoSubscriptionId, {
            currentPeriodStart: payload.data.current_period_start
              ? new Date(payload.data.current_period_start)
              : new Date(),
            currentPeriodEnd: payload.data.current_period_end
              ? new Date(payload.data.current_period_end)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            nextBillingDate: payload.data.next_billing_date
              ? new Date(payload.data.next_billing_date)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          });
          await cancelReplacedMonthlySubscriptionIfAny(subscription);
          console.log('Subscription updated: PENDING -> ACTIVE:', subscriptionId);
        } else {
          // Just update status
          await SubscriptionService.updateSubscriptionStatus(subscription.dodoSubscriptionId, status as any);
        }
      },
      'CANCELLED': async () => {
        // If subscription was pending and is now cancelled (e.g. user abandoned yearly checkout)
        if (subscription.status === 'PENDING') {
          // Try to restore old monthly (upgrade flow abandonment)
          const restored = await restoreToOldMonthlySubscriptionIfAny(subscription);
          if (!restored) {
            console.log('Pending subscription cancelled via webhook, deleting:', subscriptionId);
            await SubscriptionService.deleteSubscription(subscription.userId);
          }
        } else {
          // Update to cancelled status
          await SubscriptionService.cancelSubscription(
            subscription.dodoSubscriptionId,
            payload.data.cancel_at_next_billing_date || false
          );
        }
      },
      'FAILED': async () => {
        // If subscription was pending and failed (e.g. payment failed at yearly checkout)
        if (subscription.status === 'PENDING') {
          // Try to restore old monthly (upgrade flow failure)
          const restored = await restoreToOldMonthlySubscriptionIfAny(subscription);
          if (!restored) {
            console.log('Pending subscription failed via webhook, deleting:', subscriptionId);
            await SubscriptionService.deleteSubscription(subscription.userId);
          }
        } else {
          await SubscriptionService.failSubscription(subscription.dodoSubscriptionId);
        }
      },
      'EXPIRED': async () => {
        await SubscriptionService.updateSubscriptionStatus(subscription.dodoSubscriptionId, 'EXPIRED');
      },
      'ON_HOLD': async () => {
        await SubscriptionService.holdSubscription(subscription.dodoSubscriptionId);
      },
    };

    if (statusMap[status]) {
      await statusMap[status]();
    } else {
      // Generic status update
      await SubscriptionService.updateSubscriptionStatus(subscription.dodoSubscriptionId, status as any);
    }
    if (status === 'ACTIVE' && subscription.user?.email) {
      const r = await updateLoopsContact({ email: subscription.user.email, plan: 'pro' });
      if (!r.success) console.warn('Loops plan sync (pro):', r.message);
    } else if (['CANCELLED', 'EXPIRED', 'FAILED'].includes(status) && subscription.user?.email) {
      const r = await updateLoopsContact({ email: subscription.user.email, plan: 'free' });
      if (!r.success) console.warn('Loops plan sync (free):', r.message);
    }
  }

  // Apply period/cancel/product updates when Dodo sends them
  // Critical: when user cancels at period end, status stays ACTIVE but cancel_at_next_billing_date=true
  if (!['CANCELLED', 'FAILED'].includes(status || '')) {
    const updates: any = {};
    if (payload.data.next_billing_date) {
      updates.nextBillingDate = new Date(payload.data.next_billing_date);
    }
    if (payload.data.current_period_start) {
      updates.currentPeriodStart = new Date(payload.data.current_period_start);
    }
    if (payload.data.current_period_end) {
      updates.currentPeriodEnd = new Date(payload.data.current_period_end);
    }
    if (payload.data.cancel_at_next_billing_date !== undefined) {
      updates.cancelAtPeriodEnd = payload.data.cancel_at_next_billing_date;
    }
    if (payload.data.product_id && subscription.productId !== payload.data.product_id) {
      await SubscriptionService.updateSubscriptionProductId(subscription.dodoSubscriptionId, payload.data.product_id);
    }
    if (Object.keys(updates).length > 0 && status) {
      await SubscriptionService.updateSubscriptionStatus(subscription.dodoSubscriptionId, status as any, updates);
    }
  }

  console.log('Subscription updated:', subscriptionId, 'Status:', status);
}

async function handleSubscriptionFailed(payload: any) {
  const subscriptionId = payload.data.subscription_id;
  const subscription = await SubscriptionService.getSubscriptionByDodoId(subscriptionId);

  if (!subscription) {
    console.log('Subscription not found for failed event:', subscriptionId);
    return;
  }

  // If subscription was pending and failed (e.g. payment failed at yearly checkout)
  if (subscription.status === 'PENDING') {
    // Try to restore the old monthly subscription (upgrade flow failure)
    const restored = await restoreToOldMonthlySubscriptionIfAny(subscription);
    if (!restored) {
      // No monthly to restore (fresh signup failure) — delete to allow retry
      console.log('Pending subscription failed, deleting to allow retry:', subscriptionId);
      await SubscriptionService.deleteSubscription(subscription.userId);
    }
  } else {
    await SubscriptionService.failSubscription(subscription.dodoSubscriptionId);
  }

  // Only sync to 'free' in Loops if we actually failed (no restore happened)
  if (subscription.status !== 'PENDING' && subscription.user?.email) {
    const r = await updateLoopsContact({ email: subscription.user.email, plan: 'free' });
    if (!r.success) console.warn('Loops plan sync (free):', r.message);
  }
  console.log('Subscription failed:', subscriptionId);
}

async function handlePaymentSucceeded(payload: any) {
  const subscriptionId = payload.data.subscription_id;
  const subscription = await SubscriptionService.getSubscriptionByDodoId(subscriptionId);

  if (!subscription) {
    console.log('Subscription not found for payment succeeded event:', subscriptionId);
    return;
  }

  const nextBillingDate = payload.data.next_billing_date
    ? new Date(payload.data.next_billing_date)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now as fallback

  // Renew subscription
  await SubscriptionService.renewSubscription(subscription.dodoSubscriptionId, nextBillingDate);

  console.log('Payment succeeded for subscription:', subscriptionId);
}

async function handlePaymentFailed(payload: any) {
  const subscriptionId = payload.data.subscription_id;
  const subscription = await SubscriptionService.getSubscriptionByDodoId(subscriptionId);

  if (!subscription) {
    console.log('Subscription not found for payment failed event:', subscriptionId);
    return;
  }

  await SubscriptionService.failSubscription(subscription.dodoSubscriptionId);

  console.log('Payment failed for subscription:', subscriptionId);
}

async function handleSubscriptionCancelled(payload: any) {
  const subscriptionId = payload.data.subscription_id;
  const subscription = await SubscriptionService.getSubscriptionByDodoId(subscriptionId);

  if (!subscription) {
    console.log('Subscription not found for cancelled event:', subscriptionId);
    return;
  }

  const cancelAtPeriodEnd = payload.data.cancel_at_next_billing_date || false;

  // If subscription was pending and is now cancelled (e.g. user abandoned checkout)
  if (subscription.status === 'PENDING') {
    // Try to restore the old monthly subscription (upgrade flow abandonment)
    const restored = await restoreToOldMonthlySubscriptionIfAny(subscription);
    if (!restored) {
      // No monthly to restore (fresh signup cancellation) — delete to allow new subscriptions
      console.log('Pending subscription cancelled via webhook, deleting:', subscriptionId);
      await SubscriptionService.deleteSubscription(subscription.userId);
    }
  } else {
    await SubscriptionService.cancelSubscription(subscription.dodoSubscriptionId, cancelAtPeriodEnd);
  }

  // Only sync to 'free' in Loops if we actually cancelled (no restore happened)
  if (subscription.status !== 'PENDING' && subscription.user?.email) {
    const r = await updateLoopsContact({ email: subscription.user.email, plan: 'free' });
    if (!r.success) console.warn('Loops plan sync (free):', r.message);
  }
  console.log('Subscription cancelled:', subscriptionId);
}

async function handleSubscriptionExpired(payload: any) {
  const subscriptionId = payload.data.subscription_id;
  const subscription = await SubscriptionService.getSubscriptionByDodoId(subscriptionId);

  if (!subscription) {
    console.log('Subscription not found for expired event:', subscriptionId);
    return;
  }

  await SubscriptionService.updateSubscriptionStatus(subscription.dodoSubscriptionId, 'EXPIRED');

  if (subscription.user?.email) {
    const r = await updateLoopsContact({ email: subscription.user.email, plan: 'free' });
    if (!r.success) console.warn('Loops plan sync (free):', r.message);
  }
  console.log('Subscription expired:', subscriptionId);
}

async function handleSubscriptionRenewed(payload: any) {
  const subscriptionId = payload.data.subscription_id;
  const subscription = await SubscriptionService.getSubscriptionByDodoId(subscriptionId);

  if (!subscription) {
    console.log('Subscription not found for renewed event:', subscriptionId);
    return;
  }

  const nextBillingDate = payload.data.next_billing_date
    ? new Date(payload.data.next_billing_date)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now as fallback

  // Check if there's a scheduled plan change
  const metadata = (subscription.metadata as any) || {};
  const scheduledProductId = metadata.scheduledProductId;
  
  if (scheduledProductId && scheduledProductId !== subscription.productId) {
    console.log(`Executing scheduled plan change for ${subscriptionId}: ${subscription.productId} -> ${scheduledProductId}`);
    
    try {
      // Execute the plan change NOW (at renewal time)
      const changeResult = await DodoSubscriptionService.changePlan(
        subscriptionId,
        scheduledProductId
      );

      if (changeResult.success) {
        console.log('Successfully changed plan during renewal');
        
        // Update productId in database
        await SubscriptionService.updateSubscriptionProductId(
          subscriptionId,
          scheduledProductId
        );
      } else {
        console.error('Failed to execute scheduled plan change:', changeResult.error);
        // Don't fail the renewal, just log the error
      }
    } catch (error) {
      console.error('Error executing scheduled plan change:', error);
      // Don't fail the renewal, just log the error
    }
  }

  await SubscriptionService.renewSubscription(subscription.dodoSubscriptionId, nextBillingDate);

  // Reset usage counters on renewal
  await resetUsageCounters(subscription.userId);

  console.log('Subscription renewed:', subscriptionId);
}

/**
 * Handle subscription.plan_changed - e.g. when user upgrades monthly → yearly
 * Updates our DB with new product_id, next_billing_date, current_period_* from Dodo
 */
async function handleSubscriptionPlanChanged(payload: any) {
  const subscriptionId = payload.data.subscription_id;
  const subscription = await SubscriptionService.getSubscriptionByDodoId(subscriptionId);

  if (!subscription) {
    console.log('Subscription not found for plan_changed event:', subscriptionId);
    return;
  }

  const data = payload.data;
  const updates: {
    productId?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    nextBillingDate?: Date;
  } = {};

  if (data.product_id) {
    updates.productId = data.product_id;
  }
  if (data.next_billing_date) {
    const nextBilling = new Date(data.next_billing_date);
    updates.nextBillingDate = nextBilling;
    updates.currentPeriodEnd = nextBilling;
  }
  if (data.current_period_start) {
    updates.currentPeriodStart = new Date(data.current_period_start);
  }
  if (data.current_period_end) {
    updates.currentPeriodEnd = new Date(data.current_period_end);
  }

  // Update product ID if changed
  if (updates.productId && subscription.productId !== updates.productId) {
    await SubscriptionService.updateSubscriptionProductId(subscriptionId, updates.productId);
  }

  // Update billing period dates
  if (updates.nextBillingDate || updates.currentPeriodStart || updates.currentPeriodEnd) {
    await SubscriptionService.updateSubscriptionStatus(
      subscription.dodoSubscriptionId,
      (data.status?.toUpperCase() || subscription.status) as any,
      {
        currentPeriodStart: updates.currentPeriodStart,
        currentPeriodEnd: updates.currentPeriodEnd,
        nextBillingDate: updates.nextBillingDate,
      }
    );
  }

  console.log('Subscription plan changed:', subscriptionId, 'product_id:', data.product_id);
}

async function handleSubscriptionOnHold(payload: any) {
  const subscriptionId = payload.data.subscription_id;
  const subscription = await SubscriptionService.getSubscriptionByDodoId(subscriptionId);

  if (!subscription) {
    console.log('Subscription not found for on_hold event:', subscriptionId);
    return;
  }

  await SubscriptionService.holdSubscription(subscription.dodoSubscriptionId);

  console.log('Subscription put on hold:', subscriptionId);
}
