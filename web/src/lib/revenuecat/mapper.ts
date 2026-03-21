import type { RevenueCatSubscriberResponse, RevenueCatSubscriptionMirror, RevenueCatWebhookEvent } from './types';

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseMillis(value?: number | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isFutureDate(date: Date | null): boolean {
  return Boolean(date && date.getTime() > Date.now());
}

function mapStoreToBillingProvider(store?: string | null): RevenueCatSubscriptionMirror['billingProvider'] {
  switch (store) {
    case 'APP_STORE':
    case 'MAC_APP_STORE':
      return 'APP_STORE';
    case 'PLAY_STORE':
      return 'PLAY_STORE';
    case 'PADDLE':
      return 'PADDLE';
    case 'TEST_STORE':
      return 'TEST_STORE';
    default:
      return 'UNKNOWN';
  }
}

function deriveStatus(params: {
  hasAccess: boolean;
  hasBillingIssue: boolean;
  fallbackEventType?: string;
}): RevenueCatSubscriptionMirror['status'] {
  if (params.hasAccess) {
    return params.hasBillingIssue ? 'PAST_DUE' : 'ACTIVE';
  }

  switch (params.fallbackEventType) {
    case 'BILLING_ISSUE':
      return 'PAST_DUE';
    case 'CANCELLATION':
    case 'REFUND':
      return 'CANCELLED';
    case 'EXPIRATION':
      return 'EXPIRED';
    default:
      return 'EXPIRED';
  }
}

export function mapRevenueCatSubscriberToMirror(
  subscriberResponse: RevenueCatSubscriberResponse,
  preferredEntitlementId: string,
  fallbackEvent?: RevenueCatWebhookEvent
): RevenueCatSubscriptionMirror | null {
  const subscriber = subscriberResponse.subscriber;
  const entitlements = subscriber.entitlements ?? {};
  const entitlementEntries = Object.entries(entitlements);

  if (entitlementEntries.length === 0) {
    return null;
  }

  let entitlementId = preferredEntitlementId;
  let entitlement = entitlements[preferredEntitlementId];

  if (!entitlement) {
    const firstEntry = entitlementEntries[0];
    if (!firstEntry) {
      return null;
    }

    [entitlementId, entitlement] = firstEntry;
  }
  const productId =
    entitlement.product_identifier ||
    fallbackEvent?.product_id ||
    fallbackEvent?.entitlement_id ||
    preferredEntitlementId;

  const linkedSubscription = productId ? subscriber.subscriptions?.[productId] : undefined;
  const currentPeriodStart =
    parseDate(entitlement.purchase_date) ??
    parseDate(linkedSubscription?.purchase_date) ??
    parseMillis(fallbackEvent?.purchased_at_ms);
  const currentPeriodEnd =
    parseDate(entitlement.expires_date) ??
    parseDate(linkedSubscription?.expires_date) ??
    parseMillis(fallbackEvent?.expiration_at_ms);
  const gracePeriodEnd =
    parseDate(entitlement.grace_period_expires_date) ??
    parseDate(linkedSubscription?.grace_period_expires_date);
  const unsubscribeDetectedAt =
    parseDate(entitlement.unsubscribe_detected_at) ??
    parseDate(linkedSubscription?.unsubscribe_detected_at);
  const cancelledAt =
    unsubscribeDetectedAt ??
    (fallbackEvent?.type === 'CANCELLATION' ? parseMillis(fallbackEvent.event_timestamp_ms) : null);
  const hasAccess = isFutureDate(currentPeriodEnd) || isFutureDate(gracePeriodEnd) || !currentPeriodEnd;
  const hasBillingIssue = Boolean(
    entitlement.billing_issues_detected_at ||
      linkedSubscription?.billing_issues_detected_at ||
      fallbackEvent?.type === 'BILLING_ISSUE'
  );
  const store = entitlement.store || linkedSubscription?.store || fallbackEvent?.store || null;
  const environment =
    fallbackEvent?.environment ||
    (linkedSubscription?.is_sandbox ? 'SANDBOX' : store ? 'PRODUCTION' : null);

  return {
    billingProvider: mapStoreToBillingProvider(store),
    providerSubscriptionId:
      linkedSubscription?.store_transaction_id ||
      fallbackEvent?.original_transaction_id ||
      fallbackEvent?.transaction_id ||
      null,
    providerCustomerId: subscriber.original_app_user_id || fallbackEvent?.original_app_user_id || null,
    revenueCatAppUserId: fallbackEvent?.app_user_id || subscriber.original_app_user_id || null,
    revenueCatCustomerId: subscriber.original_app_user_id || fallbackEvent?.original_app_user_id || null,
    entitlementId,
    priceId: productId,
    status: deriveStatus({
      hasAccess,
      hasBillingIssue,
      fallbackEventType: fallbackEvent?.type,
    }),
    currentPeriodStart,
    currentPeriodEnd,
    nextBillingDate: currentPeriodEnd,
    cancelAtPeriodEnd: Boolean(unsubscribeDetectedAt),
    cancelledAt,
    trialEnd: null,
    store,
    environment,
    managementUrl: subscriber.management_url || null,
    metadata: {
      revenueCat: {
        aliases: subscriber.aliases ?? [],
        fallbackEventType: fallbackEvent?.type ?? null,
        originalAppUserId: subscriber.original_app_user_id ?? null,
        productId,
      },
    },
  };
}

export function mapRevenueCatEventToInactiveStatus(
  fallbackEvent?: RevenueCatWebhookEvent
): RevenueCatSubscriptionMirror['status'] {
  switch (fallbackEvent?.type) {
    case 'BILLING_ISSUE':
      return 'PAST_DUE';
    case 'REFUND':
    case 'CANCELLATION':
      return 'CANCELLED';
    case 'EXPIRATION':
      return 'EXPIRED';
    default:
      return 'EXPIRED';
  }
}
