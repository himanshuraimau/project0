import type { BillingProvider as PrismaBillingProvider, SubscriptionStatus } from "@prisma/client";

export type BillingProvider = PrismaBillingProvider;
export type { SubscriptionStatus };

export type BillingInterval = "monthly" | "yearly";

export type InternalPlanId = "PRO_MONTHLY" | "PRO_YEARLY";

export type RCStore = "APP_STORE" | "PLAY_STORE";

export interface SubscriptionCreateParams {
  userId: string;
  provider: PrismaBillingProvider;
  priceId: string;
  internalPlanId?: InternalPlanId;
  status?: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  nextBillingDate?: Date;
  trialEnd?: Date;
  metadata?: Record<string, unknown>;
  amount?: number;
  cancelAtPeriodEnd?: boolean;
  paddleSubscriptionId?: string;
  rcOriginalTransactionId?: string;
  rcProductId?: string;
  rcStore?: RCStore;
}

export interface SubscriptionStatusResult {
  hasSubscription: boolean;
  provider: PrismaBillingProvider | null;
  status: SubscriptionStatus | null;
  internalPlanId: InternalPlanId | null;
  priceId: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  nextBillingDate: Date | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: Date | null;
  trialEnd: Date | null;
  amount: number | null;
  daysRemaining: number | null;
  isActive: boolean;
  isTrial: boolean;
  displayStatus: string;
}

export interface RevenueCatWebhookPayload {
  api_version?: string;
  event: RevenueCatWebhookEvent;
}

export interface RevenueCatWebhookEvent {
  id: string;
  type: string;
  app_id?: string;
  event_timestamp_ms: number;
  app_user_id: string;
  original_app_user_id: string;
  aliases?: string[];
  product_id: string;
  entitlement_ids?: string[];
  entitlement_id?: string;
  store: string;
  environment: "SANDBOX" | "PRODUCTION";
  purchased_at_ms?: number;
  expiration_at_ms?: number | null;
  grace_period_expiration_at_ms?: number | null;
  period_type?: "TRIAL" | "INTRO" | "NORMAL" | "PROMOTIONAL" | "PREPAID";
  original_transaction_id?: string;
  transaction_id?: string;
  cancel_reason?: string;
  expiration_reason?: string;
  auto_resume_at_ms?: number | null;
  price?: number | null;
  price_in_purchased_currency?: number | null;
  currency?: string;
  tax_percentage?: number | null;
  commission_percentage?: number | null;
  subscriber_attributes?: Record<string, { value: string; updated_at_ms: number }>;
}

export interface InternalPlanConfig {
  id: InternalPlanId;
  name: string;
  amount: number;
  interval: BillingInterval;
  features: string[];
}
