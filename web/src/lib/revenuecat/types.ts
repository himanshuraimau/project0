export type RevenueCatWebhookEvent = {
  id?: string;
  type?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[];
  product_id?: string;
  entitlement_ids?: string[];
  entitlement_id?: string;
  store?: string;
  environment?: string;
  transaction_id?: string;
  original_transaction_id?: string;
  event_timestamp_ms?: number;
  expiration_at_ms?: number;
  purchased_at_ms?: number;
};

export type RevenueCatWebhookPayload = {
  event?: RevenueCatWebhookEvent;
  api_version?: string;
  id?: string;
};

export type RevenueCatEntitlement = {
  product_identifier?: string | null;
  purchase_date?: string | null;
  expires_date?: string | null;
  grace_period_expires_date?: string | null;
  unsubscribe_detected_at?: string | null;
  billing_issues_detected_at?: string | null;
  store?: string | null;
};

export type RevenueCatSubscription = {
  store?: string | null;
  is_sandbox?: boolean | null;
  purchase_date?: string | null;
  original_purchase_date?: string | null;
  expires_date?: string | null;
  grace_period_expires_date?: string | null;
  unsubscribe_detected_at?: string | null;
  billing_issues_detected_at?: string | null;
  auto_resume_date?: string | null;
  ownership_type?: string | null;
  store_transaction_id?: string | null;
};

export type RevenueCatSubscriber = {
  original_app_user_id?: string | null;
  aliases?: string[];
  entitlements?: Record<string, RevenueCatEntitlement>;
  subscriptions?: Record<string, RevenueCatSubscription>;
  management_url?: string | null;
  original_purchase_date?: string | null;
};

export type RevenueCatSubscriberResponse = {
  request_date?: string;
  request_date_ms?: number;
  subscriber: RevenueCatSubscriber;
};

export type RevenueCatBillingProvider =
  | 'PADDLE'
  | 'APP_STORE'
  | 'PLAY_STORE'
  | 'TEST_STORE'
  | 'UNKNOWN';

export type RevenueCatSubscriptionMirror = {
  billingProvider: RevenueCatBillingProvider;
  providerSubscriptionId: string | null;
  providerCustomerId: string | null;
  revenueCatAppUserId: string | null;
  revenueCatCustomerId: string | null;
  entitlementId: string;
  priceId: string;
  status: 'PENDING' | 'ACTIVE' | 'ON_HOLD' | 'PAUSED' | 'PAST_DUE' | 'CANCELLED' | 'FAILED' | 'EXPIRED';
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  nextBillingDate: Date | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: Date | null;
  trialEnd: Date | null;
  store: string | null;
  environment: string | null;
  managementUrl: string | null;
  metadata: Record<string, unknown>;
};
