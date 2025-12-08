# Migration Plan: Clerk → Better Auth

**Project**: Project0 Web Application  
**Date**: December 8, 2025  
**Status**: Planning Phase  
**Estimated Time**: 2-3 hours  

---

## Executive Summary

This document outlines the complete migration strategy from Clerk to Better Auth for the Project0 Next.js web application. The migration will implement email/password and Google OAuth authentication while maintaining all existing functionality.

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Migration Goals](#migration-goals)
3. [Technical Requirements](#technical-requirements)
4. [Database Schema Changes](#database-schema-changes)
5. [Implementation Phases](#implementation-phases)
6. [Risk Assessment](#risk-assessment)
7. [Rollback Strategy](#rollback-strategy)
8. [Testing Checklist](#testing-checklist)

---

## Current State Analysis

### Existing Authentication System (Clerk)

**Dependencies:**
```json
{
  "@clerk/nextjs": "^6.33.7",
  "@clerk/themes": "^2.4.28",
  "svix": "^1.77.0"
}
```

**Key Components:**
- `ClerkProvider` wrapper in root layout
- Pre-built UI components (SignIn, SignUp, UserButton)
- Clerk middleware for route protection
- Webhook handler for user lifecycle events
- Cross-origin auth support for mobile app
- Auth helper utilities for API routes

**Current User Flow:**
1. User signs up via Clerk UI
2. Clerk webhook triggers user creation in database
3. User data stored with Clerk ID as primary key
4. Sessions managed entirely by Clerk
5. Mobile app uses Clerk JWT tokens

**Database Structure:**
```prisma
model User {
  id           String        @id  // Clerk user ID
  email        String?
  notesCount   Int           @default(0)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  subscription Subscription?
}
```

**Files Using Clerk:**
- `/src/app/layout.tsx` - ClerkProvider
- `/src/middleware.ts` - clerkMiddleware
- `/src/lib/auth-helper.ts` - Clerk auth()
- `/src/components/user-control.tsx` - UserButton
- `/src/components/landing/header.tsx` - SignedIn/Out, SignInButton
- `/src/components/landing/hero.tsx` - SignedIn/Out
- `/src/components/auth/auth-loading.tsx` - useAuth
- `/src/components/auth/auto-redirect.tsx` - useAuth
- `/src/components/debug/user-sync-status.tsx` - useUser
- `/src/app/(home)/sign-in/[[...sign-in]]/page.tsx` - SignIn component
- `/src/app/(home)/sign-up/[[...sign-up]]/page.tsx` - SignUp component
- `/src/app/api/webhooks/clerk/route.ts` - Webhook handler
- `/src/app/api/uploadthing/core.ts` - auth()
- `/src/lib/subscription-service.ts` - auth()
- `/src/lib/feature-gate-service.ts` - auth()

---

## Migration Goals

### Primary Objectives
1. ✅ Replace Clerk with Better Auth
2. ✅ Implement email/password authentication
3. ✅ Implement Google OAuth authentication
4. ✅ Maintain existing subscription functionality
5. ✅ Preserve cross-origin auth for mobile app
6. ✅ Improve UI customization capabilities
7. ✅ Reduce third-party dependencies

### Success Criteria
- [ ] Users can sign up with email/password
- [ ] Users can sign in with email/password
- [ ] Users can sign in with Google OAuth
- [ ] Sessions persist across page refreshes
- [ ] Protected routes remain secure
- [ ] Mobile app can authenticate via API
- [ ] Subscription system continues working
- [ ] All existing features function correctly

---

## Technical Requirements

### New Dependencies

**Required Packages:**
```json
{
  "better-auth": "^1.0.0",
  "@better-auth/prisma": "^1.0.0"
}
```

**Removed Packages:**
```json
{
  "@clerk/nextjs": "^6.33.7",      // ❌ Remove
  "@clerk/themes": "^2.4.28",      // ❌ Remove
  "svix": "^1.77.0"                // ❌ Remove
}
```

### Environment Variables

**New Variables:**
```bash
# Better Auth Configuration
BETTER_AUTH_SECRET="<generate-with-openssl-rand-base64-32>"
BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth (for production)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

**Removed Variables:**
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY     # ❌ Remove
CLERK_SECRET_KEY                       # ❌ Remove
CLERK_WEBHOOK_SECRET                   # ❌ Remove
NEXT_PUBLIC_CLERK_SIGN_IN_URL         # ❌ Remove
NEXT_PUBLIC_CLERK_SIGN_UP_URL         # ❌ Remove
```

### Google OAuth Setup

**Steps to Configure:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
6. Copy Client ID and Client Secret

---

## Database Schema Changes

### User Model Updates

**Current Schema:**
```prisma
model User {
  id           String        @id
  email        String?
  notesCount   Int           @default(0)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  subscription Subscription?
  
  @@map("users")
}
```

**New Schema (Better Auth Compatible):**
```prisma
model User {
  id            String        @id @default(cuid())
  name          String?
  email         String        @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  
  // Existing fields
  notesCount    Int           @default(0)
  subscription  Subscription?
  
  // Better Auth relations
  sessions      Session[]
  accounts      Account[]
  
  @@map("users")
}
```

### New Tables Required

**Session Table:**
```prisma
model Session {
  id        String   @id @default(cuid())
  userId    String
  expiresAt DateTime
  token     String   @unique
  ipAddress String?
  userAgent String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("sessions")
}
```

**Account Table (for OAuth):**
```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  accountId         String
  providerId        String
  accessToken       String?
  refreshToken      String?
  idToken           String?
  expiresAt         DateTime?
  password          String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([providerId, accountId])
  @@index([userId])
  @@map("accounts")
}
```

**Verification Table:**
```prisma
model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@unique([identifier, value])
  @@map("verifications")
}
```

### Migration Strategy

**Option 1: Fresh Start (Recommended)**
- Create new Better Auth tables
- Keep existing users table
- Users re-authenticate (sign up again)
- Existing data (notes, subscriptions) preserved
- Clean separation of old/new auth

**Option 2: Data Migration**
- Migrate existing Clerk users to Better Auth
- Create accounts with temporary passwords
- Send password reset emails to all users
- More complex, higher risk

**Recommendation:** Option 1 - Fresh Start
- Cleaner implementation
- Lower risk of data corruption
- Existing user data (notes, subscriptions) unaffected
- Users can sign up with same email

---

## Implementation Phases

### Phase 1: Infrastructure Setup (30 minutes)

**Steps:**
1. Install Better Auth packages
2. Update environment variables
3. Create Better Auth server configuration
4. Update Prisma schema
5. Run database migrations

**Deliverables:**
- ✅ Better Auth installed
- ✅ Database schema updated
- ✅ Environment configured

### Phase 2: Core Authentication (45 minutes)

**Steps:**
6. Create API route handler
7. Create client instance
8. Update middleware
9. Update auth helper utilities

**Deliverables:**
- ✅ Auth API endpoints working
- ✅ Session management functional
- ✅ Route protection updated

### Phase 3: UI Components (45 minutes)

**Steps:**
10. Build custom sign-in page
11. Build custom sign-up page
12. Update root layout
13. Update user control component
14. Update landing page components
15. Update auth loading/redirect components

**Deliverables:**
- ✅ Custom auth UI complete
- ✅ All Clerk components replaced
- ✅ UI matches design system

### Phase 4: API Integration (30 minutes)

**Steps:**
16. Update all API routes
17. Remove Clerk webhook handler
18. Update debug components

**Deliverables:**
- ✅ All APIs using Better Auth
- ✅ Webhooks removed
- ✅ No Clerk dependencies

### Phase 5: Testing & Cleanup (30 minutes)

**Steps:**
19. Test all authentication flows
20. Remove Clerk dependencies
21. Update documentation

**Deliverables:**
- ✅ All tests passing
- ✅ Clerk fully removed
- ✅ Documentation updated

---

## Risk Assessment

### High Risk Items

**1. User Data Migration**
- **Risk:** Existing users lose access
- **Mitigation:** Keep user data, users re-authenticate
- **Impact:** Medium - Users need to sign up again

**2. Session Management**
- **Risk:** Active sessions invalidated
- **Mitigation:** Plan migration during low traffic
- **Impact:** High - All users logged out

**3. Mobile App Integration**
- **Risk:** Mobile app auth breaks
- **Mitigation:** Update mobile app simultaneously
- **Impact:** High - Mobile users can't access app

**4. Subscription System**
- **Risk:** Subscription data disconnected
- **Mitigation:** Use same userId, test thoroughly
- **Impact:** Critical - Payment system affected

### Medium Risk Items

**1. API Routes**
- **Risk:** API authentication fails
- **Mitigation:** Update all routes, test each endpoint
- **Impact:** Medium - Some features broken

**2. Third-party Integrations**
- **Risk:** UploadThing, Dodo Payments affected
- **Mitigation:** Verify userId compatibility
- **Impact:** Medium - File uploads, payments affected

### Low Risk Items

**1. UI Components**
- **Risk:** Styling inconsistencies
- **Mitigation:** Use existing design system
- **Impact:** Low - Visual only

---

## Rollback Strategy

### Immediate Rollback (< 1 hour)

If critical issues arise:

1. **Revert Git Changes**
   ```bash
   git reset --hard HEAD~1
   ```

2. **Restore Database**
   ```bash
   # If database backed up
   psql $DATABASE_URL < backup.sql
   
   # If using migrations
   prisma migrate reset
   ```

3. **Reinstall Clerk**
   ```bash
   npm install @clerk/nextjs @clerk/themes svix
   ```

4. **Restore Environment**
   - Restore Clerk environment variables
   - Remove Better Auth variables

### Partial Rollback

If specific features fail:
- Keep Better Auth infrastructure
- Temporarily allow both Clerk and Better Auth
- Gradual migration per feature
- Not recommended (complexity)

---

## Testing Checklist

### Authentication Flows

**Email/Password:**
- [ ] Sign up with new email
- [ ] Sign up with existing email (should fail)
- [ ] Sign up with invalid email format
- [ ] Sign up with weak password
- [ ] Sign in with correct credentials
- [ ] Sign in with wrong password
- [ ] Sign in with non-existent email
- [ ] Password reset flow (if implemented)

**Google OAuth:**
- [ ] Sign up with Google account
- [ ] Sign in with existing Google account
- [ ] Link Google account to existing email user
- [ ] Handle Google OAuth cancellation
- [ ] Handle Google OAuth errors

**Session Management:**
- [ ] Session persists after page refresh
- [ ] Session expires after timeout
- [ ] Sign out clears session
- [ ] Multiple concurrent sessions

### Protected Routes

**Web Application:**
- [ ] Unauthenticated user redirected from /dashboard
- [ ] Authenticated user can access /dashboard
- [ ] Sign-in page redirects if already authenticated
- [ ] Protected API routes require authentication
- [ ] Public routes accessible without auth

**API Endpoints:**
- [ ] GET /api/notes requires auth
- [ ] POST /api/notes requires auth
- [ ] GET /api/user requires auth
- [ ] GET /api/health is public
- [ ] CORS headers work for mobile app

### Mobile App Integration

- [ ] Mobile app can obtain auth token
- [ ] Mobile app can access protected APIs
- [ ] Token refresh works
- [ ] Mobile app handles expired tokens
- [ ] Cross-origin requests allowed

### Subscription System

- [ ] New user subscription creation
- [ ] Subscription status check
- [ ] Feature gating based on subscription
- [ ] Dodo Payments integration works
- [ ] Subscription cancellation

### UI Components

- [ ] Sign-in form validates inputs
- [ ] Sign-up form validates inputs
- [ ] Error messages display correctly
- [ ] Success messages display correctly
- [ ] Loading states work
- [ ] Dark mode works
- [ ] Mobile responsive

### Edge Cases

- [ ] Concurrent sign-ins from different devices
- [ ] Sign out from one device
- [ ] Rapid sign in/out cycles
- [ ] Browser back button behavior
- [ ] Form submission during network error
- [ ] SQL injection attempts (sanitization)
- [ ] XSS attempts (input validation)

---

## Post-Migration Tasks

### Immediate (Day 1)

- [ ] Monitor error logs for auth issues
- [ ] Monitor user support requests
- [ ] Verify mobile app functionality
- [ ] Check subscription processing
- [ ] Verify email deliverability (if using email verification)

### Short-term (Week 1)

- [ ] Collect user feedback on new auth UI
- [ ] Optimize auth page performance
- [ ] Add forgot password functionality
- [ ] Add email verification
- [ ] Add 2FA support (optional)

### Long-term (Month 1)

- [ ] Analyze auth metrics (sign-up rate, sign-in success rate)
- [ ] Consider adding social providers (GitHub, Apple)
- [ ] Implement security enhancements
- [ ] Update mobile app with Better Auth SDK
- [ ] Document new auth flow for team

---

## Success Metrics

### Quantitative Metrics

- Sign-up completion rate > 80%
- Sign-in success rate > 95%
- Session duration (target: > 30 minutes)
- API authentication success rate > 99%
- Page load time for auth pages < 2 seconds

### Qualitative Metrics

- User feedback on new UI
- Developer experience improvements
- Reduction in auth-related bugs
- Easier onboarding for new developers
- Better debugging capabilities

---

## Resource Links

### Better Auth Documentation
- [Installation Guide](https://better-auth.com/docs/installation)
- [Next.js Integration](https://better-auth.com/docs/integrations/next)
- [Prisma Adapter](https://better-auth.com/docs/adapters/prisma)
- [Google OAuth Setup](https://better-auth.com/docs/providers/google)

### Related Documentation
- [Next.js 16 Proxy/Middleware](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Google Cloud Console](https://console.cloud.google.com)

---

## Approval & Sign-off

**Prepared by:** AI Assistant  
**Review required by:** Development Team Lead  
**Approval required by:** Product Owner / CTO  

**Pre-migration checklist:**
- [ ] Plan reviewed and approved
- [ ] Database backup created
- [ ] Google OAuth credentials obtained
- [ ] Team notified of migration window
- [ ] Rollback procedure tested
- [ ] Monitoring alerts configured

---

## Migration Execution

**Scheduled Date:** TBD  
**Estimated Duration:** 2-3 hours  
**Team Members Required:** 1-2 developers  
**Maintenance Window:** Required (users will be logged out)  

**Go/No-Go Criteria:**
- ✅ All tests passing in current system
- ✅ Database backup verified
- ✅ Rollback plan tested
- ✅ Team available for support
- ✅ Low traffic period selected

---

*Document Version: 1.0*  
*Last Updated: December 8, 2025*
