# Dodo Payments Integration

Clean, organized integration with Dodo Payments for subscription management.

## Structure

```
dodo/
├── config/
│   ├── constants.ts    # Configuration constants and pricing
│   └── client.ts       # Dodo client initialization
├── services/
│   ├── subscription.ts # Subscription management service
│   └── webhooks.ts     # Webhook verification (Standard Webhooks)
├── types/
│   └── index.ts        # TypeScript type definitions
└── index.ts            # Main exports
```

## Usage

### Import from main entry point

```typescript
import { 
  DodoSubscriptionService,
  DodoWebhookService,
  DODO_CONFIG,
  type BillingInterval 
} from '@/lib/payments/dodo';
```

### Create a subscription

```typescript
const result = await DodoSubscriptionService.createSubscription({
  userId: 'user_123',
  userEmail: 'user@example.com',
  userName: 'John Doe',
  billingAddress: {
    city: 'San Francisco',
    country: 'US',
    state: 'CA',
    street: '123 Main St',
    zipcode: '94102',
  },
  billingInterval: 'monthly', // or 'yearly'
});
```

### Verify webhook signature

```typescript
const isValid = DodoWebhookService.verifyWebhookSignature(
  body,
  {
    'webhook-id': headers.get('webhook-id')!,
    'webhook-signature': headers.get('webhook-signature')!,
    'webhook-timestamp': headers.get('webhook-timestamp')!,
  },
  process.env.DODO_PAYMENTS_WEBHOOK_KEY!
);
```

## Features

- ✅ Clean folder structure
- ✅ Standard Webhooks verification
- ✅ Proper TypeScript types
- ✅ Subscription lifecycle management
- ✅ Automatic pending subscription cleanup via webhooks
- ✅ Payment link storage in metadata

## Configuration

Set these environment variables:

- `DODO_PAYMENTS_API_KEY` - Your API key
- `DODO_PAYMENTS_WEBHOOK_KEY` - Webhook secret key
- `DODO_PAYMENTS_RETURN_URL` - Return URL after payment
- `DODO_PAYMENTS_ENVIRONMENT` - `test_mode` or `live_mode`
- `NEXT_PUBLIC_DODO_PAYMENT_SUBSCRIPTION_ID` - Monthly product ID
- `NEXT_PUBLIC_DODO_PRODUCT_ID_PRO_SUBSCRIPTION_YEARLY` - Yearly product ID
