-- Create enums for provider-aware billing and webhook idempotency
CREATE TYPE "BillingProvider" AS ENUM ('PADDLE', 'APP_STORE', 'PLAY_STORE', 'TEST_STORE', 'UNKNOWN');
CREATE TYPE "WebhookProvider" AS ENUM ('PADDLE', 'REVENUECAT');

-- Make Paddle-specific id nullable so non-Paddle rows can be mirrored too
ALTER TABLE "subscriptions"
  ALTER COLUMN "paddleSubscriptionId" DROP NOT NULL;

-- Add generic provider-aware subscription fields
ALTER TABLE "subscriptions"
  ADD COLUMN "billingProvider" "BillingProvider" NOT NULL DEFAULT 'PADDLE',
  ADD COLUMN "providerSubscriptionId" TEXT,
  ADD COLUMN "providerCustomerId" TEXT,
  ADD COLUMN "revenueCatAppUserId" TEXT,
  ADD COLUMN "revenueCatCustomerId" TEXT,
  ADD COLUMN "entitlementId" TEXT,
  ADD COLUMN "store" TEXT,
  ADD COLUMN "environment" TEXT,
  ADD COLUMN "managementUrl" TEXT;

-- Backfill existing rows as Paddle-backed subscriptions
UPDATE "subscriptions"
SET "billingProvider" = 'PADDLE'
WHERE "billingProvider" IS NULL;

-- Webhook idempotency table
CREATE TABLE "webhook_events" (
  "id" TEXT NOT NULL,
  "provider" "WebhookProvider" NOT NULL,
  "eventId" TEXT NOT NULL,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "webhook_events_provider_eventId_key"
  ON "webhook_events"("provider", "eventId");
