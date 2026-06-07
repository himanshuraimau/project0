CREATE TYPE "BillingProvider" AS ENUM ('PADDLE', 'REVENUECAT');

ALTER TABLE "subscriptions" ADD COLUMN "provider" "BillingProvider" NOT NULL DEFAULT 'PADDLE';

ALTER TABLE "subscriptions" ALTER COLUMN "paddleSubscriptionId" DROP NOT NULL;

ALTER TABLE "subscriptions" ADD COLUMN "internal_plan_id" TEXT;

ALTER TABLE "subscriptions" ADD COLUMN "rc_original_transaction_id" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN "rc_product_id" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN "rc_store" TEXT;

CREATE INDEX "subscriptions_provider_status_idx" ON "subscriptions"("provider", "status");
CREATE INDEX "subscriptions_rc_original_transaction_id_idx" ON "subscriptions"("rc_original_transaction_id");
