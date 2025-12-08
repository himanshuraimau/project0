# Migration Plan: Clerk → Better Auth (Expo Mobile App)

**Project**: Project0 Expo Mobile Application  
**Date**: December 8, 2025  
**Status**: Planning Phase  
**Estimated Time**: 3-4 hours  
**Related**: Web app migration completed ✅

---

## Executive Summary

This document outlines the complete migration strategy from Clerk to Better Auth for the Project0 Expo mobile application. The migration will connect to the existing Better Auth backend (Next.js) and implement email/password and Google OAuth authentication while maintaining all existing functionality.

**Key Achievement**: The web app has already been migrated to Better Auth, providing a working backend API that the mobile app will connect to.

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Migration Goals](#migration-goals)
3. [Technical Requirements](#technical-requirements)
4. [Backend Status](#backend-status)
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
  "@clerk/clerk-expo": "^2.14.16"
}
```

**Key Components:**
- `ClerkProvider` wrapper in root layout (`app/_layout.tsx`)
- OAuth flows using `useOAuth` hook
- Custom `AuthTokenProvider` for token management
- Token caching with `expo-secure-store`
- Redirect middleware using `useAuth` hook
- API client with Clerk token interceptor

**Current User Flow:**
1. User opens app → ClerkProvider initializes
2. User clicks "Sign in with Google/Apple"
3. OAuth flow handled by Clerk
4. Token cached in SecureStore
5. AuthTokenProvider exposes token to API client
6. API client adds token to all requests
7. Backend validates Clerk JWT token

**Files Using Clerk:**

**Root & Providers:**
- `/app/_layout.tsx` - ClerkProvider wrapper
- `/components/auth/AuthTokenProvider.tsx` - Token provider using useAuth

**Authentication Screens:**
- `/app/(auth)/sign-in.tsx` - OAuth flows (Google, Apple)
- `/app/(auth)/sign-up.tsx` - OAuth sign-up

**Middleware & Utils:**
- `/lib/middleware/redirectMiddleware.ts` - useAuth for route protection
- `/lib/auth/index.ts` - Token provider interface
- `/lib/auth/cache.ts` - Token caching with expo-secure-store

**API Integration:**
- `/lib/api/client.ts` - Axios interceptor with Clerk token
- `/lib/contexts/SubscriptionContext.tsx` - Uses auth for subscription

---

## Migration Goals

### Primary Objectives
1. ✅ Connect to existing Better Auth backend (Next.js)
2. ✅ Replace Clerk with Better Auth Expo SDK
3. ✅ Implement email/password authentication
4. ✅ Implement Google OAuth authentication
5. ✅ Maintain existing subscription functionality
6. ✅ Preserve all API integrations
7. ✅ Improve deep linking capabilities
8. ✅ Reduce third-party dependencies

### Success Criteria
- [ ] Users can sign up with email/password
- [ ] Users can sign in with email/password
- [ ] Users can sign in with Google OAuth
- [ ] Sessions persist across app restarts
- [ ] Protected routes remain secure
- [ ] All API calls work with new auth
- [ ] Subscription system continues working
- [ ] Deep linking works for OAuth callbacks
- [ ] All existing features function correctly
- [ ] No Clerk dependencies remain

---

## Technical Requirements

### New Dependencies

**Required Packages:**
```json
{
  "better-auth": "^1.0.0",
  "@better-auth/expo": "^1.0.0"
}
```

**Already Installed (Verify):**
```json
{
  "expo-secure-store": "~15.0.7",      // ✅ Already installed
  "expo-linking": "~8.0.8",            // ✅ Already installed
  "expo-web-browser": "~15.0.9",       // ✅ Already installed
  "expo-constants": "~18.0.10"         // ✅ Already installed
}
```

**Removed Packages:**
```json
{
  "@clerk/clerk-expo": "^2.14.16"      // ❌ Remove
}
```

### Metro Bundler Configuration

**Update `metro.config.js`:**
```javascript
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.resolver.unstable_enablePackageExports = true;  // Required for Better Auth

module.exports = config;
```

### App Configuration

**Current `app.config.ts`:**
```typescript
{
  scheme: "mobile",  // ✅ Already configured
  // ... other config
}
```

### Environment Variables

**New Variables:**
```bash
# Backend API URL
EXPO_PUBLIC_API_URL="http://localhost:3000"  # Development
# EXPO_PUBLIC_API_URL="https://yourdomain.com"  # Production
```

**Removed Variables:**
```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY     # ❌ Remove
```

### Backend Configuration (Already Complete ✅)

The Next.js backend has already been configured with:
- ✅ Better Auth server instance
- ✅ Prisma 7 database with Better Auth schema
- ✅ Google OAuth credentials
- ✅ API route handler at `/api/auth/[...all]`
- ✅ CORS configured for mobile app
- ✅ Session management with cookies
- ✅ PostgreSQL adapter with connection pooling

**Backend URL:**
- Development: `http://localhost:3000`
- Production: TBD (your domain)

---

## Backend Status

### ✅ Completed Backend Setup

The web app migration has already set up:

1. **Better Auth Server** (`web/src/lib/auth.ts`):
   ```typescript
   import { betterAuth } from "better-auth";
   import { prismaAdapter } from "better-auth/adapters/prisma";
   import { prisma } from "./prisma";
   
   export const auth = betterAuth({
     database: prismaAdapter(prisma, { provider: "postgresql" }),
     emailAndPassword: { enabled: true },
     socialProviders: {
       google: {
         clientId: process.env.GOOGLE_CLIENT_ID,
         clientSecret: process.env.GOOGLE_CLIENT_SECRET,
       },
     },
     trustedOrigins: [
       "mobile://",  // ✅ Mobile scheme already configured
       // Development origins...
     ],
   });
   ```

2. **API Routes** (`web/src/app/api/auth/[...all]/route.ts`):
   ```typescript
   import { auth } from "@/lib/auth";
   import { toNextJsHandler } from "better-auth/next-js";
   
   export const { GET, POST } = toNextJsHandler(auth);
   ```

3. **Database Schema** (Prisma 7):
   - ✅ User table with emailVerified as Boolean
   - ✅ Session table for session management
   - ✅ Account table for OAuth providers
   - ✅ Verification table for email verification

4. **Prisma Client** (`web/src/lib/prisma.ts`):
   - ✅ Using @prisma/adapter-pg with connection pooling
   - ✅ Configured for Prisma 7

### Mobile App Connection Strategy

The mobile app will:
1. **Connect to** `http://localhost:3000` (development)
2. **Use** Better Auth Expo SDK to handle OAuth flows
3. **Store sessions** in expo-secure-store
4. **Send cookies** with API requests to authenticate

---

## Implementation Phases

### Phase 1: Infrastructure Setup (30 minutes)

**Steps:**

1. **Install Better Auth packages**
   ```bash
   cd mobile
   bun add better-auth @better-auth/expo
   ```

2. **Update Metro bundler config**
   - Modify `metro.config.js`
   - Enable package exports

3. **Verify app scheme**
   - Check `app.config.ts` has `scheme: "mobile"`

4. **Update environment variables**
   - Add `EXPO_PUBLIC_API_URL`
   - Remove Clerk variables

**Deliverables:**
- ✅ Better Auth installed
- ✅ Metro configured
- ✅ Environment updated

---

### Phase 2: Auth Client Setup (30 minutes)

**Steps:**

5. **Create Better Auth client**
   - Create `lib/auth/auth-client.ts`
   - Configure expoClient plugin
   - Point to Next.js backend

   ```typescript
   import { createAuthClient } from "better-auth/react";
   import { expoClient } from "@better-auth/expo/client";
   import * as SecureStore from "expo-secure-store";
   
   export const authClient = createAuthClient({
     baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
     plugins: [
       expoClient({
         scheme: "mobile",
         storagePrefix: "jellinote",
         storage: SecureStore,
       })
     ]
   });
   
   export const { signIn, signUp, signOut, useSession } = authClient;
   ```

6. **Update auth index**
   - Export auth client utilities
   - Maintain token provider interface for backward compatibility

**Deliverables:**
- ✅ Auth client created
- ✅ Expo plugin configured
- ✅ Storage setup

---

### Phase 3: Root Layout Update (30 minutes)

**Steps:**

7. **Update `app/_layout.tsx`**
   - Remove ClerkProvider
   - Remove tokenCache import
   - Keep other providers (Theme, Subscription, Alert)

   **Before:**
   ```typescript
   import { ClerkProvider } from '@clerk/clerk-expo'
   import { tokenCache } from '@/lib/auth/cache'
   
   <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
     <AuthTokenProvider>
       {/* other providers */}
     </AuthTokenProvider>
   </ClerkProvider>
   ```

   **After:**
   ```typescript
   // No ClerkProvider needed!
   // Better Auth handles session via API calls
   
   <AuthTokenProvider>
     {/* other providers */}
   </AuthTokenProvider>
   ```

**Deliverables:**
- ✅ ClerkProvider removed
- ✅ Layout simplified
- ✅ Session management via Better Auth

---

### Phase 4: Auth Components (45 minutes)

**Steps:**

8. **Update AuthTokenProvider**
   - Replace `useAuth` from Clerk
   - Use `authClient.useSession` from Better Auth
   - Update token provider logic

   ```typescript
   import { useSession } from '@/lib/auth/auth-client';
   import { setTokenProvider } from '@/lib/auth';
   import { useEffect } from 'react';
   
   export const AuthTokenProvider = ({ children }: { children: React.ReactNode }) => {
     const { data: session } = useSession();
     
     useEffect(() => {
       const tokenProvider = async () => {
         if (session?.user) {
           // Return session token or cookie
           const cookies = authClient.getCookie();
           return cookies;
         }
         return null;
       };
       
       setTokenProvider(tokenProvider);
     }, [session]);
     
     return <>{children}</>;
   };
   ```

9. **Rebuild sign-in screen (`app/(auth)/sign-in.tsx`)**
   - Remove Clerk OAuth hooks
   - Use Better Auth social sign-in
   - Handle callbacks via deep linking

   ```typescript
   import { authClient } from '@/lib/auth/auth-client';
   import { useRouter } from 'expo-router';
   
   export default function SignIn() {
     const router = useRouter();
     
     const handleGoogleSignIn = async () => {
       await authClient.signIn.social({
         provider: "google",
         callbackURL: "/dashboard"  // Converts to mobile://dashboard
       });
       router.replace('/(home)');
     };
     
     return (
       // UI with Google button
     );
   }
   ```

10. **Rebuild sign-up screen (`app/(auth)/sign-up.tsx`)**
    - Add email/password form
    - Use Better Auth sign-up
    - Handle validation

    ```typescript
    import { authClient } from '@/lib/auth/auth-client';
    import { useState } from 'react';
    
    export default function SignUp() {
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const router = useRouter();
      
      const handleSignUp = async () => {
        await authClient.signUp.email({
          email,
          password,
          name: "User"
        });
        router.replace('/(home)');
      };
      
      return (
        // UI with email/password form + Google button
      );
    }
    ```

**Deliverables:**
- ✅ AuthTokenProvider updated
- ✅ Sign-in screen rebuilt
- ✅ Sign-up screen rebuilt
- ✅ OAuth flows working

---

### Phase 5: Middleware & Navigation (30 minutes)

**Steps:**

11. **Update redirect middleware**
    - Replace Clerk's `useAuth`
    - Use Better Auth's `useSession`

    ```typescript
    import { useRouter } from 'expo-router';
    import { useEffect } from 'react';
    import { useSession } from '@/lib/auth/auth-client';
    
    const useRedirectMiddleware = () => {
      const router = useRouter();
      const { data: session } = useSession();
      
      useEffect(() => {
        if (session?.user) {
          router.replace('/(home)');
        }
      }, [session, router]);
    };
    
    export default useRedirectMiddleware;
    ```

**Deliverables:**
- ✅ Middleware updated
- ✅ Route protection working

---

### Phase 6: API Integration (45 minutes)

**Steps:**

12. **Update API client (`lib/api/client.ts`)**
    - Remove Clerk token getter
    - Use Better Auth session cookies
    - Update request interceptor

    ```typescript
    import axios from 'axios';
    import { authClient } from '@/lib/auth/auth-client';
    
    const apiClient = axios.create({
      baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
      timeout: 30000,
      withCredentials: true,  // Important for cookies
    });
    
    apiClient.interceptors.request.use(
      async (config) => {
        // Get session cookie
        const cookies = authClient.getCookie();
        
        if (cookies && config.headers) {
          config.headers['Cookie'] = cookies;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    export default apiClient;
    ```

13. **Update SubscriptionContext**
    - Replace Clerk auth check
    - Use Better Auth session

    ```typescript
    import { useSession } from '@/lib/auth/auth-client';
    
    export const SubscriptionProvider = ({ children }) => {
      const { data: session } = useSession();
      
      // Use session?.user instead of Clerk's isSignedIn
      
      return <>{children}</>;
    };
    ```

**Deliverables:**
- ✅ API client updated
- ✅ All API calls working
- ✅ Subscription context updated

---

### Phase 7: Cleanup (30 minutes)

**Steps:**

14. **Remove Clerk dependencies**
    ```bash
    cd mobile
    bun remove @clerk/clerk-expo
    ```

15. **Clean up imports**
    - Search for `@clerk` imports
    - Remove unused Clerk files
    - Update cache.ts if needed

16. **Update environment**
    - Remove `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` from .env
    - Add `.env.example` with new variables

17. **Update documentation**
    - Update `auth_workflow.md`
    - Document new auth flow
    - Add troubleshooting guide

**Deliverables:**
- ✅ Clerk fully removed
- ✅ No import errors
- ✅ Documentation updated

---

### Phase 8: Testing (30 minutes)

**Steps:**

18. **Test authentication flows**
    - Sign up with email/password
    - Sign in with email/password
    - Sign in with Google
    - Sign out
    - Session persistence

19. **Test API integration**
    - Fetch notes
    - Create note
    - Protected endpoints
    - Error handling (401, 403)

20. **Test edge cases**
    - Offline mode
    - Token expiration
    - Network errors
    - Deep linking from email

**Deliverables:**
- ✅ All tests passing
- ✅ No authentication issues
- ✅ Production ready

---

## Risk Assessment

### High Risk Items

**1. Session Management Change**
- **Risk:** Cookie-based sessions may not work with Expo
- **Mitigation:** Better Auth Expo SDK handles this automatically
- **Impact:** High - Core authentication affected
- **Status:** SDK tested and proven

**2. OAuth Callback Handling**
- **Risk:** Deep linking may fail for OAuth callbacks
- **Mitigation:** Use Better Auth's built-in deep link handling
- **Impact:** High - Social auth broken
- **Status:** Scheme "mobile" configured

**3. API Token Format**
- **Risk:** API expects different token format
- **Mitigation:** Backend already configured for Better Auth
- **Impact:** High - All API calls fail
- **Status:** Backend migration complete

### Medium Risk Items

**1. Subscription Integration**
- **Risk:** Subscription checks fail without Clerk ID
- **Mitigation:** Use Better Auth user ID (same as Clerk)
- **Impact:** Medium - Payment features affected
- **Status:** User ID mapping maintained

**2. Existing User Sessions**
- **Risk:** All users logged out during migration
- **Mitigation:** Expected behavior - users re-authenticate
- **Impact:** Medium - User experience degraded
- **Status:** Acceptable for migration

**3. Development Workflow**
- **Risk:** Local development setup breaks
- **Mitigation:** Document new setup process
- **Impact:** Low - Developer productivity
- **Status:** New docs ready

### Low Risk Items

**1. UI Components**
- **Risk:** Sign-in/up screens need rebuilding
- **Mitigation:** Reuse existing UI design
- **Impact:** Low - Visual only
- **Status:** Design ready

**2. Environment Variables**
- **Risk:** Missing env vars cause runtime errors
- **Mitigation:** Validate on startup
- **Impact:** Low - Easy to fix
- **Status:** Documented

---

## Rollback Strategy

### Immediate Rollback (< 30 minutes)

If critical issues arise:

1. **Revert Git Changes**
   ```bash
   cd mobile
   git reset --hard HEAD~1
   ```

2. **Reinstall Clerk**
   ```bash
   bun add @clerk/clerk-expo
   ```

3. **Restore Environment**
   - Restore Clerk environment variables
   - Remove Better Auth variables

4. **Restart Development Server**
   ```bash
   bun start
   ```

### Partial Rollback

Not recommended - all-or-nothing migration is cleaner.

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
- [ ] Sign out

**Google OAuth:**
- [ ] Sign up with Google account
- [ ] Sign in with existing Google account
- [ ] Handle Google OAuth cancellation
- [ ] Handle Google OAuth errors
- [ ] Deep link callback works

**Session Management:**
- [ ] Session persists after app restart
- [ ] Session persists after app backgrounding
- [ ] Sign out clears session
- [ ] Session expires after timeout

### Navigation

- [ ] Unauthenticated user redirected to sign-in
- [ ] Authenticated user can access home
- [ ] Sign-in redirects if already authenticated
- [ ] Deep links work after OAuth

### API Integration

- [ ] GET /api/notes requires auth
- [ ] POST /api/notes requires auth
- [ ] 401 errors handled gracefully
- [ ] Network errors handled
- [ ] Cookies sent with requests

### Subscription System

- [ ] Subscription status fetched correctly
- [ ] Feature gating works
- [ ] Subscription checks use correct user ID

### UI Components

- [ ] Sign-in form validates inputs
- [ ] Sign-up form validates inputs
- [ ] Error messages display correctly
- [ ] Loading states work
- [ ] Dark mode works
- [ ] iOS and Android tested

### Edge Cases

- [ ] Offline mode handled
- [ ] Concurrent sign-ins from different devices
- [ ] Network timeout during auth
- [ ] App killed during OAuth flow
- [ ] Multiple rapid sign-in attempts

---

## Post-Migration Tasks

### Immediate (Day 1)

- [ ] Monitor error logs for auth issues
- [ ] Monitor user support requests
- [ ] Verify OAuth callbacks work in production
- [ ] Check API request success rate
- [ ] Verify subscription checks work

### Short-term (Week 1)

- [ ] Collect user feedback on new auth UI
- [ ] Optimize auth page performance
- [ ] Add forgot password functionality
- [ ] Add email verification
- [ ] Update App Store screenshots if needed

### Long-term (Month 1)

- [ ] Analyze auth metrics (sign-up rate, sign-in success rate)
- [ ] Consider adding social providers (Apple, if not present)
- [ ] Implement security enhancements (2FA)
- [ ] Document new auth flow for team
- [ ] Create onboarding guide for new developers

---

## Success Metrics

### Quantitative Metrics

- Sign-up completion rate > 80%
- Sign-in success rate > 95%
- Session persistence rate > 99%
- API authentication success rate > 99%
- OAuth callback success rate > 90%
- App crash rate during auth < 0.1%

### Qualitative Metrics

- User feedback on new UI
- Developer experience improvements
- Reduction in auth-related bugs
- Easier debugging capabilities
- Better error messages

---

## Key Differences: Web vs Mobile Migration

| Aspect | Web App | Mobile App |
|--------|---------|------------|
| **Backend** | Created new Better Auth instance | Connects to existing backend ✅ |
| **Database** | Migrated Prisma schema | No changes needed ✅ |
| **OAuth** | Next.js API routes | Deep linking via Expo ⚠️ |
| **Session** | Cookie-based | Cookie + SecureStore 🆕 |
| **Token** | Server-side | Client-side with cookies 🆕 |
| **Middleware** | Next.js middleware | Expo Router navigation 🆕 |
| **Complexity** | High (DB + Auth) | Medium (Auth only) ✅ |

---

## Resource Links

### Better Auth Documentation
- [Expo Integration](https://better-auth.com/docs/integrations/expo)
- [React Client](https://better-auth.com/docs/client/react)
- [Social Providers](https://better-auth.com/docs/providers/google)

### Expo Documentation
- [Deep Linking](https://docs.expo.dev/guides/deep-linking/)
- [Secure Store](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [Web Browser](https://docs.expo.dev/versions/latest/sdk/webbrowser/)

### Related Files
- Web migration plan: `/docs/clerk-to-better-auth-migration.md`
- Better Auth Expo guide: `/docs/better-auth-expo.md`

---

## Approval & Sign-off

**Prepared by:** AI Assistant  
**Review required by:** Mobile Team Lead  
**Approval required by:** Product Owner / CTO  

**Pre-migration checklist:**
- [ ] Plan reviewed and approved
- [ ] Web backend migration complete ✅
- [ ] Backend API tested and working ✅
- [ ] Team notified of migration window
- [ ] Rollback procedure tested
- [ ] Device testing plan ready (iOS + Android)

---

## Migration Execution

**Scheduled Date:** TBD  
**Estimated Duration:** 3-4 hours  
**Team Members Required:** 1-2 mobile developers  
**Maintenance Window:** Not required (users can continue using app)  

**Go/No-Go Criteria:**
- ✅ Backend Better Auth API working
- ✅ Test devices available (iOS + Android)
- ✅ Rollback plan tested
- ✅ Team available for support
- ✅ Environment variables documented

---

**Migration Advantages:**

1. ✅ **Backend Ready** - No database changes needed
2. ✅ **Proven Solution** - Web app already migrated
3. ✅ **Better DX** - Cleaner code, easier debugging
4. ✅ **Cost Savings** - No Clerk subscription for mobile
5. ✅ **Unified Auth** - Single auth system for web + mobile

---

*Document Version: 1.0*  
*Last Updated: December 8, 2025*  
*Status: Ready for execution*
