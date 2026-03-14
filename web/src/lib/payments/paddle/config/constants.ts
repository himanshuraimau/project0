// Paddle Billing configuration constants

export function getPaddleConfig() {
  return {
    apiKey: process.env.PADDLE_API_KEY!,
    webhookSecret: process.env.PADDLE_WEBHOOK_SECRET!,
    returnUrl: process.env.PADDLE_RETURN_URL!,
    clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
    environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || "sandbox",
    monthlyPriceId: process.env.NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID!,
    yearlyPriceId: process.env.NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID!,
  } as const;
}

// Proxy for lazy env var access (avoids build-time env var errors)
export const PADDLE_CONFIG = new Proxy(
  {} as ReturnType<typeof getPaddleConfig>,
  {
    get: (_target, prop) =>
      getPaddleConfig()[prop as keyof ReturnType<typeof getPaddleConfig>],
  },
);

// Subscription pricing configuration (same prices as before)
export const SUBSCRIPTION_CONFIG = {
  price: 1999, // $19.99 in cents
  currency: "USD",
  interval: "month",
  trialDays: 0,
} as const;

export const SUBSCRIPTION_CONFIG_YEARLY = {
  price: 8900, // $89.00 in cents
  currency: "USD",
  interval: "year",
  trialDays: 0,
} as const;

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

// Paddle webhook event type names
export const WEBHOOK_EVENTS = {
  SUBSCRIPTION_CREATED: "subscription.created",
  SUBSCRIPTION_ACTIVATED: "subscription.activated",
  SUBSCRIPTION_UPDATED: "subscription.updated",
  SUBSCRIPTION_PAST_DUE: "subscription.past_due",
  SUBSCRIPTION_PAUSED: "subscription.paused",
  SUBSCRIPTION_RESUMED: "subscription.resumed",
  SUBSCRIPTION_CANCELED: "subscription.canceled",
  SUBSCRIPTION_TRIALING: "subscription.trialing",
  SUBSCRIPTION_IMPORTED: "subscription.imported",
  TRANSACTION_CREATED: "transaction.created",
  TRANSACTION_UPDATED: "transaction.updated",
  TRANSACTION_COMPLETED: "transaction.completed",
  TRANSACTION_PAID: "transaction.paid",
} as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[keyof typeof WEBHOOK_EVENTS];
