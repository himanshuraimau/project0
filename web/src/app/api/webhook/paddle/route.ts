import { NextRequest, NextResponse } from 'next/server';
import { getPaddleClient } from '@/lib/payments/paddle';
import { PaddleSubscriptionService } from '@/lib/payments/paddle';
import { SubscriptionService } from '@/lib/subscription-service';
import { prisma } from '@/lib/prisma';
import { PRO_PLAN_LIMITS } from '@/lib/config/subscription-limits';
import { updateLoopsContact } from '@/lib/loops';
import { resolveInternalPlanIdFromPaddlePriceId } from '@/lib/billing';
import type { SubscriptionStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('paddle-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: any;
  try {
    const paddle = getPaddleClient();
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET!;
    event = paddle.webhooks.unmarshal(rawBody, webhookSecret, signature);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  if (!event) {
    return NextResponse.json({ error: 'Could not parse event' }, { status: 400 });
  }

  try {
    const eventType = event.eventType || event.event_type;

    switch (eventType) {
      case 'subscription.created':
        await handleSubscriptionCreated(event.data);
        break;
      case 'subscription.activated':
        await handleSubscriptionActivated(event.data);
        break;
      case 'subscription.updated':
        await handleSubscriptionUpdated(event.data);
        break;
      case 'subscription.canceled':
        await handleSubscriptionCanceled(event.data);
        break;
      case 'subscription.past_due':
        await handleSubscriptionPastDue(event.data);
        break;
      case 'subscription.paused':
        await handleSubscriptionPaused(event.data);
        break;
      case 'subscription.resumed':
        await handleSubscriptionResumed(event.data);
        break;
      case 'transaction.completed':
        await handleTransactionCompleted(event.data);
        break;
      default:
        console.log('Unhandled Paddle webhook event:', eventType);
    }
  } catch (error) {
    console.error('Error processing Paddle webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function resolveUserId(data: any): Promise<string | null> {
  const customData = data.customData || data.custom_data;
  if (customData?.userId) return customData.userId;

  const customerId = data.customerId || data.customer_id;
  if (customerId) {
    const user = await prisma.user.findFirst({
      where: { paddleCustomerId: customerId },
    });
    if (user) return user.id;
  }

  return null;
}

async function handleSubscriptionCreated(data: any) {
  const subscriptionId = data.id;
  const userId = await resolveUserId(data);

  if (!userId) {
    console.error('Cannot resolve userId in subscription.created webhook');
    return;
  }

  const customerId = data.customerId || data.customer_id;
  if (customerId) {
    await prisma.user.update({
      where: { id: userId },
      data: { paddleCustomerId: customerId },
    }).catch(() => {});
  }

  const existing = await SubscriptionService.getUserSubscription(userId);
  if (existing) {
    if (existing.paddleSubscriptionId === subscriptionId) return;
    await SubscriptionService.deleteSubscription(userId).catch(() => {});
  }

  const priceId = data.items?.[0]?.price?.id || '';
  const billingDates = PaddleSubscriptionService.extractBillingDates(data);

  await SubscriptionService.createSubscription({
    userId,
    provider: 'PADDLE',
    paddleSubscriptionId: subscriptionId,
    priceId,
    internalPlanId: resolveInternalPlanIdFromPaddlePriceId(priceId) ?? undefined,
    status: 'PENDING',
    currentPeriodStart: billingDates.currentPeriodStart,
    currentPeriodEnd: billingDates.currentPeriodEnd,
    nextBillingDate: billingDates.nextBillingDate,
    notesPerMonth: PRO_PLAN_LIMITS.notesPerMonth,
    coursesPerMonth: PRO_PLAN_LIMITS.coursesPerMonth,
    pdfProcessingPerMonth: PRO_PLAN_LIMITS.pdfProcessingPerMonth,
    videoProcessingPerMonth: PRO_PLAN_LIMITS.videoProcessingPerMonth,
    audioProcessingPerMonth: PRO_PLAN_LIMITS.audioProcessingPerMonth,
  });
}

async function handleSubscriptionActivated(data: any) {
  const subscriptionId = data.id;
  let subscription = await SubscriptionService.getSubscriptionByPaddleId(subscriptionId);

  if (!subscription) {
    const userId = await resolveUserId(data);
    if (!userId) {
      console.error('Cannot resolve userId in subscription.activated webhook');
      return;
    }

    const priceId = data.items?.[0]?.price?.id || '';

    const existing = await SubscriptionService.getUserSubscription(userId);
    if (existing && existing.paddleSubscriptionId !== subscriptionId) {
      await SubscriptionService.deleteSubscription(userId).catch(() => {});
    }

    await SubscriptionService.createSubscription({
      userId,
      provider: 'PADDLE',
      paddleSubscriptionId: subscriptionId,
      priceId,
      internalPlanId: resolveInternalPlanIdFromPaddlePriceId(priceId) ?? undefined,
      status: 'ACTIVE',
      notesPerMonth: PRO_PLAN_LIMITS.notesPerMonth,
      coursesPerMonth: PRO_PLAN_LIMITS.coursesPerMonth,
      pdfProcessingPerMonth: PRO_PLAN_LIMITS.pdfProcessingPerMonth,
      videoProcessingPerMonth: PRO_PLAN_LIMITS.videoProcessingPerMonth,
      audioProcessingPerMonth: PRO_PLAN_LIMITS.audioProcessingPerMonth,
    });

    subscription = await SubscriptionService.getSubscriptionByPaddleId(subscriptionId);
  }

  if (!subscription) return;

  const billingDates = PaddleSubscriptionService.extractBillingDates(data);
  const now = new Date();
  const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  if (!subscription.paddleSubscriptionId) return;

  await SubscriptionService.activateSubscription(subscription.paddleSubscriptionId, {
    currentPeriodStart: billingDates.currentPeriodStart ?? now,
    currentPeriodEnd: billingDates.currentPeriodEnd ?? thirtyDays,
    nextBillingDate: billingDates.nextBillingDate ?? thirtyDays,
  });

  await prisma.subscription.update({
    where: { paddleSubscriptionId: subscriptionId },
    data: {
      notesPerMonth: PRO_PLAN_LIMITS.notesPerMonth,
      coursesPerMonth: PRO_PLAN_LIMITS.coursesPerMonth,
      pdfProcessingPerMonth: PRO_PLAN_LIMITS.pdfProcessingPerMonth,
      videoProcessingPerMonth: PRO_PLAN_LIMITS.videoProcessingPerMonth,
      audioProcessingPerMonth: PRO_PLAN_LIMITS.audioProcessingPerMonth,
    },
  }).catch(() => {});

  const userEmail = subscription.user?.email;
  if (userEmail) {
    await updateLoopsContact({ email: userEmail, plan: 'pro' }).catch(() => {});
  }
}

async function handleSubscriptionUpdated(data: any) {
  const subscriptionId = data.id;
  const subscription = await SubscriptionService.getSubscriptionByPaddleId(subscriptionId);

  if (!subscription || !subscription.paddleSubscriptionId) return;

  const paddleStatus = data.status;
  const dbStatus = PaddleSubscriptionService.mapPaddleStatus(paddleStatus) as SubscriptionStatus;
  const billingDates = PaddleSubscriptionService.extractBillingDates(data);

  await SubscriptionService.updateSubscriptionStatus(subscription.paddleSubscriptionId, dbStatus, {
    currentPeriodStart: billingDates.currentPeriodStart,
    currentPeriodEnd: billingDates.currentPeriodEnd,
    nextBillingDate: billingDates.nextBillingDate,
    cancelAtPeriodEnd: billingDates.cancelAtPeriodEnd,
  });

  const newPriceId = data.items?.[0]?.price?.id;
  if (newPriceId && subscription.priceId !== newPriceId) {
    await SubscriptionService.updateSubscriptionPriceId(
      subscription.paddleSubscriptionId,
      newPriceId,
      resolveInternalPlanIdFromPaddlePriceId(newPriceId) ?? undefined
    );
  }

  if (dbStatus === 'ACTIVE' && subscription.user?.email) {
    await updateLoopsContact({ email: subscription.user.email, plan: 'pro' }).catch(() => {});
  } else if (['CANCELLED', 'FAILED'].includes(dbStatus) && subscription.user?.email) {
    await updateLoopsContact({ email: subscription.user.email, plan: 'free' }).catch(() => {});
  }
}

async function handleSubscriptionCanceled(data: any) {
  const subscriptionId = data.id;
  const subscription = await SubscriptionService.getSubscriptionByPaddleId(subscriptionId);

  if (!subscription || !subscription.paddleSubscriptionId) return;

  await SubscriptionService.cancelSubscription(subscription.paddleSubscriptionId, false);

  if (subscription.user?.email) {
    await updateLoopsContact({ email: subscription.user.email, plan: 'free' }).catch(() => {});
  }
}

async function handleSubscriptionPastDue(data: any) {
  const subscriptionId = data.id;
  const subscription = await SubscriptionService.getSubscriptionByPaddleId(subscriptionId);
  if (!subscription || !subscription.paddleSubscriptionId) return;

  await SubscriptionService.updateSubscriptionStatus(subscription.paddleSubscriptionId, 'PAST_DUE');
}

async function handleSubscriptionPaused(data: any) {
  const subscriptionId = data.id;
  const subscription = await SubscriptionService.getSubscriptionByPaddleId(subscriptionId);
  if (!subscription || !subscription.paddleSubscriptionId) return;

  await SubscriptionService.updateSubscriptionStatus(subscription.paddleSubscriptionId, 'PAUSED');
}

async function handleSubscriptionResumed(data: any) {
  const subscriptionId = data.id;
  const subscription = await SubscriptionService.getSubscriptionByPaddleId(subscriptionId);
  if (!subscription || !subscription.paddleSubscriptionId) return;

  const billingDates = PaddleSubscriptionService.extractBillingDates(data);
  const now = new Date();
  const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await SubscriptionService.activateSubscription(subscription.paddleSubscriptionId, {
    currentPeriodStart: billingDates.currentPeriodStart ?? now,
    currentPeriodEnd: billingDates.currentPeriodEnd ?? thirtyDays,
    nextBillingDate: billingDates.nextBillingDate ?? thirtyDays,
  });
}

async function handleTransactionCompleted(data: any) {
  const subscriptionId = data.subscriptionId || data.subscription_id;
  if (!subscriptionId) return;

  const subscription = await SubscriptionService.getSubscriptionByPaddleId(subscriptionId);
  if (!subscription || !subscription.paddleSubscriptionId) return;

  if (subscription.status === 'ACTIVE') {
    const billingDates = PaddleSubscriptionService.extractBillingDates(
      await PaddleSubscriptionService.getSubscription(subscriptionId) || data
    );

    if (billingDates.nextBillingDate) {
      await SubscriptionService.renewSubscription(subscription.paddleSubscriptionId, billingDates.nextBillingDate);
    }

    await SubscriptionService.resetUsageCounters(subscription.userId);
  }
}
