-- Add dodoCustomerId to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "dodo_customer_id" TEXT;
