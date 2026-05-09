# Billing Providers

This directory hosts the provider-agnostic billing layer.

## Overview

- `BillingOrchestrator` routes operations to the correct provider.
- `PaddleBillingProvider` handles web subscriptions.
- `RevenueCatBillingProvider` handles mobile IAP subscriptions via webhooks.
- `plan-mapping.ts` defines internal plan IDs and maps provider IDs.

## Plan Mapping

Internal plan IDs:

- `PRO_MONTHLY`
- `PRO_YEARLY`

Map them to external IDs using env vars:

- `NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID`
- `NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID`
- `REVENUECAT_MONTHLY_PRODUCT_ID`
- `REVENUECAT_YEARLY_PRODUCT_ID`

## RevenueCat Webhook

Set `REVENUECAT_WEBHOOK_SECRET` in the backend and configure it in the RevenueCat dashboard.
Webhook endpoint: `/api/webhook/revenuecat`.

## Sync Endpoint (Mobile)

Mobile calls `/api/subscription/sync-revenuecat` after purchases/restores to sync state.
This complements webhooks and ensures the backend stays the source of truth.
