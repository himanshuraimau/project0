-- Switch from Dodo Payments to Paddle Billing
-- Old Dodo subscriptions are no longer valid, so we clear them first.

-- 1. Delete all existing subscriptions (they are Dodo subscriptions, no longer usable)
DELETE FROM "subscriptions";

-- 2. Drop old Dodo indexes and unique constraints
DROP INDEX IF EXISTS "subscriptions_dodoSubscriptionId_idx";
DROP INDEX IF EXISTS "subscriptions_dodoSubscriptionId_key";

-- 3. Remove old Dodo columns
ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "dodoSubscriptionId";
ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "productId";
ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "dodoDiscountId";

-- 4. Add new Paddle columns
ALTER TABLE "subscriptions" ADD COLUMN "paddleSubscriptionId" TEXT NOT NULL;
ALTER TABLE "subscriptions" ADD COLUMN "priceId" TEXT NOT NULL;
ALTER TABLE "subscriptions" ADD COLUMN "paddleDiscountId" TEXT;

-- 5. Add unique constraint and indexes for Paddle
CREATE UNIQUE INDEX "subscriptions_paddleSubscriptionId_key" ON "subscriptions"("paddleSubscriptionId");
CREATE INDEX "subscriptions_paddleSubscriptionId_idx" ON "subscriptions"("paddleSubscriptionId");

-- 6. Rename dodo_customer_id to paddle_customer_id on users table
ALTER TABLE "users" RENAME COLUMN "dodo_customer_id" TO "paddle_customer_id";

-- 7. Update SubscriptionStatus enum: add PAUSED, PAST_DUE; remove ON_HOLD
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'PAUSED';
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'PAST_DUE';
-- Note: PostgreSQL does not support removing enum values directly.
-- ON_HOLD is no longer used but remains in the enum harmlessly.
