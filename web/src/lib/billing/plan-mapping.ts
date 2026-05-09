import type { InternalPlanId, InternalPlanConfig } from "./types";

export const INTERNAL_PLANS: Record<InternalPlanId, InternalPlanConfig> = {
  PRO_MONTHLY: {
    id: "PRO_MONTHLY",
    name: "Pro Monthly",
    amount: 19,
    interval: "monthly",
    features: [
      "Unlimited PDF processing",
      "Unlimited audio transcription",
      "Unlimited YouTube video processing",
      "Unlimited course generation",
      "Unlimited notes and flashcards",
      "Priority support",
      "Export features",
    ],
  },
  PRO_YEARLY: {
    id: "PRO_YEARLY",
    name: "Pro Yearly",
    amount: 89,
    interval: "yearly",
    features: [
      "Unlimited PDF processing",
      "Unlimited audio transcription",
      "Unlimited YouTube video processing",
      "Unlimited course generation",
      "Unlimited notes and flashcards",
      "Priority support",
      "Export features",
      "Save 63% vs monthly",
    ],
  },
};

export function getPaddlePriceId(planId: InternalPlanId): string {
  const key =
    planId === "PRO_MONTHLY"
      ? "NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID"
      : "NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID";
  return process.env[key] || "";
}

export function getRevenueCatProductId(planId: InternalPlanId): string {
  const key =
    planId === "PRO_MONTHLY"
      ? "REVENUECAT_MONTHLY_PRODUCT_ID"
      : "REVENUECAT_YEARLY_PRODUCT_ID";
  return process.env[key] || "";
}

export function resolveInternalPlanIdFromPaddlePriceId(priceId: string): InternalPlanId | null {
  const monthlyId = process.env.NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID;
  const yearlyId = process.env.NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID;
  if (priceId === monthlyId) return "PRO_MONTHLY";
  if (priceId === yearlyId) return "PRO_YEARLY";
  return null;
}

export function resolveInternalPlanIdFromRCProductId(rcProductId: string): InternalPlanId | null {
  const rcMonthlyId = process.env.REVENUECAT_MONTHLY_PRODUCT_ID;
  const rcYearlyId = process.env.REVENUECAT_YEARLY_PRODUCT_ID;
  if (!rcProductId) return null;
  if (rcProductId === rcMonthlyId) return "PRO_MONTHLY";
  if (rcProductId === rcYearlyId) return "PRO_YEARLY";
  return null;
}

export function resolveInternalPlanIdFromRCWebhook(productId: string): InternalPlanId | null {
  if (!productId) return null;
  return resolveInternalPlanIdFromRCProductId(productId) ?? null;
}

export function getInternalPlanConfig(internalPlanId: InternalPlanId | null): InternalPlanConfig | null {
  if (!internalPlanId) return null;
  return INTERNAL_PLANS[internalPlanId] ?? null;
}
