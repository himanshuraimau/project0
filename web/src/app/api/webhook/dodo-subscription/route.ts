// Webhook endpoint to handle Dodo Payments subscription events
// Uses Standard Webhooks specification

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { DodoWebhookService, DodoSubscriptionService } from '@/lib/payments/dodo';
import { SubscriptionService } from '@/lib/subscription-service';
import { prisma } from '@/lib/prisma';
import { PRO_PLAN_LIMITS } from '@/lib/config/subscription-limits';

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
    const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY || process.env.DODO_WEBHOOK_KEY;

    if (!webhookKey) {
      console.error('DODO_PAYMENTS_WEBHOOK_KEY not configured');
      return NextResponse.json(
        { error: 'Webhook configuration error' },
        { status: 500 }
      );
    }

    if (!webhookId || !webhookSignature || !webhookTimestamp) {
      console.error('Missing required webhook headers');
      return NextResponse.json(
        { error: 'Missing webhook headers' },
        { status: 400 }
      );
    }

    const body = await request.text();

    // Verify timestamp (prevent replay attacks)
    if (!DodoWebhookService.verifyWebhookTimestamp(webhookTimestamp)) {
      console.error('Webhook timestamp verification failed');
      return NextResponse.json(
        { error: 'Invalid timestamp' },
        { status: 401 }
      );
    }

    // Verify signature (Standard Webhooks format)
    if (!DodoWebhookService.verifyWebhookSignature(body, {
      'webhook-id': webhookId,
      'webhook-signature': webhookSignature,
      'webhook-timestamp': webhookTimestamp,
    }, webhookKey)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const payload = JSON.parse(body);
    const eventType = payload.type;

    console.log('Received Dodo webhook:', eventType, payload);

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
  const customerId = payload.data.customer?.customer_id || payload.data.metadata?.userId;

  if (!customerId) {
    console.error('No customer ID in subscription.created webhook');
    return;
  }

  // Check if subscription already exists
  const existing = await SubscriptionService.getUserSubscription(customerId);
  if (existing) {
    console.log('Subscription already exists for user:', customerId);
    return;
  }

  // Create subscription record
  await SubscriptionService.createSubscription({
    userId: customerId,
    dodoSubscriptionId: subscriptionId,
    productId: process.env.DODO_PRODUCT_ID!,
    status: 'PENDING',
  });

  console.log('Subscription created:', subscriptionId);
}

async function handleSubscriptionActivated(payload: any) {
  const subscriptionId = payload.data.subscription_id;
  const subscription = await SubscriptionService.getSubscriptionByDodoId(subscriptionId);

  if (!subscription) {
    console.log('Subscription not found for activated event:', subscriptionId);
    return;
  }

  const now = new Date();
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await SubscriptionService.activateSubscription(subscription.dodoSubscriptionId, {
    currentPeriodStart: payload.data.current_period_start
      ? new Date(payload.data.current_period_start)
      : now,
    currentPeriodEnd: payload.data.current_period_end
      ? new Date(payload.data.current_period_end)
      : thirtyDaysFromNow,
    nextBillingDate: payload.data.next_billing_date
      ? new Date(payload.data.next_billing_date)
      : thirtyDaysFromNow,
  });

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
          console.log('Subscription updated: PENDING -> ACTIVE:', subscriptionId);
        } else {
          // Just update status
          await SubscriptionService.updateSubscriptionStatus(subscription.dodoSubscriptionId, status as any);
        }
      },
      'CANCELLED': async () => {
        // If subscription was pending and is now cancelled, delete it to allow new subscriptions
        if (subscription.status === 'PENDING') {
          console.log('Pending subscription cancelled via webhook, deleting:', subscriptionId);
          await SubscriptionService.deleteSubscription(subscription.userId);
        } else {
          // Update to cancelled status
          await SubscriptionService.cancelSubscription(
            subscription.dodoSubscriptionId,
            payload.data.cancel_at_next_billing_date || false
          );
        }
      },
      'FAILED': async () => {
        // If subscription was pending and failed, delete it to allow new subscriptions
        if (subscription.status === 'PENDING') {
          console.log('Pending subscription failed via webhook, deleting:', subscriptionId);
          await SubscriptionService.deleteSubscription(subscription.userId);
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

  // If subscription was pending and failed, delete it to allow new subscriptions
  if (subscription.status === 'PENDING') {
    console.log('Pending subscription failed, deleting to allow retry:', subscriptionId);
    await SubscriptionService.deleteSubscription(subscription.userId);
  } else {
    await SubscriptionService.failSubscription(subscription.dodoSubscriptionId);
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

  // If subscription was pending and is now cancelled, delete it to allow new subscriptions
  if (subscription.status === 'PENDING') {
    console.log('Pending subscription cancelled via webhook, deleting:', subscriptionId);
    await SubscriptionService.deleteSubscription(subscription.userId);
  } else {
    await SubscriptionService.cancelSubscription(subscription.dodoSubscriptionId, cancelAtPeriodEnd);
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
