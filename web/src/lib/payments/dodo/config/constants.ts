// Dodo Payments configuration constants

/**
 * Get Dodo configuration (lazy evaluation to ensure env vars are loaded)
 */
export function getDodoConfig() {
  return {
    environment: process.env.DODO_PAYMENTS_ENVIRONMENT || "test_mode",
    apiKey: process.env.DODO_PAYMENTS_API_KEY!,
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY!,
    returnUrl: process.env.DODO_PAYMENTS_RETURN_URL!,
    subscriptionProductId:
      process.env.NEXT_PUBLIC_DODO_PAYMENT_SUBSCRIPTION_ID!,
    subscriptionProductIdYearly:
      process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO_SUBSCRIPTION_YEARLY!,
    baseUrl: "https://live.dodopayments.com",
  } as const;
}

// For backwards compatibility, export as DODO_CONFIG but with getter
export const DODO_CONFIG = new Proxy({} as ReturnType<typeof getDodoConfig>, {
  get: (target, prop) => {
    return getDodoConfig()[prop as keyof ReturnType<typeof getDodoConfig>];
  },
});

// Subscription pricing configuration
export const SUBSCRIPTION_CONFIG = {
  price: 1999, // $19.99 in cents
  currency: "USD",
  interval: "Month",
  trialDays: 0, // No trial period - matches Dodo product settings
} as const;

export const SUBSCRIPTION_CONFIG_YEARLY = {
  price: 8900, // $89.00 in cents
  currency: "USD",
  interval: "Year",
  trialDays: 0,
} as const;

// Subscription plan details
export const SUBSCRIPTION_PLAN = {
  id: "pro-monthly",
  name: "Pro Plan",
  description: "Unlimited access to all features",
  price: SUBSCRIPTION_CONFIG.price,
  currency: SUBSCRIPTION_CONFIG.currency,
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
} as const;

export const SUBSCRIPTION_PLAN_YEARLY = {
  id: "pro-yearly",
  name: "Pro Plan (Yearly)",
  description: "Unlimited access to all features - Save with annual billing",
  price: SUBSCRIPTION_CONFIG_YEARLY.price,
  currency: SUBSCRIPTION_CONFIG_YEARLY.currency,
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
} as const;

// Payment method types supported by Dodo Payments
export const PAYMENT_METHOD_TYPES = {
  // Card payments
  CREDIT: 'credit',
  DEBIT: 'debit',
  // Digital wallets
  APPLE_PAY: 'apple_pay',
  GOOGLE_PAY: 'google_pay',
  AMAZON_PAY: 'amazon_pay',
  CASH_APP_PAY: 'cashapp_pay',
  REVOLUT_PAY: 'revolut_pay',
  // India-specific
  UPI_COLLECT: 'upi_collect',
  // Europe-specific
  IDEAL: 'ideal',
  BANCONTACT: 'bancontact_card',
  EPS: 'eps',
  MULTIBANCO: 'multibanco',
  // BNPL
  KLARNA: 'klarna',
  AFTERPAY: 'afterpay',
} as const;

export type PaymentMethodType = (typeof PAYMENT_METHOD_TYPES)[keyof typeof PAYMENT_METHOD_TYPES];

// Regional payment configurations
export const REGIONAL_PAYMENT_CONFIG = {
  // India: UPI + Google Pay + Cards (requires INR and billing country IN)
  IN: {
    currency: 'INR',
    country: 'IN',
    paymentMethods: [
      PAYMENT_METHOD_TYPES.UPI_COLLECT,
      PAYMENT_METHOD_TYPES.GOOGLE_PAY,
      PAYMENT_METHOD_TYPES.CREDIT,
      PAYMENT_METHOD_TYPES.DEBIT,
    ] as PaymentMethodType[],
  },
  // US: Cards + Digital Wallets
  US: {
    currency: 'USD',
    country: 'US',
    paymentMethods: [
      PAYMENT_METHOD_TYPES.CREDIT,
      PAYMENT_METHOD_TYPES.DEBIT,
      PAYMENT_METHOD_TYPES.APPLE_PAY,
      PAYMENT_METHOD_TYPES.GOOGLE_PAY,
    ] as PaymentMethodType[],
  },
  // Default: Cards + Google Pay
  DEFAULT: {
    currency: 'USD',
    country: undefined,
    paymentMethods: [
      PAYMENT_METHOD_TYPES.CREDIT,
      PAYMENT_METHOD_TYPES.DEBIT,
      PAYMENT_METHOD_TYPES.GOOGLE_PAY,
    ] as PaymentMethodType[],
  },
} as const;

// Test UPI IDs for testing in test_mode
export const TEST_UPI_IDS = {
  SUCCESS: 'success@upi',
  FAILURE: 'failure@upi',
} as const;

// Webhook event types
export const WEBHOOK_EVENTS = {
  SUBSCRIPTION_ACTIVE: "subscription.active",
  SUBSCRIPTION_UPDATED: "subscription.updated",
  SUBSCRIPTION_ON_HOLD: "subscription.on_hold",
  SUBSCRIPTION_RENEWED: "subscription.renewed",
  SUBSCRIPTION_PLAN_CHANGED: "subscription.plan_changed",
  SUBSCRIPTION_CANCELLED: "subscription.cancelled",
  SUBSCRIPTION_FAILED: "subscription.failed",
  SUBSCRIPTION_EXPIRED: "subscription.expired",
  SUBSCRIPTION_CREATED: "subscription.created",
  PAYMENT_SUCCEEDED: "payment.succeeded",
  PAYMENT_FAILED: "payment.failed",
} as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[keyof typeof WEBHOOK_EVENTS];
