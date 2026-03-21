export function getRevenueCatSecretApiKey(): string {
  const apiKey = process.env.REVENUECAT_SECRET_API_KEY;
  if (!apiKey) {
    throw new Error('REVENUECAT_SECRET_API_KEY is not configured');
  }
  return apiKey;
}

export function getRevenueCatWebhookAuth(): string {
  const auth = process.env.REVENUECAT_WEBHOOK_AUTH;
  if (!auth) {
    throw new Error('REVENUECAT_WEBHOOK_AUTH is not configured');
  }
  return auth;
}

export function getRevenueCatEntitlementId(): string {
  return process.env.REVENUECAT_ENTITLEMENT_ID || 'pro';
}

export function getRevenueCatApiBaseUrl(): string {
  return process.env.REVENUECAT_API_BASE_URL || 'https://api.revenuecat.com/v1';
}

export function isValidRevenueCatWebhookAuth(headerValue: string | null): boolean {
  if (!headerValue) return false;

  const expected = getRevenueCatWebhookAuth();
  return headerValue === expected || headerValue === `Bearer ${expected}`;
}
