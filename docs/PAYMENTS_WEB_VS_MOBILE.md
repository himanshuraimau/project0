# Payments: web (Paddle) + mobile (RevenueCat) — how it works

**Is Paddle on web “good”?** Yes for this repo. Paddle is the **merchant of record** for web checkout (cards, tax, portal). RevenueCat does **not** replace Paddle on web; it **imports** Paddle subscriptions and maps them to **entitlements** so the same **Better Auth `user.id`** can unlock **mobile** (IAP) and **web** (DB + optional RC charts) consistently. You still implement checkout with Paddle.js; RevenueCat is configured separately (dashboard + webhooks + secret API for server sync).

---

## End-to-end architecture

| | **Web** | **Mobile** |
|---|---------|------------|
| **Checkout** | Paddle.js (`@paddle/paddle-js`) | Store IAP via `react-native-purchases` |
| **Billing** | Paddle Billing API + Paddle webhooks → your DB | Apple / Google; RevenueCat SDK |
| **RevenueCat role** | Import/sync Paddle purchases → RC subscriber; REST sync updates DB | Source of truth for **entitlement** on device |
| **Access on client** | `GET /api/subscription/status` + `use-subscription` cache | `CustomerInfo` → `SubscriptionContext` |
| **Server truth** | `Subscription` row: Paddle `paddleSubscriptionId` or RC-backed fields after sync | Same DB when RC webhooks hit your API |

**Shared rule:** `app_user_id` / Paddle `customData.userId` = **Better Auth user id** everywhere (`PaymentService.getCheckoutData`, mobile `Purchases.configure`).

---

## Web — environment variables (`web/.env`)

**Paddle (required for checkout & DB sync)**  
| Variable | Purpose |
|----------|---------|
| `PADDLE_API_KEY` | Server: subscriptions, portal, transaction lookup |
| `PADDLE_WEBHOOK_SECRET` | Verify `POST /api/webhook/paddle` |
| `PADDLE_RETURN_URL` | Default success return after checkout |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Paddle.js `initializePaddle` |
| `NEXT_PUBLIC_PADDLE_ENVIRONMENT` | `sandbox` or `production` |
| `NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID` / `NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID` | Catalog price IDs |

**RevenueCat (server sync + your webhook)**  
| Variable | Purpose |
|----------|---------|
| `REVENUECAT_SECRET_API_KEY` | `GET /v1/subscribers/{app_user_id}` in `syncRevenueCatSubscriber` |
| `REVENUECAT_WEBHOOK_AUTH` | Shared secret; must match header RevenueCat sends to your app |
| `REVENUECAT_ENTITLEMENT_ID` | Default `pro`; must match dashboard entitlement attached to products |

Optional: `REVENUECAT_API_BASE_URL` (default `https://api.revenuecat.com/v1`).

**No RevenueCat “public web SDK” env is required** for your current Next.js flow: web checkout stays Paddle-only; RC learns purchases via **Paddle→RevenueCat** (their integration) and/or **RevenueCat→your** webhook.

---

## Web — Paddle dashboard

1. **Webhook** pointing at your deployed app: `https://<your-domain>/api/webhook/paddle` with the secret that matches `PADDLE_WEBHOOK_SECRET`.  
2. **Products/prices** aligned with `NEXT_PUBLIC_PADDLE_*_PRICE_ID`.  
3. **Checkout / domains** per Paddle docs (approved payment domains for production).  
4. Checkout opened from your app already sends `customData`: `userId` and `revenuecat_app_user_id` (same value) — required for RevenueCat’s **custom App User ID** mapping.

---

## Web — RevenueCat dashboard

1. **Project** → **Apps & providers** → add **Paddle** configuration: paste Paddle **Billing API key** (sandbox vs production aligned with Paddle env).  
2. **Purchase tracking:** **Automatic**.  
3. **App user ID:** **Custom field** → metadata key **`userId`** (fallback: `revenuecat_app_user_id`).  
4. **Import/map** Paddle prices to RevenueCat **products** and attach your **entitlement** (same id as `REVENUECAT_ENTITLEMENT_ID`).  
5. **RevenueCat → your backend webhook:** URL `https://<your-domain>/api/webhook/revenuecat`, authorization matching `REVENUECAT_WEBHOOK_AUTH`. This runs `syncRevenueCatSubscriber` so Postgres stays aligned with RC for non-Paddle-native rows.

---

## Web — request flow (short)

1. User hits `/api/subscription/create` → `PaymentService.getCheckoutData` returns Paddle `clientToken`, `priceId`, `customData` (with `userId`).  
2. Client opens Paddle Checkout → Paddle charges and notifies **your** `/api/webhook/paddle` → creates/updates `Subscription` (Paddle path).  
3. RevenueCat receives Paddle events (their integration) → associates purchase with `userId` → may emit **RevenueCat webhooks** to you → `syncRevenueCatSubscriber` merges mirror fields / entitlements into the same user row where applicable.  
4. Client refreshes access via `/api/subscription/status` (Paddle fast-path or stored row).

---

## Mobile — environment variables (`mobile/.env`)

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_URL` | Your Next API base (`.../api`) |
| `EXPO_PUBLIC_RC_STORE_MODE` | `test` (Test Store) or `live` (store keys) |
| `EXPO_PUBLIC_RC_TEST_API_KEY` | Test Store public SDK key when in test mode |
| `EXPO_PUBLIC_RC_IOS_API_KEY` / `EXPO_PUBLIC_RC_ANDROID_API_KEY` | Live mode platform public SDK keys |
| `EXPO_PUBLIC_RC_ENTITLEMENT_ID` | Same entitlement id as web (`pro` by default) |
| `EXPO_PUBLIC_RC_DEFAULT_OFFERING_ID` | Usually `default` |

**Expo Go:** no native Purchases — use a **development build** (`npx expo run:ios` / EAS dev client). See `mobile/SETUP.md`.

---

## Mobile — request flow (short)

1. On login, `RevenueCatProvider` calls `Purchases.configure` / `logIn` with **session user id**.  
2. Paywall uses offerings → `purchasePackage` / `restorePurchases`.  
3. `SubscriptionContext` maps `CustomerInfo` to `hasAccess` (active entitlement, not just “row exists”).  
4. Optional: settings call `GET /subscription/status` to reconcile server `Subscription` (e.g. web Paddle row synced via RevenueCat). Manage/cancel for **store** subs uses App Store / Play or RevenueCat `managementURL`; web-only Paddle billing is managed on the website.

---

## Pitfalls (keep aligned)

- **Expired entitlements:** RC keeps lapsed entitlements in `all`; gate premium UI on **`hasAccess` / active entitlement**, not only `hasSubscription`.  
- **EAS builds:** `EXPO_PUBLIC_*` is baked at build time; use EAS env + `eas.json` profiles so test vs live keys match.  
- **One `Subscription` row per user:** avoid duplicate Paddle vs store conflicts; webhooks and provider fields should converge on one user id.

---

## Key files

| Area | Path |
|------|------|
| Paddle checkout payload + `customData` | `web/src/lib/payments/payment-service.ts` |
| Paddle webhook | `web/src/app/api/webhook/paddle/route.ts` |
| RevenueCat webhook + sync | `web/src/app/api/webhook/revenuecat/route.ts`, `web/src/lib/revenuecat/sync.ts` |
| Subscription status API | `web/src/app/api/subscription/status/route.ts` |
| Web subscription hook | `web/src/hooks/use-subscription.ts` |
| Mobile RC SDK + provider | `mobile/lib/revenuecat/sdk.ts`, `RevenueCatProvider.tsx` |
| Mobile subscription state | `mobile/lib/contexts/SubscriptionContext.tsx` |
| Example env | `web/.env.example`, `mobile/.env.example` |

Official references: [RevenueCat + Paddle](https://docs.revenuecat.com/docs/web/integrations/paddle), [Paddle custom data](https://developer.paddle.com/build/transactions/custom-data), [Paddle App User ID from notifications](https://docs.revenuecat.com/docs/platform-resources/server-notifications/paddle-server-notifications).
