# Apple Sign-In Implementation Guide

## Overview
Apple Sign-In has been successfully integrated into both the web app (study-app) and mobile app using Better Auth.

## What Was Implemented

### Study App (Web) - `/study-app`

#### 1. Environment Configuration
- **File**: `study-app/.env.example`
- Added Apple OAuth credentials:
  - `APPLE_CLIENT_ID` - Your Apple Service ID (e.g., com.yourcompany.yourapp.si)
  - `APPLE_CLIENT_SECRET` - JWT generated from .p8 key (max 6 months expiration)
  - `APPLE_APP_BUNDLE_IDENTIFIER` - Your App Bundle ID for native iOS validation

#### 2. Better Auth Configuration
- **File**: `study-app/src/lib/auth.ts`
- Added Apple provider to `socialProviders`
- Added `https://appleid.apple.com` to `trustedOrigins`

#### 3. Sign-In/Sign-Up Pages
- **Files**: 
  - `study-app/src/app/(home)/sign-in/page.tsx`
  - `study-app/src/app/(home)/sign-up/page.tsx`
- Added `handleAppleSignIn` / `handleAppleSignUp` functions
- Added state management for Apple loading state
- Integrated with existing auth flow

#### 4. UI Component
- **File**: `study-app/src/components/auth/auth-screen.tsx`
- Added Apple icon SVG component
- Added "Continue with Apple" button
- Styled to match existing Google button

### Web App - `/web` (Copy of Study App)

#### 1. Environment Configuration
- **File**: `web/.env.example`
- Added Apple OAuth credentials (same as study-app)

#### 2. Better Auth Configuration
- **File**: `web/src/lib/auth.ts`
- Added Apple provider to `socialProviders`
- Added `https://appleid.apple.com` to `trustedOrigins`

#### 3. Sign-In/Sign-Up Pages
- **Files**: 
  - `web/src/app/(home)/sign-in/page.tsx`
  - `web/src/app/(home)/sign-up/page.tsx`
- Added `handleAppleSignIn` / `handleAppleSignUp` functions
- Added state management for Apple loading state

#### 4. UI Component
- **File**: `web/src/components/auth/auth-screen.tsx`
- Added Apple icon SVG component
- Added "Continue with Apple" button

### Mobile App - `/mobile`

#### 1. Environment Configuration
- **File**: `mobile/.env.example`
- Added Apple OAuth credentials (same as web):
  - `EXPO_PUBLIC_APPLE_CLIENT_ID`
  - `EXPO_PUBLIC_APPLE_CLIENT_SECRET`
  - `EXPO_PUBLIC_APPLE_APP_BUNDLE_IDENTIFIER`

#### 2. Apple Auth Service
- **File**: `mobile/lib/auth/social-apple.ts` (NEW)
- Created Apple-specific auth handler similar to Google
- Implements single-flight pattern to prevent duplicate requests
- Uses expo-web-browser for OAuth flow

#### 3. Sign-In/Sign-Up Screens
- **Files**:
  - `mobile/app/(auth)/sign-in.tsx`
  - `mobile/app/(auth)/sign-up.tsx`
- Added `handleAppleSignIn` / `handleAppleSignUp` callbacks
- Integrated with existing error handling
- Network error detection included

#### 4. UI Component
- **File**: `mobile/components/auth/AuthScreenShell.tsx`
- Added optional Apple button props
- Added Apple logo (using Apple emoji )
- Styled to match Google button design
- Conditional rendering when Apple props provided

## Setup Instructions

### 1. Get Apple OAuth Credentials

Follow these steps in the [Apple Developer Portal](https://developer.apple.com/account/resources/authkeys/list):

1. **Create an App ID**:
   - Go to Certificates, Identifiers & Profiles
   - Create new App ID with Bundle ID (e.g., `com.yourcompany.yourapp.ai`)
   - Enable "Sign In with Apple" capability

2. **Create a Service ID**:
   - Create new Service ID (e.g., `com.yourcompany.yourapp.si`)
   - This becomes your `APPLE_CLIENT_ID`
   - Configure with your domains and callback URLs:
     - Web: `https://yourdomain.com/api/auth/callback/apple`
     - Mobile: `flinote://sign-in` (or your custom scheme)

3. **Create a Key**:
   - Generate a new key with "Sign In with Apple" enabled
   - Download the `.p8` file (only available once!)
   - Note your Key ID and Team ID

4. **Generate Client Secret (JWT)**:
   - Use the .p8 key, Key ID, and Team ID to generate a JWT
   - Maximum expiration: 6 months (180 days)
   - You'll need to regenerate before expiration

### 2. Configure Environment Variables

#### Study App
Copy `study-app/.env.example` to `study-app/.env` and fill in:
```env
APPLE_CLIENT_ID=com.yourcompany.yourapp.si
APPLE_CLIENT_SECRET=your_generated_jwt_here
APPLE_APP_BUNDLE_IDENTIFIER=com.yourcompany.yourapp.ai
```

#### Web App
Copy `web/.env.example` to `web/.env` and fill in:
```env
APPLE_CLIENT_ID=com.yourcompany.yourapp.si
APPLE_CLIENT_SECRET=your_generated_jwt_here
APPLE_APP_BUNDLE_IDENTIFIER=com.yourcompany.yourapp.ai
```

#### Mobile App
Copy `mobile/.env.example` to `mobile/.env` and fill in:
```env
EXPO_PUBLIC_APPLE_CLIENT_ID=com.yourcompany.yourapp.si
EXPO_PUBLIC_APPLE_CLIENT_SECRET=your_generated_jwt_here
EXPO_PUBLIC_APPLE_APP_BUNDLE_IDENTIFIER=com.yourcompany.yourapp.ai
```

### 3. Important Notes

#### Localhost Restrictions
- Apple Sign-In does NOT support `localhost` or non-HTTPS URLs
- During development, you must use:
  - A domain with valid HTTPS/TLS certificate
  - Tools like ngrok for local testing
  - Update `BETTER_AUTH_URL` to your HTTPS URL

#### Mobile Considerations
- On native iOS, Apple uses the App Bundle ID as client ID (not Service ID)
- The `appBundleIdentifier` config handles this automatically
- For ID token validation, Better Auth will use the correct identifier

#### Client Secret Expiration
- Apple JWT expires in max 6 months
- Set a reminder to regenerate before expiration
- Update environment variables when regenerating

## Testing

### Web App
1. Start the development server with HTTPS (ngrok or similar)
2. Navigate to sign-in or sign-up page
3. Click "Continue with Apple"
4. Complete Apple authentication
5. Should redirect to `/dashboard` on success

### Mobile App
1. Ensure backend is accessible from mobile device
2. Update `EXPO_PUBLIC_API_URL` to your backend URL
3. Run the app on iOS device or simulator
4. Navigate to sign-in or sign-up screen
5. Tap "Continue with Apple"
6. Complete Apple authentication
7. Should navigate to home screen on success

## Files Modified

### Study App
- `study-app/.env.example`
- `study-app/src/lib/auth.ts`
- `study-app/src/app/(home)/sign-in/page.tsx`
- `study-app/src/app/(home)/sign-up/page.tsx`
- `study-app/src/components/auth/auth-screen.tsx`

### Web App
- `web/.env.example`
- `web/src/lib/auth.ts`
- `web/src/app/(home)/sign-in/page.tsx`
- `web/src/app/(home)/sign-up/page.tsx`
- `web/src/components/auth/auth-screen.tsx`

### Mobile App
- `mobile/.env.example`
- `mobile/lib/auth/social-apple.ts` (NEW)
- `mobile/app/(auth)/sign-in.tsx`
- `mobile/app/(auth)/sign-up.tsx`
- `mobile/components/auth/AuthScreenShell.tsx`

## Additional Resources

- [Better Auth Apple Provider Docs](https://www.better-auth.com/docs/authentication/social)
- [Apple Developer Portal](https://developer.apple.com/account/resources/authkeys/list)
- [Creating Apple Client Secret](https://developer.apple.com/documentation/accountorganizationaldatasharing/creating-a-client-secret)
- [Better Auth JWT Generator](https://www.better-auth.com/docs/authentication/social#generate-apple-client-secret-jwt)

## Troubleshooting

### "Invalid client" error
- Verify Service ID matches `APPLE_CLIENT_ID`
- Check callback URL is correctly configured in Apple Developer Portal

### "Invalid client secret" error
- JWT may be expired (max 6 months)
- Regenerate JWT with correct Key ID and Team ID

### Localhost not working
- Apple requires HTTPS - use ngrok or similar
- Update `BETTER_AUTH_URL` to HTTPS URL

### Mobile "Network request failed"
- Check `EXPO_PUBLIC_API_URL` is accessible from device
- Use LAN IP instead of localhost for physical devices
- Verify backend is running and reachable
