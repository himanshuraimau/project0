# Subscription System Implementation Plan

## Overview

This document outlines the implementation plan to migrate from the current credit-based system to a simple subscription-based model using Dodo Payments. The plan focuses on a single subscription tier at $19.99/month with unlimited access to all features.

## Current State Analysis

### Environment Variables Available
```env
DODO_PAYMENTS_API_KEY=fvjo2yf2ZUeeEx2l.ZLnEFi6ZzGA0tqejECGjB2JPl4VRXLmZh9B-y4wr0f_YTAzR
DODO_PAYMENTS_WEBHOOK_KEY=whsec_3WhSPPf291jcN6e59M5KXY5MM4WBqRWZ
DODO_PAYMENTS_RETURN_URL=https://binate-nonperceptively-celestina.ngrok-free.dev/dashboard?payment=success
DODO_PAYMENTS_ENVIRONMENT=test_mode
NEXT_PUBLIC_DODO_PAYMENT_SUBSCRIPTION_ID="pdt_MbHgFif84poYbmhNKLQf8"
```

### Subscription Plan Structure
- **Single Plan**: Pro Plan
- **Price**: $19.99/month
- **Product ID**: `pdt_MbHgFif84poYbmhNKLQf8` (from environment)
- **Features**: Unlimited access to all application features

## Implementation Strategy

### Phase 1: Core Infrastructure Setup

#### 1.1 Database Schema Updates

**New Tables:**
```prisma
model Subscription {
  id                String            @id @default(cuid())
  userId            String            @unique
  subscriptionId    String            @unique // Dodo subscription ID
  productId         String            // Dodo product ID
  status            SubscriptionStatus @default(PENDING)
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  cancelAtPeriodEnd  Boolean          @default(false)
  trialEnd          DateTime?
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
  user              User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("subscriptions")
}

enum SubscriptionStatus {
  PENDING
  ACTIVE
  ON_HOLD
  CANCELLED
  FAILED
  EXPIRED
}
```

**User Table Updates:**
```prisma
model User {
  id            String        @id
  email         String?
  creditBalance Int           @default(1000) // Keep during transition
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  purchases     Purchase[]    // Keep during transition
  subscription  Subscription? // New subscription relation
  
  @@map("users")
}
```

#### 1.2 Dodo Utils Setup

**Create `/src/lib/utils/dodo/` folder structure:**
```
dodo/
├── client.ts           # Dodo Payments client setup
├── subscription.ts     # Subscription management service
├── webhooks.ts         # Webhook handling
├── types.ts           # TypeScript types
└── constants.ts       # Configuration constants
```

#### 1.3 Services Architecture

**Subscription Service (`/src/lib/subscription-service.ts`):**
- User subscription management
- Feature access control
- Subscription status tracking

**Feature Gate Service (`/src/lib/feature-gate-service.ts`):**
- Replace credit checks with subscription checks
- Simple boolean access control

### Phase 2: Dodo Integration Implementation

#### 2.1 Dodo Payments Client Setup

**File: `/src/lib/utils/dodo/client.ts`**
```typescript
import DodoPayments from 'dodopayments';

export const dodoClient = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
});

export const DODO_CONFIG = {
  environment: process.env.DODO_PAYMENTS_ENVIRONMENT || 'test_mode',
  productId: process.env.NEXT_PUBLIC_DODO_PAYMENT_SUBSCRIPTION_ID!,
  returnUrl: process.env.DODO_PAYMENTS_RETURN_URL!,
} as const;
```

#### 2.2 Subscription Management

**File: `/src/lib/utils/dodo/subscription.ts`**
- Create subscription
- Retrieve subscription details
- Cancel subscription
- Handle subscription updates

#### 2.3 Webhook Implementation

**File: `/src/lib/utils/dodo/webhooks.ts`**
- Handle subscription events:
  - `subscription.active`
  - `subscription.on_hold` 
  - `subscription.cancelled`
  - `subscription.renewed`
  - `subscription.failed`

### Phase 3: API Endpoints Development

#### 3.1 New Subscription Endpoints

```typescript
// Subscription Management
GET    /api/subscription/status        # Get user's subscription status
POST   /api/subscription/create        # Create new subscription
POST   /api/subscription/cancel        # Cancel subscription
GET    /api/subscription/portal        # Billing portal access

// Feature Access (replaces credit checks)
GET    /api/subscription/access        # Check feature access
```

#### 3.2 Webhook Endpoint

```typescript
POST   /api/webhook/dodo-subscription  # Handle Dodo subscription webhooks
```

### Phase 4: Frontend Implementation

#### 4.1 New Components

**Subscription Status Display:**
- Replace credit display component
- Show subscription status and billing date
- Quick access to manage subscription

**Pricing Page:**
- Simple single-plan pricing
- Clear value proposition
- Direct subscription flow

**Subscription Management:**
- Cancel subscription
- View billing information
- Download invoices

#### 4.2 Feature Gate Updates

**Replace credit checks:**
```typescript
// Before (Credit System)
const hasCredits = await checkCreditsAndRedirect(1);
if (hasCredits) {
  // Process action
}

// After (Subscription System)
const hasSubscription = await checkSubscriptionAccess();
if (!hasSubscription) {
  redirect('/pricing');
  return;
}
// Process action (no credit deduction needed)
```

### Phase 5: Migration Strategy

#### 5.1 User Migration Approach

**Free Users (0-50 credits):**
- Show subscription prompt
- 7-day free trial offer

**Active Users (50+ credits):**
- Automatic 30-day free trial
- Email notification about transition

**Heavy Users (500+ credits):**
- 60-day free trial
- Priority migration support

#### 5.2 Transition Period

**Week 1-2: Parallel System**
- Both credit and subscription systems active
- New users default to subscription
- Feature flags control access

**Week 3-4: Migration Push**
- In-app prompts for existing users
- Email campaigns
- Migration incentives

**Week 5-6: Credit System Deprecation**
- Stop new credit purchases
- Show sunset notices
- Force migration for active users

**Week 7-8: Complete Migration**
- Remove credit system
- All users on subscription model

## Implementation Timeline

### Week 1-2: Foundation
- [ ] Create database migrations
- [ ] Set up Dodo utils folder structure
- [ ] Implement basic subscription service
- [ ] Create webhook handling

### Week 3-4: API Development
- [ ] Build subscription management endpoints
- [ ] Replace credit validation with subscription checks
- [ ] Test webhook integration
- [ ] Create migration scripts

### Week 5-6: Frontend Implementation
- [ ] Build subscription status components
- [ ] Create pricing page
- [ ] Update feature gates
- [ ] Add subscription management UI

### Week 7-8: Testing & Migration
- [ ] Comprehensive testing
- [ ] User migration scripts
- [ ] Communication to users
- [ ] Go-live preparation

### Week 9-10: Launch & Cleanup
- [ ] Launch subscription system
- [ ] Monitor user adoption
- [ ] Deprecate credit system
- [ ] Clean up old code

## Technical Implementation Details

### Database Migration Script

```sql
-- Add subscription table
CREATE TABLE "subscriptions" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT UNIQUE NOT NULL,
  "subscriptionId" TEXT UNIQUE NOT NULL,
  "productId" TEXT NOT NULL,
  "status" TEXT DEFAULT 'PENDING',
  "currentPeriodStart" TIMESTAMP,
  "currentPeriodEnd" TIMESTAMP,
  "cancelAtPeriodEnd" BOOLEAN DEFAULT false,
  "trialEnd" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Add subscription status enum
CREATE TYPE "SubscriptionStatus" AS ENUM (
  'PENDING',
  'ACTIVE', 
  'ON_HOLD',
  'CANCELLED',
  'FAILED',
  'EXPIRED'
);
```

### Environment Variables Needed

```env
# Already configured
DODO_PAYMENTS_API_KEY=fvjo2yf2ZUeeEx2l.ZLnEFi6ZzGA0tqejECGjB2JPl4VRXLmZh9B-y4wr0f_YTAzR
DODO_PAYMENTS_WEBHOOK_KEY=whsec_3WhSPPf291jcN6e59M5KXY5MM4WBqRWZ
DODO_PAYMENTS_RETURN_URL=https://binate-nonperceptively-celestina.ngrok-free.dev/dashboard?payment=success
DODO_PAYMENTS_ENVIRONMENT=test_mode
NEXT_PUBLIC_DODO_PAYMENT_SUBSCRIPTION_ID="pdt_MbHgFif84poYbmhNKLQf8"

# Additional needed
NEXT_PUBLIC_APP_URL=https://your-domain.com
SUBSCRIPTION_PRICE=1999  # $19.99 in cents
```

### Key Features to Implement

#### Subscription Creation Flow
1. User clicks "Subscribe" on pricing page
2. Create Dodo subscription with payment link
3. Redirect user to Dodo payment page
4. Handle webhook to activate subscription
5. Redirect back to dashboard

#### Feature Access Control
```typescript
export class FeatureGateService {
  static async canAccessFeature(userId: string): Promise<boolean> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });
    
    return subscription?.status === 'ACTIVE';
  }
}
```

#### Subscription Management
- View current subscription status
- Cancel subscription (remains active until period end)
- Reactivate cancelled subscription
- Access billing portal through Dodo

## Success Metrics

### Business Metrics
- **Target**: 70% of active users migrate to subscription
- **Revenue**: Predictable monthly recurring revenue
- **Churn**: <10% monthly churn rate

### Technical Metrics
- **Performance**: <2s subscription check response time
- **Reliability**: 99.9% webhook processing success
- **Error Rate**: <1% subscription creation failures

### User Experience Metrics
- **Migration**: >80% successful self-migration
- **Support**: <5% subscription-related support tickets
- **Satisfaction**: >4.5/5 subscription experience rating

## Risk Mitigation

### Technical Risks
- **Webhook Failures**: Implement retry logic and manual reconciliation
- **Payment Processing**: Use Dodo's reliable infrastructure
- **Database Migration**: Comprehensive testing and rollback plans

### Business Risks
- **User Churn**: Generous trial periods and migration incentives
- **Revenue Drop**: Grandfathering active users with extended trials
- **Support Load**: Clear documentation and self-service options

### User Experience Risks
- **Confusion**: Clear communication and in-app guidance
- **Feature Access**: Graceful degradation and clear upgrade prompts
- **Billing Issues**: Direct integration with Dodo's billing portal

## Post-Launch Optimizations

### Month 1: Stabilization
- Monitor subscription metrics
- Fix any migration issues
- Optimize user onboarding flow

### Month 2-3: Enhancement
- Add annual subscription option (discount)
- Implement usage analytics
- A/B test pricing and messaging

### Month 4-6: Growth
- Referral program
- Team/family plans
- Enterprise features

## Conclusion

This implementation plan provides a clear roadmap to migrate from the credit system to a simple, effective subscription model. The focus on a single $19.99/month plan simplifies both implementation and user experience while providing predictable revenue and unlimited feature access.

The phased approach ensures minimal disruption to existing users while the comprehensive testing and migration strategy reduces risks. The timeline is aggressive but achievable with focused development effort.

Next steps: Begin with Phase 1 database setup and Dodo utils implementation.