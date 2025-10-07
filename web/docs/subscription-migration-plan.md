# Migration Plan: Credit System to Subscription Model

## Overview

This document outlines a comprehensive plan to migrate from the current credit-based system to a subscription-based model. The migration will preserve user data while introducing recurring billing and feature-based access controls.

## Current System Analysis

### Problems with Credit System
1. **User Experience**: Users must repeatedly purchase credits
2. **Predictable Revenue**: One-time purchases don't provide recurring revenue
3. **Feature Limitation**: Users may avoid features due to credit costs
4. **Complexity**: Credit tracking adds complexity to every feature
5. **Support Overhead**: Credit-related support requests
6. **Usage Patterns**: Users may hoard credits or feel pressured to use them

### Benefits of Subscription Model
1. **Predictable Revenue**: Monthly/yearly recurring billing
2. **Better UX**: Unlimited usage within subscription tier
3. **Simplified Architecture**: No credit tracking per action
4. **Higher Engagement**: Users more likely to use all features
5. **Scalable Pricing**: Easier to add new tiers and features

## Proposed Subscription Tiers

### Tier Structure

#### Free Tier
- **Price**: $0/month
- **Features**:
  - 5 notes per month
  - Basic PDF processing
  - Basic note generation
  - Community support
- **Limitations**:
  - No course generation
  - No premium features
  - Limited file size

#### Pro Tier
- **Price**: $9.99/month or $99/year
- **Features**:
  - Unlimited notes
  - All file types (PDF, audio, video)
  - Course generation
  - Premium note templates
  - Priority support
  - Export features
- **Target**: Individual users and students

#### Team Tier
- **Price**: $19.99/month or $199/year
- **Features**:
  - Everything in Pro
  - Team collaboration
  - Shared workspaces
  - Team analytics
  - Admin controls
  - SSO (future)
- **Target**: Small teams and organizations

#### Enterprise Tier
- **Price**: Custom pricing
- **Features**:
  - Everything in Team
  - Custom integrations
  - Advanced analytics
  - Dedicated support
  - Custom limits
  - On-premise options
- **Target**: Large organizations

## Database Schema Changes

### New Tables

#### Subscription Model
```prisma
model Subscription {
  id                String            @id @default(cuid())
  userId            String            @unique
  planId            String
  status            SubscriptionStatus @default(ACTIVE)
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelAtPeriodEnd  Boolean          @default(false)
  trialEnd          DateTime?
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
  user              User             @relation(fields: [userId], references: [id])
  plan              SubscriptionPlan @relation(fields: [planId], references: [id])
  
  @@map("subscriptions")
}

enum SubscriptionStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
  UNPAID
  INCOMPLETE
  INCOMPLETE_EXPIRED
}

model SubscriptionPlan {
  id              String         @id @default(cuid())
  name            String
  description     String?
  price           Int            // Monthly price in cents
  yearlyPrice     Int?           // Yearly price in cents
  features        Json           // Feature flags and limits
  isActive        Boolean        @default(true)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  subscriptions   Subscription[]
  
  @@map("subscription_plans")
}
```

#### Usage Tracking (for analytics)
```prisma
model UsageMetrics {
  id        String   @id @default(cuid())
  userId    String
  feature   String   // e.g., "note_generation", "pdf_processing"
  count     Int      @default(1)
  date      DateTime @default(now())
  metadata  Json?    // Additional data
  
  @@unique([userId, feature, date])
  @@map("usage_metrics")
}
```

### Modified Tables

#### User Model Updates
```prisma
model User {
  id            String        @id
  email         String?
  creditBalance Int           @default(1000) // Keep for migration
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  purchases     Purchase[]    // Keep for migration
  subscription  Subscription? // New subscription relation
  
  @@map("users")
}
```

## Feature Access Control

### New Service: Subscription Service

```typescript
// /src/lib/subscription-service.ts

export interface SubscriptionFeatures {
  notesPerMonth: number | 'unlimited'
  courseGeneration: boolean
  premiumTemplates: boolean
  teamFeatures: boolean
  prioritySupport: boolean
  exportFeatures: boolean
  maxFileSize: number // in MB
  analytics: boolean
}

export class SubscriptionService {
  // Check if user can access feature
  static async canAccessFeature(userId: string, feature: string): Promise<boolean>
  
  // Get user's subscription status
  static async getUserSubscription(userId: string): Promise<Subscription | null>
  
  // Get available features for user
  static async getUserFeatures(userId: string): Promise<SubscriptionFeatures>
  
  // Check usage limits
  static async checkUsageLimit(userId: string, feature: string): Promise<boolean>
  
  // Record feature usage
  static async recordUsage(userId: string, feature: string, metadata?: any): Promise<void>
}
```

### Feature Gates

Replace credit checks with subscription checks:

```typescript
// Before (Credit System)
const hasCredits = await checkCreditsAndRedirect(1);
if (hasCredits) {
  // Process action
}

// After (Subscription System)
const canAccess = await SubscriptionService.canAccessFeature(userId, 'note_generation');
if (!canAccess) {
  redirect('/upgrade?feature=note_generation');
  return;
}

const withinLimits = await SubscriptionService.checkUsageLimit(userId, 'note_generation');
if (!withinLimits) {
  redirect('/upgrade?reason=limit_exceeded');
  return;
}

// Process action
await SubscriptionService.recordUsage(userId, 'note_generation');
```

## Migration Strategy

### Phase 1: Preparation (Week 1-2)

1. **Database Setup**
   - Create new subscription tables
   - Set up subscription plans
   - Add subscription service

2. **Payment Provider Setup**
   - Configure Stripe for recurring billing
   - Set up webhook endpoints
   - Create subscription products

3. **Feature Flag System**
   - Implement feature toggles
   - Allow gradual rollout
   - A/B testing capability

### Phase 2: Parallel System (Week 3-4)

1. **Dual System Support**
   - Both credit and subscription systems active
   - New users default to subscription
   - Existing users continue with credits

2. **Migration Tools**
   - Admin panel for manual migrations
   - Bulk migration scripts
   - User self-migration option

3. **Credit Conversion**
   - Convert remaining credits to subscription time
   - Calculate fair conversion rates
   - Provide clear communication to users

### Phase 3: User Migration (Week 5-8)

1. **Communication Campaign**
   - Email notifications to existing users
   - In-app banners and modals
   - Migration incentives (extra trial time)

2. **Automatic Migration**
   - Migrate users based on usage patterns
   - Free tier for low-usage users
   - Pro tier for active users with credit balance

3. **Credit System Deprecation**
   - Stop new credit purchases
   - Show migration prompts
   - Set credit expiration dates

### Phase 4: Cleanup (Week 9-10)

1. **Remove Credit System**
   - Remove credit-related UI components
   - Clean up API endpoints
   - Archive credit data

2. **Optimize New System**
   - Performance improvements
   - User feedback implementation
   - Analytics setup

## API Changes

### New Endpoints

```typescript
// Subscription Management
GET    /api/subscription/current
POST   /api/subscription/create
PUT    /api/subscription/update
DELETE /api/subscription/cancel

// Feature Access
GET    /api/subscription/features
POST   /api/subscription/check-access
POST   /api/subscription/record-usage

// Plans
GET    /api/subscription/plans
GET    /api/subscription/plans/:id

// Billing
GET    /api/subscription/billing-portal
POST   /api/subscription/upgrade
POST   /api/subscription/downgrade
```

### Modified Endpoints

Remove credit validation from existing endpoints and replace with subscription checks:

```typescript
// Example: PDF Processing
// Before
export async function POST(request: NextRequest) {
  const hasCredits = await UserService.hasEnoughCredits(userId, 1);
  if (!hasCredits) {
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
  }
  
  // Process PDF
  await UserService.deductCredits('pdf_processing', 1, result.id);
}

// After
export async function POST(request: NextRequest) {
  const canAccess = await SubscriptionService.canAccessFeature(userId, 'pdf_processing');
  if (!canAccess) {
    return NextResponse.json({ error: 'Upgrade required' }, { status: 403 });
  }
  
  const withinLimits = await SubscriptionService.checkUsageLimit(userId, 'pdf_processing');
  if (!withinLimits) {
    return NextResponse.json({ error: 'Monthly limit reached' }, { status: 429 });
  }
  
  // Process PDF
  await SubscriptionService.recordUsage(userId, 'pdf_processing');
}
```

## UI/UX Changes

### New Components

1. **Subscription Status Display**
   - Current plan information
   - Usage statistics
   - Upgrade prompts

2. **Pricing Page**
   - Compare plans
   - Feature matrix
   - Subscription management

3. **Billing Portal**
   - Payment method management
   - Invoice history
   - Subscription changes

4. **Usage Dashboard**
   - Monthly usage stats
   - Feature usage breakdown
   - Limit tracking

### Modified Components

1. **Credit Display → Subscription Status**
   - Show current plan instead of credits
   - Display usage vs limits
   - Quick upgrade access

2. **Feature Gates**
   - Replace credit checks with subscription checks
   - Better error messages
   - Clear upgrade paths

## Data Migration Script

```typescript
// /scripts/migrate-to-subscription.ts

async function migrateUsersToSubscription() {
  const users = await prisma.user.findMany({
    include: { purchases: true }
  });

  for (const user of users) {
    const totalSpent = user.purchases.reduce((sum, p) => sum + p.amountPaid, 0);
    const currentCredits = user.creditBalance;
    
    let planId = 'free';
    let trialEnd = null;
    
    // Migration logic
    if (totalSpent >= 5000) { // $50+ spent
      planId = 'pro';
      trialEnd = addMonths(new Date(), 2); // 2 months free
    } else if (totalSpent >= 2000) { // $20+ spent
      planId = 'pro';
      trialEnd = addMonths(new Date(), 1); // 1 month free
    } else if (currentCredits > 50) {
      planId = 'pro';
      trialEnd = addDays(new Date(), 14); // 2 weeks trial
    }
    
    // Create subscription
    await prisma.subscription.create({
      data: {
        userId: user.id,
        planId,
        status: trialEnd ? 'TRIALING' : 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: addMonths(new Date(), 1),
        trialEnd
      }
    });
  }
}
```

## Testing Strategy

### Unit Tests
- Subscription service methods
- Feature access controls
- Usage limit enforcement
- Migration scripts

### Integration Tests
- Subscription creation flow
- Payment webhook handling
- Feature gate enforcement
- User migration process

### User Testing
- Migration flow testing
- New user onboarding
- Subscription management
- Billing portal functionality

## Rollback Plan

### Emergency Rollback
1. Feature flag to disable subscription system
2. Re-enable credit system
3. Pause subscription billing
4. Communication to users

### Data Safety
- Keep all credit data during migration
- Backup subscription data
- Maintain audit logs
- Reversible database changes

## Success Metrics

### Business Metrics
- Monthly Recurring Revenue (MRR)
- Customer Lifetime Value (CLV)
- Churn rate
- Conversion rate from free to paid

### User Metrics
- Feature usage increase
- User satisfaction scores
- Support ticket reduction
- Migration completion rate

### Technical Metrics
- System performance
- Error rates
- API response times
- Database query efficiency

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Preparation | 2 weeks | Database setup, payment integration |
| Parallel System | 2 weeks | Dual system implementation |
| User Migration | 4 weeks | User communication and migration |
| Cleanup | 2 weeks | System optimization and cleanup |

**Total Timeline**: 10 weeks

## Risk Mitigation

### Technical Risks
- **Risk**: Payment integration issues
- **Mitigation**: Thorough testing with Stripe test mode

- **Risk**: Data migration errors
- **Mitigation**: Comprehensive backups and rollback procedures

### Business Risks
- **Risk**: User churn during migration
- **Mitigation**: Clear communication and migration incentives

- **Risk**: Revenue drop during transition
- **Mitigation**: Grandfathering existing users and gradual migration

### User Experience Risks
- **Risk**: Confusion about new system
- **Mitigation**: Clear documentation and in-app guidance

- **Risk**: Feature access disruption
- **Mitigation**: Automatic upgrade for active users during transition

## Post-Migration Optimizations

### Immediate (Month 1)
- Monitor subscription metrics
- Fix any migration issues
- Collect user feedback
- Optimize pricing based on data

### Short-term (Months 2-3)
- Add new subscription features
- Implement team collaboration
- Enhanced analytics
- Mobile app optimization

### Long-term (Months 4-6)
- Enterprise features
- API access tiers
- Advanced integrations
- International pricing

## Conclusion

The migration from credit-based to subscription-based pricing will significantly improve the business model and user experience. The phased approach ensures minimal disruption while maximizing user retention and revenue growth. The comprehensive rollback plan and testing strategy minimize risks while the clear timeline and metrics provide measurable success criteria.