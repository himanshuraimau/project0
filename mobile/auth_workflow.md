# Authentication Workflow

This document outlines the authentication implementation in the project, which uses **Clerk** (`@clerk/clerk-expo`) for user management and **Expo Secure Store** for token persistence.

## 1. Configuration & Setup

### Provider Initialization
The authentication provider is set up in `app/_layout.tsx`. It wraps the entire application with `ClerkProvider`.

- **Publishable Key**: Loaded from `process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.
- **Token Cache**: A custom `tokenCache` is provided to persist sessions across app restarts.

```typescript
// app/_layout.tsx
<ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
  <AuthTokenProvider>
    {/* ... other providers ... */}
  </AuthTokenProvider>
</ClerkProvider>
```

### Token Persistence
Located in `lib/auth/cache.ts`.
- Uses `expo-secure-store` to securely store the Clerk JWT.
- Implements `getToken` and `saveToken` methods required by Clerk.
- **Note**: SecureStore is only used on native platforms (iOS/Android), not web.

## 2. Token Management & API Integration

The project bridges the React-based Clerk hooks with a non-React Axios API client.

### AuthTokenProvider
Located in `components/auth/AuthTokenProvider.tsx`.
- This component is rendered inside `ClerkProvider`.
- It uses the `useAuth()` hook to access the current user's session.
- It registers a **token getter function** with the global API client.

```typescript
// components/auth/AuthTokenProvider.tsx
const { getToken, isSignedIn } = useAuth();

useEffect(() => {
  const tokenProvider = async () => {
    if (!isSignedIn) return null;
    return await getToken();
  };
  setTokenProvider(tokenProvider);
}, [getToken, isSignedIn]);
```

### API Client Interceptor
Located in `lib/api/client.ts`.
- The Axios instance has a request interceptor.
- It calls the registered token getter (from `AuthTokenProvider`) before every request.
- Appends the `Authorization: Bearer <token>` header.

```typescript
// lib/api/client.ts
apiClient.interceptors.request.use(async (config) => {
  if (clerkGetToken) {
    const token = await clerkGetToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
```

## 3. Authentication Flows

### Sign In
Located in `app/(auth)/sign-in.tsx`.
- **Methods**: Email/Password, Google OAuth.
- **Hook**: `useSignIn()`.
- **Process**:
    1.  User enters credentials or clicks Google Sign In.
    2.  `signIn.create()` is called.
    3.  On success (`status === 'complete'`), `setActive({ session: ... })` is called.
    4.  User is redirected to `/(home)`.

### Sign Up
Located in `app/(auth)/sign-up.tsx`.
- **Methods**: Email/Password, Google OAuth.
- **Hook**: `useSignUp()`.
- **Process**:
    1.  **Step 1**: User enters email/password. `signUp.create()` is called.
    2.  **Step 2**: Email verification. `signUp.prepareEmailAddressVerification()` sends an OTP.
    3.  **Step 3**: User enters OTP. `signUp.attemptEmailAddressVerification()` is called.
    4.  On success, `setActive({ session: ... })` is called.
    5.  User is redirected to `/(home)`.

## 4. Directory Structure

- **`app/_layout.tsx`**: Main provider setup.
- **`app/(auth)/`**: Authentication screens (Sign In, Sign Up).
- **`components/auth/`**: Auth-related components (`AuthTokenProvider`, `SignOutButton`).
- **`lib/auth/cache.ts`**: Token persistence logic.
- **`lib/api/client.ts`**: API client with auth interceptor.
