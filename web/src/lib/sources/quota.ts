import { prisma } from "@/lib/prisma";
import { SubscriptionService } from "@/lib/subscription-service";
import { FREE_TIER_LIMITS } from "@/lib/config/subscription-limits";

const FREE_TIER_SOURCES_PER_MONTH = FREE_TIER_LIMITS.notesPerMonth;

export interface QuotaReservation {
  allowed: number;
  limit: number | null;
  used: number;
}

export async function getSourcesLimit(userId: string): Promise<number | null> {
  const [hasSubscription, subscription] = await Promise.all([
    SubscriptionService.hasActiveSubscription(userId),
    SubscriptionService.getUserSubscription(userId),
  ]);

  if (hasSubscription && subscription) {
    const subLimit = (subscription as { sourcesPerMonth?: number | null })
      .sourcesPerMonth;
    if (subLimit === null || typeof subLimit === "undefined") {
      return subscription.notesPerMonth ?? null;
    }
    return subLimit;
  }

  return FREE_TIER_SOURCES_PER_MONTH;
}

/**
 * Atomically reserve N source slots for a user.
 * Returns how many were actually reserved (may be less than requested).
 */
export async function reserveSourceSlots(
  userId: string,
  requested: number
): Promise<QuotaReservation> {
  if (requested <= 0) {
    return { allowed: 0, limit: null, used: 0 };
  }

  const limit = await getSourcesLimit(userId);

  if (limit === null) {
    await prisma.user.update({
      where: { id: userId },
      data: { usedSourcesThisMonth: { increment: requested } },
    });
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { usedSourcesThisMonth: true },
    });
    return {
      allowed: requested,
      limit: null,
      used: u?.usedSourcesThisMonth ?? 0,
    };
  }

  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { usedSourcesThisMonth: true },
  });
  const used = current?.usedSourcesThisMonth ?? 0;
  const remaining = Math.max(0, limit - used);
  const allowed = Math.min(requested, remaining);

  if (allowed > 0) {
    const reserved = await prisma.user.updateMany({
      where: {
        id: userId,
        usedSourcesThisMonth: { lte: limit - allowed },
      },
      data: { usedSourcesThisMonth: { increment: allowed } },
    });

    if (reserved.count === 0) {
      return { allowed: 0, limit, used };
    }
  }

  return { allowed, limit, used: used + allowed };
}

/**
 * Release N slots back (called when a reserved source fails pre-processing
 * or is cancelled by the user before it's processed).
 */
export async function releaseSourceSlots(
  userId: string,
  count: number
): Promise<void> {
  if (count <= 0) return;
  await prisma.user.update({
    where: { id: userId },
    data: { usedSourcesThisMonth: { decrement: count } },
  });
}
