# Credit System Documentation

## Overview

The current application uses a **credit-based payment system** where users purchase credits upfront and consume them as they use various features. This document provides a comprehensive overview of the credit system implementation, including all components, functions, and usage patterns.

## Credit System Architecture

### Database Schema

#### User Model
```prisma
model User {
  id            String     @id
  email         String?
  creditBalance Int        @default(1000)  // Default 1000 credits for new users
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  purchases     Purchase[]
}
```

#### Purchase Model
```prisma
model Purchase {
  id            String   @id @default(cuid())
  userId        String
  plan          String   // Credit plan ID
  credits       Int      // Number of credits purchased
  amountPaid    Int      // Amount paid in cents
  dodoPaymentId String?  @unique  // Payment provider ID
  status        String   @default("pending")  // pending, completed, failed
  createdAt     DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

#### CreditUsage Model
```prisma
model CreditUsage {
  id         String   @id @default(cuid())
  userId     String
  action     String   // Type of action that consumed credits
  credits    Int      @default(1)  // Number of credits consumed
  resourceId String?  // ID of the resource created (optional)
  createdAt  DateTime @default(now())
}
```

## Credit Pricing Plans

### Available Plans
```typescript
const CREDIT_PLANS: CreditPlan[] = [
  {
    id: 'free',
    name: 'Free Plan',
    credits: 10,
    price: 0,
    description: 'Get started with 10 free credits',
    productId: ''
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    credits: 100,
    price: 1000, // $10.00 in cents
    description: 'Best for regular users',
    productId: 'pdt_ncCa7erBoNtO9GunYcJL3'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    credits: 500,
    price: 4000, // $40.00 in cents
    description: 'For teams and heavy usage',
    productId: 'pdt_VJWdaLBqdd6pcy67TXlJ6'
  }
]
```

### Pricing Structure
- **Free Plan**: 10 credits at $0 (new user default)
- **Pro Plan**: 100 credits at $10.00 ($0.10 per credit)
- **Enterprise Plan**: 500 credits at $40.00 ($0.08 per credit)

## Credit Consumption Rules

### Credit Costs by Feature
| Feature | Credits Required | Description |
|---------|------------------|-------------|
| PDF Upload + Processing + Notes | 1 credit | Upload and process PDF documents |
| YouTube Video + Transcription + Notes | 1 credit | Process YouTube videos |
| Audio Upload + Transcription + Notes | 1 credit | Upload and process audio files |
| Audio Recording + Transcription + Notes | 1 credit | Record and process audio |
| Webpage Processing + Notes | 1 credit | Extract content from websites |
| Text-to-Notes Generation | 1 credit | Generate notes from text input |
| Course Generation | 2 credits | Create comprehensive courses |

### Free Features (No Credits Required)
- Flashcards generation (from existing notes)
- Quiz generation (from existing notes)
- Transcript viewing (from existing content)
- Notes viewing and editing (from existing content)
- Mind map generation (from existing notes)

## Core Components

### 1. User Service (`/src/lib/user-service.ts`)

Main service class handling all user and credit operations:

#### Key Methods:
- `getOrCreateUser(userId, email?)` - Create new user with 1000 default credits
- `getCurrentUserCredits()` - Get current user's credit balance
- `hasEnoughCredits(userId, requiredCredits)` - Check if user has sufficient credits
- `deductCredits(action, creditsToDeduct, resourceId?)` - Deduct credits and log usage
- `addCredits(userId, creditsToAdd)` - Add credits to user balance
- `getUserPurchases()` - Get user's purchase history
- `getUserCreditUsage()` - Get user's credit usage history
- `createPurchase(userId, plan, dodoPaymentId?)` - Create purchase record
- `completePurchase(dodoPaymentId)` - Complete purchase and add credits

### 2. Credit Utilities (`/src/lib/credit-utils.ts`)

Client-side utility functions for credit management:

#### Functions:
- `useCredits(action, credits, resourceId?)` - Deduct credits for an action
- `getCurrentCredits()` - Fetch current credit balance
- `handleInsufficientCredits()` - Redirect to credits page

### 3. Credits API Client (`/src/lib/client/credits-api.ts`)

Client-side API functions for credit validation:

#### Functions:
- `checkUserCredits(requiredCredits)` - Check if user has enough credits
- `checkCreditsAndRedirect(requiredCredits)` - Check credits and redirect if insufficient

### 4. Credit Hook (`/src/hooks/use-credits.ts`)

React hook for credit management in components:

#### Returns:
- `isLoading` - Loading state
- `checkCredits()` - Check current credit balance
- `useCredits(action, credits, resourceId?)` - Use credits for an action
- `checkAndProceed(requiredCredits, onProceed)` - Check credits before proceeding

## API Endpoints

### 1. Credits API (`/src/app/api/users/credits/route.ts`)

#### GET `/api/users/credits`
- **Purpose**: Get user's current credit balance
- **Response**: `{ success: true, credits: number }`

#### POST `/api/users/credits`
- **Purpose**: Deduct credits for an action
- **Body**: `{ action: string, credits?: number, resourceId?: string }`
- **Response**: `{ success: true, creditsRemaining: number, creditsDeducted: number }`
- **Error**: `402 Payment Required` if insufficient credits

### 2. Checkout API (`/src/app/checkout/route.ts`)

Handles payment processing through Dodo Payments:
- **GET**: Static checkout page
- **POST**: Dynamic checkout with product details

### 3. Payment Webhook (`/src/app/api/webhook/dodo-payments/route.ts`)

Processes payment events:
- `onPaymentSucceeded` - Add credits to user account
- `onPaymentFailed` - Log failed payment
- `onPaymentCancelled` - Log cancelled payment

## UI Components

### 1. Credit Display (`/src/components/credit-display.tsx`)

Shows current credit balance with purchase button:
- Displays credit count with icon
- Shows low credit warnings
- Provides quick access to purchase page

### 2. Credit Purchase (`/src/components/credit-purchase.tsx`)

Full credit purchase interface:
- Displays all available plans
- Shows pricing and credit amounts
- Handles purchase flow
- Calculates credits per dollar

### 3. Credit Purchase Page (`/src/app/credits/page.tsx`)

Dedicated page for purchasing credits:
- Loads user's current balance
- Renders credit purchase component
- Handles authentication

## Credit Validation Flow

### Frontend Validation
1. User initiates action (upload PDF, create course, etc.)
2. `checkCreditsAndRedirect()` validates sufficient credits
3. If insufficient, user redirected to `/credits` page
4. If sufficient, action proceeds

### Backend Validation
1. API endpoint receives request
2. `UserService.hasEnoughCredits()` validates credit balance
3. If insufficient, returns `402 Payment Required`
4. If sufficient, `UserService.deductCredits()` is called
5. Credits deducted in database transaction
6. Usage logged in `CreditUsage` table

## Payment Processing

### Purchase Flow
1. User selects credit plan on `/credits` page
2. Redirected to `/checkout?productId={id}&quantity=1`
3. Dodo Payments processes payment
4. Webhook receives payment confirmation
5. Credits added to user account
6. Purchase record updated to "completed"

### Security Features
- User authentication required for all credit operations
- Database transactions ensure consistency
- Webhook validation with secret key
- Purchase records for audit trail

## Credit Usage Tracking

### Usage Locations

#### PDF Processing
- **File**: `/src/app/api/pdf/process/route.ts`
- **Action**: `"pdf_processing"`
- **Credits**: 1

#### YouTube Processing
- **File**: `/src/app/api/transcripts/route.ts`
- **Action**: `"youtube_transcription"`
- **Credits**: 1

#### Audio Processing
- **File**: `/src/app/api/audio/transcribe/route.ts`
- **Action**: `"audio_transcription"`
- **Credits**: 1

#### Webpage Processing
- **File**: `/src/app/api/webpage/process/route.ts`
- **Action**: `"webpage_processing"`
- **Credits**: 1

#### Text-to-Notes
- **File**: `/src/app/api/notes/generate-from-text/route.ts`
- **Action**: `"text_to_notes"`
- **Credits**: 1

#### Course Generation
- **File**: `/src/app/api/course/create-course/route.ts`
- **Action**: `"course_generation"`
- **Credits**: 2

## Frontend Integration

### Component Integration
All credit-requiring features integrate credit validation:

```typescript
// Example from new-note-section.tsx
onClick={async () => {
  const hasCredits = await checkCreditsAndRedirect();
  if (hasCredits) {
    // Proceed with action
  }
}}
```

### Error Handling
- `402 Payment Required` status triggers redirect to credits page
- Loading states during credit validation
- User-friendly error messages

## Environment Variables

```env
# Dodo Payments Configuration
DODO_PAYMENTS_API_KEY=your_api_key
DODO_PAYMENTS_WEBHOOK_KEY=your_webhook_key
DODO_PAYMENTS_RETURN_URL=your_return_url

# Product IDs
NEXT_PUBLIC_DODO_PRODUCT_ID_PRO=pdt_ncCa7erBoNtO9GunYcJL3
NEXT_PUBLIC_DODO_PRODUCT_ID_ENTERPRISE=pdt_VJWdaLBqdd6pcy67TXlJ6
```

## Known Issues & Limitations

1. **New User Credits**: All new users receive 1000 credits by default (may be too generous)
2. **Credit Check Timing**: Credits are deducted after processing (should be before)
3. **Partial Failures**: If processing fails after credit deduction, credits are not refunded
4. **No Subscription Model**: Users must purchase credits repeatedly
5. **Limited Plan Options**: Only 3 plans available
6. **No Credit Expiration**: Credits never expire

## Migration Considerations

When migrating to subscription-based model:

1. **User Data**: Preserve existing credit balances
2. **Purchase History**: Maintain purchase records
3. **Usage Tracking**: Keep credit usage for analytics
4. **API Compatibility**: Maintain backward compatibility during transition
5. **Payment Provider**: May need to switch from one-time to recurring payments
6. **Database Schema**: Add subscription tables while keeping credit tables

## Monitoring & Analytics

Current system tracks:
- Credit purchases by plan
- Credit usage by feature
- User credit balances
- Purchase completion rates

Missing analytics:
- Credit utilization patterns
- Feature adoption by credit cost
- User churn related to credits
- Refund/credit adjustment tracking