// Webhook endpoint to handle Dodo Payments subscription events

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { DodoWebhookService } from '@/lib/utils/dodo/webhooks';
import { SubscriptionService } from '@/lib/subscription-service';

export async function POST(request: Request) {
  try {
    // Verify webhook signature
    const headersList = await headers();
    const signature = headersList.get('x-dodo-signature');
    const webhookKey = process.env.DODO_WEBHOOK_KEY;

    if (!webhookKey) {
      console.error('DODO_WEBHOOK_KEY not configured');
      return NextResponse.json(
        { error: 'Webhook configuration error' },
        { status: 500 }
      );
    }

    const body = await request.text();

    // Verify signature
    if (!signature || !DodoWebhookService.verifyWebhookSignature(body, signature, webhookKey)) {
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

      case 'subscription.payment_succeeded':
        await handlePaymentSucceeded(payload);
        break;

      case 'subscription.payment_failed':
        await handlePaymentFailed(payload);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload);
        break;

      case 'subscription.expired':
        await handleSubscriptionExpired(payload);
        break;

      case 'subscription.renewed':
        await handleSubscriptionRenewed(payload);
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
  const now = new Date();
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await SubscriptionService.activateSubscription(subscriptionId, {
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

async function handlePaymentSucceeded(payload: any) {
  const subscriptionId = payload.data.subscription_id;
  const nextBillingDate = payload.data.next_billing_date 
    ? new Date(payload.data.next_billing_date) 
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now as fallback

  // Renew subscription
  await SubscriptionService.renewSubscription(subscriptionId, nextBillingDate);

  console.log('Payment succeeded for subscription:', subscriptionId);
}

async function handlePaymentFailed(payload: any) {
  const subscriptionId = payload.data.subscription_id;

  await SubscriptionService.failSubscription(subscriptionId);

  console.log('Payment failed for subscription:', subscriptionId);
}

async function handleSubscriptionCancelled(payload: any) {
  const subscriptionId = payload.data.subscription_id;
  const cancelAtPeriodEnd = payload.data.cancel_at_next_billing_date || false;

  await SubscriptionService.cancelSubscription(subscriptionId, cancelAtPeriodEnd);

  console.log('Subscription cancelled:', subscriptionId);
}

async function handleSubscriptionExpired(payload: any) {
  const subscriptionId = payload.data.subscription_id;

  await SubscriptionService.updateSubscriptionStatus(subscriptionId, 'EXPIRED');

  console.log('Subscription expired:', subscriptionId);
}

async function handleSubscriptionRenewed(payload: any) {
  const subscriptionId = payload.data.subscription_id;
  const nextBillingDate = payload.data.next_billing_date 
    ? new Date(payload.data.next_billing_date) 
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now as fallback

  await SubscriptionService.renewSubscription(subscriptionId, nextBillingDate);

  console.log('Subscription renewed:', subscriptionId);
}

async function handleSubscriptionOnHold(payload: any) {
  const subscriptionId = payload.data.subscription_id;

  await SubscriptionService.holdSubscription(subscriptionId);

  console.log('Subscription put on hold:', subscriptionId);
}
