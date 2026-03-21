import { PRO_PLAN_LIMITS } from '@/lib/config/subscription-limits';
import { updateLoopsContact } from '@/lib/loops';
import { prisma } from '@/lib/prisma';
import { Prisma, type SubscriptionStatus } from '@prisma/client';
import { getRevenueCatEntitlementId } from './config';
import { getRevenueCatSubscriber } from './client';
import { mapRevenueCatEventToInactiveStatus, mapRevenueCatSubscriberToMirror } from './mapper';
import type { RevenueCatWebhookEvent } from './types';

function mergeMetadata(existingMetadata: unknown, nextMetadata: Record<string, unknown>) {
  const safeExisting =
    existingMetadata && typeof existingMetadata === 'object' && !Array.isArray(existingMetadata)
      ? (existingMetadata as Record<string, unknown>)
      : {};

  return {
    ...safeExisting,
    ...nextMetadata,
  };
}

function toJsonValue(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

async function syncLoopsPlan(email: string | null | undefined, hasAccess: boolean) {
  if (!email) return;
  await updateLoopsContact({
    email,
    plan: hasAccess ? 'pro' : 'free',
  }).catch(() => {});
}

function getInactiveUpdate(fallbackEvent?: RevenueCatWebhookEvent) {
  const now = fallbackEvent?.event_timestamp_ms ? new Date(fallbackEvent.event_timestamp_ms) : new Date();
  const status = mapRevenueCatEventToInactiveStatus(fallbackEvent) as SubscriptionStatus;

  if (fallbackEvent?.type === 'CANCELLATION') {
    return {
      status,
      cancelAtPeriodEnd: true,
      cancelledAt: now,
    };
  }

  return {
    status,
    cancelAtPeriodEnd: false,
    cancelledAt: ['CANCELLATION', 'REFUND', 'EXPIRATION'].includes(fallbackEvent?.type ?? '') ? now : null,
  };
}

export async function syncRevenueCatSubscriber(
  appUserId: string,
  fallbackEvent?: RevenueCatWebhookEvent
) {
  const user = await prisma.user.findUnique({
    where: { id: appUserId },
    include: { subscription: true },
  });

  if (!user) {
    console.warn('RevenueCat sync skipped: user not found', appUserId);
    return null;
  }

  const subscriberResponse = await getRevenueCatSubscriber(appUserId);
  const existing = user.subscription;

  if (!subscriberResponse) {
    if (existing && existing.billingProvider !== 'PADDLE') {
      const updated = await prisma.subscription.update({
        where: { userId: appUserId },
        data: {
          ...getInactiveUpdate(fallbackEvent),
          revenueCatAppUserId: appUserId,
          revenueCatCustomerId: existing.revenueCatCustomerId || appUserId,
          entitlementId: existing.entitlementId || getRevenueCatEntitlementId(),
          metadata: toJsonValue(mergeMetadata(existing.metadata, {
            revenueCat: {
              lastSyncedAt: new Date().toISOString(),
              missingSubscriber: true,
            },
          })),
        },
        include: { user: true },
      });

      await syncLoopsPlan(updated.user?.email, false);
      return updated;
    }

    return existing;
  }

  const mirror = mapRevenueCatSubscriberToMirror(
    subscriberResponse,
    getRevenueCatEntitlementId(),
    fallbackEvent
  );

  if (!mirror) {
    if (existing && existing.billingProvider !== 'PADDLE') {
      const updated = await prisma.subscription.update({
        where: { userId: appUserId },
        data: {
          ...getInactiveUpdate(fallbackEvent),
          revenueCatAppUserId: appUserId,
          revenueCatCustomerId: existing.revenueCatCustomerId || appUserId,
          entitlementId: existing.entitlementId || getRevenueCatEntitlementId(),
          metadata: toJsonValue(mergeMetadata(existing.metadata, {
            revenueCat: {
              lastEventType: fallbackEvent?.type ?? null,
              lastSyncedAt: new Date().toISOString(),
            },
          })),
        },
        include: { user: true },
      });

      await syncLoopsPlan(updated.user?.email, false);
      return updated;
    }

    return existing;
  }

  const mergedMetadata = mergeMetadata(existing?.metadata, {
    ...mirror.metadata,
    revenueCat: {
      ...(mirror.metadata.revenueCat && typeof mirror.metadata.revenueCat === 'object'
        ? (mirror.metadata.revenueCat as Record<string, unknown>)
        : {}),
      lastEventType: fallbackEvent?.type ?? null,
      lastSyncedAt: new Date().toISOString(),
    },
  });

  const subscriptionData = {
    billingProvider: mirror.billingProvider,
    providerSubscriptionId:
      mirror.providerSubscriptionId ||
      existing?.providerSubscriptionId ||
      existing?.paddleSubscriptionId ||
      null,
    providerCustomerId: mirror.providerCustomerId || existing?.providerCustomerId || null,
    revenueCatAppUserId: mirror.revenueCatAppUserId || appUserId,
    revenueCatCustomerId: mirror.revenueCatCustomerId || appUserId,
    entitlementId: mirror.entitlementId,
    store: mirror.store,
    environment: mirror.environment,
    managementUrl: mirror.managementUrl,
    priceId: mirror.priceId || existing?.priceId || '',
    status: mirror.status as SubscriptionStatus,
    currentPeriodStart: mirror.currentPeriodStart,
    currentPeriodEnd: mirror.currentPeriodEnd,
    nextBillingDate: mirror.nextBillingDate,
    cancelAtPeriodEnd: mirror.cancelAtPeriodEnd,
    cancelledAt: mirror.cancelledAt,
    trialEnd: mirror.trialEnd,
    metadata: toJsonValue(mergedMetadata),
    notesPerMonth: PRO_PLAN_LIMITS.notesPerMonth,
    coursesPerMonth: PRO_PLAN_LIMITS.coursesPerMonth,
    pdfProcessingPerMonth: PRO_PLAN_LIMITS.pdfProcessingPerMonth,
    videoProcessingPerMonth: PRO_PLAN_LIMITS.videoProcessingPerMonth,
    audioProcessingPerMonth: PRO_PLAN_LIMITS.audioProcessingPerMonth,
    paddleSubscriptionId:
      mirror.billingProvider === 'PADDLE'
        ? existing?.paddleSubscriptionId || mirror.providerSubscriptionId
        : existing?.paddleSubscriptionId || null,
    paddleDiscountId: existing?.paddleDiscountId || null,
    amount: existing?.amount ?? null,
  };

  const syncedSubscription = existing
    ? await prisma.subscription.update({
        where: { userId: appUserId },
        data: subscriptionData,
        include: { user: true },
      })
    : await prisma.subscription.create({
        data: {
          userId: appUserId,
          ...subscriptionData,
        },
        include: { user: true },
      });

  await syncLoopsPlan(syncedSubscription.user?.email, mirror.status === 'ACTIVE' || mirror.status === 'PAST_DUE');
  return syncedSubscription;
}
