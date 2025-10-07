// Dodo Payments configuration constants and types

/**
 * Get Dodo configuration (lazy evaluation to ensure env vars are loaded)
 */
export function getDodoConfig() {
  return {
    environment: process.env.DODO_PAYMENTS_ENVIRONMENT || 'test_mode',
    apiKey: process.env.DODO_PAYMENTS_API_KEY!,
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY!,
    returnUrl: process.env.DODO_PAYMENTS_RETURN_URL!,
    subscriptionProductId: process.env.NEXT_PUBLIC_DODO_PAYMENT_SUBSCRIPTION_ID!,
    baseUrl: process.env.DODO_PAYMENTS_ENVIRONMENT === 'live_mode' 
      ? 'https://live.dodopayments.com' 
      : 'https://test.dodopayments.com',
  } as const;
}

// For backwards compatibility, export as DODO_CONFIG but with getter
export const DODO_CONFIG = new Proxy({} as ReturnType<typeof getDodoConfig>, {
  get: (target, prop) => {
    return getDodoConfig()[prop as keyof ReturnType<typeof getDodoConfig>];
  }
});

export const SUBSCRIPTION_CONFIG = {
  price: 1999, // $19.99 in cents
  currency: 'USD',
  interval: 'Month',
  trialDays: 0, // No trial period - matches Dodo product settings
} as const;

// Subscription plan details
export const SUBSCRIPTION_PLAN = {
  id: 'pro-monthly',
  name: 'Pro Plan',
  description: 'Unlimited access to all features',
  price: SUBSCRIPTION_CONFIG.price,
  currency: SUBSCRIPTION_CONFIG.currency,
  interval: 'monthly',
  features: [
    'Unlimited PDF processing',
    'Unlimited audio transcription', 
    'Unlimited YouTube video processing',
    'Unlimited course generation',
    'Unlimited notes and flashcards',
    'Priority support',
    'Export features',
  ],
} as const;

export const WEBHOOK_EVENTS = {
  SUBSCRIPTION_ACTIVE: 'subscription.active',
  SUBSCRIPTION_ON_HOLD: 'subscription.on_hold',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
  SUBSCRIPTION_RENEWED: 'subscription.renewed',
  SUBSCRIPTION_FAILED: 'subscription.failed',
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  PAYMENT_FAILED: 'payment.failed',
} as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS];