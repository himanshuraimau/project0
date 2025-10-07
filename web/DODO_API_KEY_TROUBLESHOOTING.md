# Dodo Payments 401 Error - API Key Troubleshooting Guide

## Problem
You're getting a **401 Unauthorized error** when trying to create subscriptions with Dodo Payments API.

## Root Cause
The API key in your `.env` file is either:
1. **Invalid** - Not recognized by Dodo Payments
2. **Expired** - The key has been revoked or expired
3. **Wrong Environment** - Using a live mode key in test mode (or vice versa)
4. **Truncated** - The key was not copied completely

## Solution Steps

### Step 1: Generate a New API Key

1. Go to **Dodo Payments Dashboard**: https://dashboard.dodopayments.com/
2. Log in with your account credentials
3. Navigate to **Settings** → **API Keys** (or Developer → API Keys)
4. You should see a section for **Test Mode** and **Live Mode** keys
5. Since your `.env` has `DODO_PAYMENTS_ENVIRONMENT=test_mode`, make sure you're in **TEST MODE**
6. Click **"Generate New API Key"** or **"Create API Key"**
7. **IMPORTANT**: Copy the FULL key immediately (it will only be shown once!)

### Step 2: Update Your Environment Variables

1. Open `/home/himanshu/code/project0/web/.env`
2. Find the line: `DODO_PAYMENTS_API_KEY=...`
3. Replace the entire value with your new API key
4. Make sure there are NO spaces, quotes, or extra characters
5. The format should be: `DODO_PAYMENTS_API_KEY=your_key_here`

Example:
```bash
DODO_PAYMENTS_API_KEY=ioKdsVd8xAn8jTIJ.HpHv-bm4zq6v96scESEZr_9DIt5qN9o_jdcbfIjiCxsoo5qE
```

### Step 3: Verify Product ID

While you're in the Dodo dashboard:

1. Navigate to **Products** section
2. Find your subscription product (should be $19.99/month)
3. Click on it to see details
4. Copy the **Product ID** (should start with `pdt_`)
5. Verify it matches: `NEXT_PUBLIC_DODO_PAYMENT_SUBSCRIPTION_ID=pdt_MbHgFif84poYbmhNKLQf8`

### Step 4: Restart Your Development Server

After updating the `.env` file:

```bash
# Stop your current dev server (Ctrl+C)
# Then restart it
cd /home/himanshu/code/project0/web
npm run dev
```

### Step 5: Test the Connection

Try creating a subscription again from your app. You should see detailed logs now.

## Additional Checks

### Check API Key Format
A valid Dodo Payments API key should:
- Start with a prefix (usually letters/numbers)
- Contain a dot (`.`)
- Have a long alphanumeric string after the dot
- Be around 60-80 characters total

Example format: `xxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyy`

### Check Environment Mode
Make sure your environment setting matches your API key:
- If using test keys → `DODO_PAYMENTS_ENVIRONMENT=test_mode`
- If using live keys → `DODO_PAYMENTS_ENVIRONMENT=live_mode`

### Verify Product Exists
Make sure the product `pdt_MbHgFif84poYbmhNKLQf8` exists in your Dodo dashboard:
1. It should be a **subscription product** (not one-time payment)
2. Price should be set to $19.99
3. Billing interval should be "Month"
4. Status should be "Active"

## Still Having Issues?

If you're still getting 401 errors after following all steps:

1. **Check Dodo Payments Status**: https://status.dodopayments.com/
2. **Contact Dodo Support**: support@dodopayments.com
3. **Check API Key Permissions**: Some keys may have restricted permissions
4. **Verify Account Status**: Ensure your Dodo Payments account is active

## Testing the Fix

After updating your API key, the logs should show:
```
Creating Dodo subscription with params: {
  email: 'user@example.com',
  productId: 'pdt_MbHgFif84poYbmhNKLQf8',
  environment: 'test_mode',
  hasApiKey: true,
  apiKeyLength: 75,  // Should be 60+ characters
  apiKeyPrefix: 'ioKdsVd8xAn8jTI...'
}
```

And the subscription should be created successfully without 401 errors.

## Quick Verification Script

You can verify your API key is working by checking if you can list products:
```bash
# In the Dodo dashboard, try the API explorer
# Or use their test endpoint to verify your key
```
