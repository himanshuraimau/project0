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

export interface RevenueCatWebhookEvent {
  event: {
    id: string;
    type: string;
    app_id: string;
    event_timestamp_ms: number;
    environment: "SANDBOX" | "PRODUCTION";
    aliased?: boolean;
  };
  subscriber: {
    original_app_user_id: string;
    entitlements?: Record<string, RevenueCatWebhookEntitlement>;
    subscriptions?: Record<string, RevenueCatWebhookSubscription>;
    management_url?: string | null;
  };
  product?: {
    id: string;
    store?: string;
  };
}

export interface RevenueCatWebhookEntitlement {
  product_identifier: string;
  is_active: boolean;
  expires_date?: string;
  purchase_date: string;
  grace_period_expires_date?: string;
  auto_renew?: boolean;
}

export interface RevenueCatWebhookSubscription {
  product_id: string;
  expires_date: string;
  purchase_date: string;
  original_purchase_date: string;
  store: string;
  is_sandbox: boolean;
  unsubscribe_detected_at?: string;
  billing_issues_detected_at?: string;
  grace_period_expires_date?: string;
  refunded_at?: string;
  auto_resume_date?: string;
  ownership_type?: string;
  store_transaction_id: string;
  original_transaction_id: string;
  period_type: string;
}

export interface InternalPlanConfig {
  id: InternalPlanId;
  name: string;
  amount: number;
  interval: BillingInterval;
  features: string[];
}
