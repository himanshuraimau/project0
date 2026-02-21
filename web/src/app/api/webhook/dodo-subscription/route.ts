import { Webhooks } from '@dodopayments/nextjs';
import { DodoSubscriptionService } from '@/lib/payments/dodo';
import { SubscriptionService } from '@/lib/subscription-service';
import { prisma } from '@/lib/prisma';
import { PRO_PLAN_LIMITS } from '@/lib/config/subscription-limits';
import { updateLoopsContact } from '@/lib/loops';

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
    console.log(`Reset usage counters for user ${userId}`);
  } catch (error) {
    console.error('Error resetting usage counters:', error);
  }
}

export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY!,

  onPayload: async (payload: any) => {
    const eventType = payload.type;
    console.log('Received Dodo webhook:', eventType);

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
  },

  onSubscriptionActive: async (payload: any) => {
    await handleSubscriptionActivated(payload);
  },
  onSubscriptionCancelled: async (payload: any) => {
    await handleSubscriptionCancelled(payload);
  },
  onSubscriptionRenewed: async (payload: any) => {
    await handleSubscriptionRenewed(payload);
  },
  onSubscriptionPlanChanged: async (payload: any) => {
    await handleSubscriptionPlanChanged(payload);
  },
  onSubscriptionOnHold: async (payload: any) => {
    await handleSubscriptionOnHold(payload);
  },
  onSubscriptionFailed: async (payload: any) => {
    await handleSubscriptionFailed(payload);
  },
  onSubscriptionExpired: async (payload: any) => {
    await handleSubscriptionExpired(payload);
  },
  onPaymentSucceeded: async (payload: any) => {
    await handlePaymentSucceeded(payload);
  },
  onPaymentFailed: async (payload: any) => {
    await handlePaymentFailed(payload);
  },
});

async function handleSubscriptionCreated(payload: any) {
  const subscriptionId = payload.data.subscription_id;
  const metadata: Record<string, string> = payload.data.metadata || {};

  let customerId: string | undefined = metadata.userId;

  if (!customerId) {
    const customerEmail = payload.data.customer?.email;
    if (customerEmail) {
      try {
        const user = await prisma.user.findUnique({ where: { email: customerEmail } });
        if (user) {
          customerId = user.id;
          console.log('Resolved userId from email:', customerEmail, '->', customerId);
        }
      } catch (err) {
        console.error('Error looking up user by email:', err);
      }
    }
  }

  if (!customerId) {
    console.error('Cannot resolve userId in subscription.created webhook');
    return;
  }

  const productId: string =
    payload.data.product_id ||
    metadata.productId ||
    process.env.NEXT_PUBLIC_DODO_PAYMENT_SUBSCRIPTION_ID!;

  if (metadata.isYearlyUpgrade === 'true') {
    const replacedMonthlyDodoId = metadata.replacedMonthlyDodoSubscriptionId;
    const monthlyPeriodEnd = metadata.monthlyPeriodEnd
      ? new Date(metadata.monthlyPeriodEnd)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    console.log('Processing yearly upgrade:', { customerId, subscriptionId });

    await SubscriptionService.replaceWithPendingYearlyUpgrade(
      customerId,
      subscriptionId,
      productId,
      monthlyPeriodEnd,
      replacedMonthlyDodoId
    );
    return;
  }

  const existing = await SubscriptionService.getUserSubscription(customerId);
  if (existing) {
    if (existing.dodoSubscriptionId === subscriptionId) {
      console.log('subscription.created already processed (idempotent):', subscriptionId);
      return;
    }

    console.log('Deleting old subscription to create new one:', {
      userId: customerId,
      oldDodoId: existing.dodoSubscriptionId,
      newDodoId: subscriptionId,
    });

    try {
      await SubscriptionService.deleteSubscription(customerId);
    } catch (deleteErr) {
      console.error('Error deleting old subscription:', deleteErr);
    }
  }

  await SubscriptionService.createSubscription({
    userId: customerId,
    dodoSubscriptionId: subscriptionId,
    productId,
    status: 'PENDING',
  });

  console.log('Subscription created:', subscriptionId);
}

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
      console.log('Cancelled old monthly subscription:', replacedMonthlyDodoId);
    } else {
      console.warn('Could not cancel old monthly subscription:', cancelResult.error);
    }
  } catch (err) {
    console.error('Error cancelling old monthly subscription:', err);
  }

  const { replacedMonthlyDodoSubscriptionId: _, ...restMeta } = metadata;
  await SubscriptionService.updateSubscriptionMetadata(subscription.dodoSubscriptionId, restMeta);
}

async function restoreToOldMonthlySubscriptionIfAny(subscription: {
  userId: string;
  dodoSubscriptionId: string;
  metadata: unknown;
}): Promise<boolean> {
  const metadata = (subscription.metadata as Record<string, unknown>) || {};
  const replacedMonthlyDodoId = metadata.replacedMonthlyDodoSubscriptionId as string | undefined;

  if (!replacedMonthlyDodoId) return false;

  try {
    const oldMonthly = await DodoSubscriptionService.getSubscription(replacedMonthlyDodoId);
    if (!oldMonthly) {
      console.warn('Could not fetch old monthly subscription for restore:', replacedMonthlyDodoId);
      return false;
    }

    const periodInfo = DodoSubscriptionService.getSubscriptionPeriodInfo(oldMonthly);

    await prisma.subscription.update({
      where: { userId: subscription.userId },
      data: {
        dodoSubscriptionId: replacedMonthlyDodoId,
        productId: oldMonthly.product_id || undefined,
        status: 'ACTIVE',
        cancelAtPeriodEnd: periodInfo.cancelAtPeriodEnd ?? false,
        cancelledAt: null,
        currentPeriodStart: periodInfo.currentPeriodStart ?? undefined,
        currentPeriodEnd: periodInfo.currentPeriodEnd ?? undefined,
        nextBillingDate: periodInfo.nextBillingDate ?? undefined,
        metadata: {},
        updatedAt: new Date(),
      },
    });

    console.log('Restored subscription to old monthly:', { userId: subscription.userId, restoredDodoId: replacedMonthlyDodoId });
    return true;
  } catch (err) {
    console.error('Error restoring monthly subscription:', err);
    return false;
  }
}

async function handleSubscriptionActivated(payload: any) {
  const subscriptionId = payload.data.subscription_id;
  const metadata: Record<string, string> = payload.data.metadata || {};

  const now = new Date();
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const periodStart = payload.data.current_period_start ? new Date(payload.data.current_period_start) : now;
  const periodEnd = payload.data.current_period_end ? new Date(payload.data.current_period_end) : thirtyDaysFromNow;
  const nextBilling = payload.data.next_billing_date ? new Date(payload.data.next_billing_date) : thirtyDaysFromNow;
  const productId: string = payload.data.product_id || metadata.productId || process.env.NEXT_PUBLIC_DODO_PAYMENT_SUBSCRIPTION_ID!;

  let subscription = await SubscriptionService.getSubscriptionByDodoId(subscriptionId);

  if (!subscription) {
    let userId: string | undefined = metadata.userId;

    if (!userId) {
      const customerEmail = payload.data.customer?.email;
      if (customerEmail) {
        try {
          const user = await prisma.user.findUnique({ where: { email: customerEmail } });
          if (user) {
            userId = user.id;
            console.log('Resolved userId from email:', customerEmail, '->', userId);
          }
        } catch (err) {
          console.error('Error looking up user by email:', err);
        }
      }
    }

    if (!userId) {
      console.error('Cannot resolve userId in subscription.active webhook');
      return;
    }

    const isYearlyUpgrade = metadata.isYearlyUpgrade === 'true';

    if (isYearlyUpgrade) {
      const replacedMonthlyDodoId = metadata.replacedMonthlyDodoSubscriptionId;
      const monthlyPeriodEnd = metadata.monthlyPeriodEnd ? new Date(metadata.monthlyPeriodEnd) : thirtyDaysFromNow;
      await SubscriptionService.replaceWithPendingYearlyUpgrade(userId, subscriptionId, productId, monthlyPeriodEnd, replacedMonthlyDodoId);
    } else {
      try {
        const existing = await SubscriptionService.getUserSubscription(userId);
        if (existing && existing.dodoSubscriptionId !== subscriptionId) {
          console.log('Deleting stale subscription:', { userId, oldDodoId: existing.dodoSubscriptionId, newDodoId: subscriptionId });
          await SubscriptionService.deleteSubscription(userId);
        }
      } catch (deleteErr) {
        console.error('Error deleting stale subscription:', deleteErr);
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

    subscription = await SubscriptionService.getSubscriptionByDodoId(subscriptionId);
    if (!subscription) {
      console.error('Subscription record not found after upsert:', subscriptionId);
      return;
    }
  }

  await SubscriptionService.activateSubscription(subscription.dodoSubscriptionId, {
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    nextBillingDate: nextBilling,
  });

  await cancelReplacedMonthlySubscriptionIfAny(subscription);

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
    console.error('Error updating feature limits:', err);
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
    console.log('Subscription not found for update:', subscriptionId);
    return;
  }

  if (status) {
    const statusMap: Record<string, any> = {
      'ACTIVE': async () => {
        if (subscription.status === 'PENDING') {
          await SubscriptionService.activateSubscription(subscription.dodoSubscriptionId, {
            currentPeriodStart: payload.data.current_period_start ? new Date(payload.data.current_period_start) : new Date(),
            currentPeriodEnd: payload.data.current_period_end ? new Date(payload.data.current_period_end) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            nextBillingDate: payload.data.next_billing_date ? new Date(payload.data.next_billing_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          });
          await cancelReplacedMonthlySubscriptionIfAny(subscription);
        } else {
          await SubscriptionService.updateSubscriptionStatus(subscription.dodoSubscriptionId, status as any);
        }
      },
      'CANCELLED': async () => {
        if (subscription.status === 'PENDING') {
          const restored = await restoreToOldMonthlySubscriptionIfAny(subscription);
          if (!restored) {
            await SubscriptionService.deleteSubscription(subscription.userId);
          }
        } else {
          await SubscriptionService.cancelSubscription(subscription.dodoSubscriptionId, payload.data.cancel_at_next_billing_date || false);
        }
      },
      'FAILED': async () => {
        if (subscription.status === 'PENDING') {
          const restored = await restoreToOldMonthlySubscriptionIfAny(subscription);
          if (!restored) {
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

  if (!['CANCELLED', 'FAILED'].includes(status || '')) {
    const updates: any = {};
    if (payload.data.next_billing_date) updates.nextBillingDate = new Date(payload.data.next_billing_date);
    if (payload.data.current_period_start) updates.currentPeriodStart = new Date(payload.data.current_period_start);
    if (payload.data.current_period_end) updates.currentPeriodEnd = new Date(payload.data.current_period_end);
    if (payload.data.cancel_at_next_billing_date !== undefined) updates.cancelAtPeriodEnd = payload.data.cancel_at_next_billing_date;

    if (payload.data.product_id && subscription.productId !== payload.data.product_id) {
      await SubscriptionService.updateSubscriptionProductId(subscription.dodoSubscriptionId, payload.data.product_id);
    }

    if (Object.keys(updates).length > 0 && status) {
      await SubscriptionService.updateSubscriptionStatus(subscription.dodoSubscriptionId, status as any, updates);
    }
  }

  console.log('Subscription updated:', subscriptionId);
}

async function handleSubscriptionFailed(payload: any) {
  const subscriptionId = payload.data.subscription_id;
  const subscription = await SubscriptionService.getSubscriptionByDodoId(subscriptionId);

  if (!subscription) {
    console.log('Subscription not found for failed event:', subscriptionId);
    return;
  }

  if (subscription.status === 'PENDING') {
    const restored = await restoreToOldMonthlySubscriptionIfAny(subscription);
    if (!restored) {
      await SubscriptionService.deleteSubscription(subscription.userId);
    }
  } else {
    await SubscriptionService.failSubscription(subscription.dodoSubscriptionId);
  }

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
    console.log('Subscription not found for payment succeeded:', subscriptionId);
    return;
  }

  const nextBillingDate = payload.data.next_billing_date
    ? new Date(payload.data.next_billing_date)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await SubscriptionService.renewSubscription(subscription.dodoSubscriptionId, nextBillingDate);
  console.log('Payment succeeded:', subscriptionId);
}

async function handlePaymentFailed(payload: any) {
  const subscriptionId = payload.data.subscription_id;
  const subscription = await SubscriptionService.getSubscriptionByDodoId(subscriptionId);

  if (!subscription) {
    console.log('Subscription not found for payment failed:', subscriptionId);
    return;
  }

  await SubscriptionService.failSubscription(subscription.dodoSubscriptionId);
  console.log('Payment failed:', subscriptionId);
}

async function handleSubscriptionCancelled(payload: any) {
  const subscriptionId = payload.data.subscription_id;
  const subscription = await SubscriptionService.getSubscriptionByDodoId(subscriptionId);

  if (!subscription) {
    console.log('Subscription not found for cancelled event:', subscriptionId);
    return;
  }

  const cancelAtPeriodEnd = payload.data.cancel_at_next_billing_date || false;

  if (subscription.status === 'PENDING') {
    const restored = await restoreToOldMonthlySubscriptionIfAny(subscription);
    if (!restored) {
      await SubscriptionService.deleteSubscription(subscription.userId);
    }
  } else {
    await SubscriptionService.cancelSubscription(subscription.dodoSubscriptionId, cancelAtPeriodEnd);
  }

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
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const metadata = (subscription.metadata as any) || {};
  const scheduledProductId = metadata.scheduledProductId;

  if (scheduledProductId && scheduledProductId !== subscription.productId) {
    console.log(`Executing scheduled plan change: ${subscription.productId} -> ${scheduledProductId}`);

    try {
      const changeResult = await DodoSubscriptionService.changePlan(subscriptionId, scheduledProductId);
      if (changeResult.success) {
        await SubscriptionService.updateSubscriptionProductId(subscriptionId, scheduledProductId);
      } else {
        console.error('Failed to execute scheduled plan change:', changeResult.error);
      }
    } catch (error) {
      console.error('Error executing scheduled plan change:', error);
    }
  }

  await SubscriptionService.renewSubscription(subscription.dodoSubscriptionId, nextBillingDate);
  await resetUsageCounters(subscription.userId);
  console.log('Subscription renewed:', subscriptionId);
}

async function handleSubscriptionPlanChanged(payload: any) {
  const subscriptionId = payload.data.subscription_id;
  const subscription = await SubscriptionService.getSubscriptionByDodoId(subscriptionId);

  if (!subscription) {
    console.log('Subscription not found for plan_changed event:', subscriptionId);
    return;
  }

  const data = payload.data;
  const updates: { productId?: string; currentPeriodStart?: Date; currentPeriodEnd?: Date; nextBillingDate?: Date } = {};

  if (data.product_id) updates.productId = data.product_id;
  if (data.next_billing_date) {
    const nextBilling = new Date(data.next_billing_date);
    updates.nextBillingDate = nextBilling;
    updates.currentPeriodEnd = nextBilling;
  }
  if (data.current_period_start) updates.currentPeriodStart = new Date(data.current_period_start);
  if (data.current_period_end) updates.currentPeriodEnd = new Date(data.current_period_end);

  if (updates.productId && subscription.productId !== updates.productId) {
    await SubscriptionService.updateSubscriptionProductId(subscriptionId, updates.productId);
  }

  if (updates.nextBillingDate || updates.currentPeriodStart || updates.currentPeriodEnd) {
    await SubscriptionService.updateSubscriptionStatus(
      subscription.dodoSubscriptionId,
      (data.status?.toUpperCase() || subscription.status) as any,
      { currentPeriodStart: updates.currentPeriodStart, currentPeriodEnd: updates.currentPeriodEnd, nextBillingDate: updates.nextBillingDate }
    );
  }

  console.log('Subscription plan changed:', subscriptionId);
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
