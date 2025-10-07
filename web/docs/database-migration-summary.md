# Database Schema Update - Subscription System

## Migration Summary

**Migration**: `20251007190641_add_subscription_remove_credits`

### Changes Applied ✅

#### Removed (Credit System)
- ❌ Dropped `creditBalance` column from `users` table
- ❌ Dropped `credit_usage` table completely
- ❌ Dropped `purchases` table completely

#### Added (Subscription System)
- ✅ Created `SubscriptionStatus` enum with values:
  - `PENDING` - Subscription created, payment pending
  - `ACTIVE` - Subscription active and user has access
  - `ON_HOLD` - Payment failed, subscription on hold
  - `CANCELLED` - Subscription has been cancelled
  - `FAILED` - Subscription creation failed
  - `EXPIRED` - Subscription expired

- ✅ Created `subscriptions` table with fields:
  - `id` - Primary key
  - `userId` - Unique foreign key to users table
  - `dodoSubscriptionId` - Unique Dodo Payments subscription ID
  - `productId` - Dodo product ID
  - `status` - Subscription status (default: PENDING)
  - `currentPeriodStart` - Billing period start date
  - `currentPeriodEnd` - Billing period end date
  - `nextBillingDate` - Next billing date
  - `cancelAtPeriodEnd` - Flag for cancellation at period end
  - `cancelledAt` - Cancellation timestamp
  - `trialEnd` - Trial period end date
  - `metadata` - Additional JSON metadata
  - `createdAt` - Record creation timestamp
  - `updatedAt` - Record update timestamp

#### Indexes Created
- `subscriptions_userId_key` - Unique index on userId
- `subscriptions_dodoSubscriptionId_key` - Unique index on dodoSubscriptionId
- `subscriptions_userId_idx` - Regular index for queries
- `subscriptions_dodoSubscriptionId_idx` - Regular index for Dodo sync
- `subscriptions_status_idx` - Index for status filtering

## User Model

### Before
```prisma
model User {
  id            String     @id
  email         String?
  creditBalance Int        @default(1000)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  purchases     Purchase[]
}
```

### After
```prisma
model User {
  id           String        @id
  email        String?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  subscription Subscription?
}
```

## Subscription Model

```prisma
model Subscription {
  id                 String             @id @default(cuid())
  userId             String             @unique
  dodoSubscriptionId String             @unique
  productId          String
  status             SubscriptionStatus @default(PENDING)
  
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  nextBillingDate    DateTime?
  
  cancelAtPeriodEnd  Boolean            @default(false)
  cancelledAt        DateTime?
  
  trialEnd           DateTime?
  metadata           Json?
  
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt
  
  user               User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([dodoSubscriptionId])
  @@index([status])
}
```

## Next Steps

1. ✅ Database schema updated
2. ⏭️ Create subscription service for database operations
3. ⏭️ Build API endpoints for subscription management
4. ⏭️ Implement webhook handlers
5. ⏭️ Update feature gates to check subscriptions
6. ⏭️ Build UI components

## Database Status

- Database is in sync with schema
- Prisma Client regenerated successfully
- All migrations applied cleanly
- No data loss warnings (tables were dropped as expected)