# API Keys & Environment Setup Guide

This guide will help you configure all the necessary API keys and environment variables for the billing system.

---

## 🔑 Required API Keys & Setup

### 1. **Paddle (Web Payments)** 🌊

Paddle handles all web subscription payments.

#### Get Your Keys:
1. Sign up at [https://paddle.com](https://paddle.com)
2. Choose **Sandbox** for testing or **Production** for live
3. Go to **Developer Tools** → **Authentication**
4. Copy your **API Key** and **Client Token**
5. Go to **Developer Tools** → **Notifications** → **Webhook Secret**

#### Create Products:
1. Go to **Catalog** → **Products**
2. Create two products:
   - **Pro Monthly** ($19/month)
   - **Pro Yearly** ($89/year or your pricing)
3. Copy the **Price IDs** for each

#### Setup Webhook:
1. Go to **Developer Tools** → **Notifications**
2. Add webhook URL: `https://yourdomain.com/api/webhook/paddle`
3. Select all subscription events
4. Copy the **Webhook Secret**

#### Environment Variables (`web/.env`):
```bash
# Paddle API (Server-side)
PADDLE_API_KEY=your_paddle_api_key_here
PADDLE_WEBHOOK_SECRET=your_paddle_webhook_secret_here
PADDLE_RETURN_URL=https://yourdomain.com/dashboard

# Paddle Client (Public - for checkout)
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=your_paddle_client_token_here
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox  # or "production"
NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID=pri_01xxxxx  # Your monthly price ID
NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID=pri_01xxxxx   # Your yearly price ID
```

---

### 2. **RevenueCat (Mobile IAP)** 📱

RevenueCat handles Apple App Store and Google Play subscriptions.

#### Get Your Keys:
1. Sign up at [https://revenuecat.com](https://revenuecat.com)
2. Create a new project
3. Go to **Apps** → Add your iOS/Android app
4. Go to **API Keys** → Copy your **Public SDK Keys**
5. Go to **API Keys** → Create a **Secret API Key** (for server)

#### Setup Products:
1. Create products in App Store Connect / Google Play Console
2. In RevenueCat, go to **Products**
3. Add your product IDs:
   - Monthly: e.g., `pro_monthly`
   - Yearly: e.g., `pro_yearly`
4. Create an **Entitlement** (e.g., `pro`)
5. Attach both products to the entitlement

#### Setup Webhook:
1. Go to **Integrations** → **Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/webhook/revenuecat`
3. Set **Authorization**: `Bearer your_secret_here` (choose any secret)
4. Select all events

#### Setup Paddle Integration (Optional but Recommended):
1. Go to **Integrations** → **Paddle**
2. Enter your Paddle API key
3. This syncs web subscriptions to RevenueCat for unified analytics

#### Environment Variables:

**Backend (`web/.env`):**
```bash
# RevenueCat Server API
REVENUECAT_SECRET_API_KEY=sk_xxxxxxxxxxxxx
REVENUECAT_WEBHOOK_SECRET=your_chosen_webhook_secret
REVENUECAT_ENTITLEMENT_ID=pro
REVENUECAT_MONTHLY_PRODUCT_ID=pro_monthly
REVENUECAT_YEARLY_PRODUCT_ID=pro_yearly
REVENUECAT_ENVIRONMENT=sandbox  # or "production"
```

**Mobile (`mobile/.env`):**
```bash
# RevenueCat SDK (Public keys)
EXPO_PUBLIC_RC_STORE_MODE=test  # or "live"
EXPO_PUBLIC_RC_TEST_API_KEY=appl_xxxxxxxxxxxxx  # Test Store key
EXPO_PUBLIC_RC_IOS_API_KEY=appl_xxxxxxxxxxxxx   # iOS production key
EXPO_PUBLIC_RC_ANDROID_API_KEY=goog_xxxxxxxxxxxxx  # Android production key
EXPO_PUBLIC_RC_ENTITLEMENT_ID=pro
EXPO_PUBLIC_RC_DEFAULT_OFFERING_ID=default
```

---

### 3. **Database (Neon PostgreSQL)** 🗄️

Your Prisma database connection.

#### Get Your Connection String:
1. Go to your Neon dashboard: [https://neon.tech](https://neon.tech)
2. Select your project
3. Go to **Connection Details**
4. Copy the **Connection String**
5. Make sure the database is **not paused** (check status)

#### Environment Variables (`web/.env`):
```bash
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

#### Deploy Migrations:
Once your database is accessible:
```bash
cd web
npx prisma migrate deploy
npx prisma generate
```

---

### 4. **Apple Sign-In (Optional)** 🍎

Only needed if you want Apple authentication.

#### Get Your Key:
1. Go to [Apple Developer](https://developer.apple.com)
2. Go to **Certificates, Identifiers & Profiles**
3. Create a **Key** with **Sign in with Apple** enabled
4. Download the `.p8` file
5. Convert to PKCS8 format:
```bash
openssl pkcs8 -topk8 -inform PEM -outform PEM -in AuthKey_XXXXX.p8 -out apple_private_key.pem -nocrypt
```
6. Copy the entire content (including BEGIN/END lines)

#### Environment Variables (`web/.env`):
```bash
APPLE_CLIENT_ID=com.yourapp.service
APPLE_TEAM_ID=XXXXXXXXXX
APPLE_KEY_ID=XXXXXXXXXX
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
-----END PRIVATE KEY-----"
```

---

## 📋 Complete Environment File Templates

### `web/.env` (Backend)
```bash
# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Paddle (Web Payments)
PADDLE_API_KEY=your_paddle_api_key
PADDLE_WEBHOOK_SECRET=your_paddle_webhook_secret
PADDLE_RETURN_URL=https://yourdomain.com/dashboard
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=your_paddle_client_token
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID=pri_01xxxxx
NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID=pri_01xxxxx

# RevenueCat (Mobile IAP - Server)
REVENUECAT_SECRET_API_KEY=sk_xxxxxxxxxxxxx
REVENUECAT_WEBHOOK_SECRET=your_chosen_secret
REVENUECAT_ENTITLEMENT_ID=pro
REVENUECAT_MONTHLY_PRODUCT_ID=pro_monthly
REVENUECAT_YEARLY_PRODUCT_ID=pro_yearly
REVENUECAT_ENVIRONMENT=sandbox

# Apple Sign-In (Optional)
APPLE_CLIENT_ID=com.yourapp.service
APPLE_TEAM_ID=XXXXXXXXXX
APPLE_KEY_ID=XXXXXXXXXX
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Other services (your existing keys)
BETTER_AUTH_SECRET=your_auth_secret
BETTER_AUTH_URL=https://yourdomain.com
# ... other keys
```

### `mobile/.env` (Mobile App)
```bash
# API
EXPO_PUBLIC_API_URL=https://yourdomain.com/api

# RevenueCat SDK
EXPO_PUBLIC_RC_STORE_MODE=test
EXPO_PUBLIC_RC_TEST_API_KEY=appl_xxxxxxxxxxxxx
EXPO_PUBLIC_RC_IOS_API_KEY=appl_xxxxxxxxxxxxx
EXPO_PUBLIC_RC_ANDROID_API_KEY=goog_xxxxxxxxxxxxx
EXPO_PUBLIC_RC_ENTITLEMENT_ID=pro
EXPO_PUBLIC_RC_DEFAULT_OFFERING_ID=default

# Other mobile config
# ... other keys
```

---

## 🧪 Testing Your Setup

### 1. Test Paddle (Web)
```bash
cd web
bun run dev
```
- Visit `/pricing`
- Click "Subscribe"
- Complete checkout in Paddle sandbox
- Check webhook logs: `tail -f logs/paddle-webhook.log`

### 2. Test RevenueCat (Mobile)
```bash
cd mobile
npx expo run:ios  # or run:android
```
- Open paywall
- Purchase with Test Store or sandbox account
- Check webhook logs: `tail -f logs/revenuecat-webhook.log`

### 3. Test Database
```bash
cd web
npx prisma studio
```
- Check `Subscription` table for new entries
- Verify `provider` field is set correctly

---

## 🚨 Common Issues & Solutions

### Issue: "Paddle webhook signature invalid"
**Solution:** Make sure `PADDLE_WEBHOOK_SECRET` matches exactly what's in your Paddle dashboard.

### Issue: "RevenueCat webhook unauthorized"
**Solution:** Check that your webhook Authorization header is `Bearer YOUR_SECRET` and matches `REVENUECAT_WEBHOOK_SECRET`.

### Issue: "Database connection failed (P1001)"
**Solution:** 
1. Check your Neon dashboard - database might be paused
2. Verify connection string is correct
3. Ensure `?sslmode=require` is in the URL

### Issue: "RevenueCat SDK not configured"
**Solution:** Make sure you're using a development build, not Expo Go. Run `npx expo run:ios` instead.

### Issue: "Apple Sign-In key invalid"
**Solution:** Ensure the private key is in PKCS8 format and includes the BEGIN/END lines.

---

## ✅ Verification Checklist

Before going to production:

- [ ] Paddle sandbox checkout works
- [ ] Paddle webhook receives events
- [ ] RevenueCat Test Store purchase works
- [ ] RevenueCat webhook receives events
- [ ] Database migrations deployed
- [ ] Subscriptions appear in database
- [ ] Web subscription unlocks features
- [ ] Mobile subscription unlocks features
- [ ] Cross-platform: web sub works on mobile
- [ ] Cross-platform: mobile sub works on web
- [ ] Cancel/reactivate works
- [ ] Plan changes work
- [ ] Webhook secrets are secure
- [ ] Production keys ready (when switching from sandbox)

---

## 🔄 Switching to Production

When ready for production:

1. **Paddle:**
   - Change `NEXT_PUBLIC_PADDLE_ENVIRONMENT=production`
   - Use production API key and price IDs
   - Update webhook URL to production domain

2. **RevenueCat:**
   - Change `EXPO_PUBLIC_RC_STORE_MODE=live`
   - Use production SDK keys
   - Change `REVENUECAT_ENVIRONMENT=production`
   - Update webhook URL to production domain

3. **Database:**
   - Use production database URL
   - Run migrations on production DB

4. **Test Everything Again** in production mode!

---

## 📞 Support Resources

- **Paddle Docs:** https://developer.paddle.com
- **RevenueCat Docs:** https://docs.revenuecat.com
- **Neon Docs:** https://neon.tech/docs
- **Your Implementation:** See `docs/PAYMENTS_WEB_VS_MOBILE.md`

---

**Need help?** Check the implementation status in `BILLING_IMPLEMENTATION_STATUS.md`
