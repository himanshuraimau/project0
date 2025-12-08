# Better Auth Mobile Migration - Remaining Steps

## ✅ Completed So Far

1. ✅ Installed Better Auth packages (`better-auth`, `@better-auth/expo`)
2. ✅ Created `metro.config.js` with package exports enabled
3. ✅ Updated `.env` with correct API URL
4. ✅ Created `lib/auth/auth-client.ts` with Better Auth configuration
5. ✅ Updated `lib/auth/index.ts` to export auth client
6. ✅ Removed ClerkProvider from `app/_layout.tsx`
7. ✅ Updated `AuthTokenProvider` to use Better Auth sessions

## 🚧 Remaining Steps

### Phase 4: Update Auth Screens

#### File: `app/(auth)/sign-in.tsx`

Replace the entire file with:

```typescript
import { authClient } from '@/lib/auth/auth-client'
import { LinearGradient } from 'expo-linear-gradient'
import { Link, useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import React, { useCallback, useEffect, useState } from 'react'
import { Text, View, Image, TouchableOpacity, StyleSheet, StatusBar, TextInput } from 'react-native'
import { markOnboardingCompleted } from '@/lib/storage/onboardingStorage'
import { Ionicons } from '@expo/vector-icons'

WebBrowser.maybeCompleteAuthSession()

export default function Page() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    void WebBrowser.warmUpAsync()
    return () => {
      void WebBrowser.coolDownAsync()
    }
  }, [])

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setLoading(true)
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/(home)"
      })
      
      // Mark onboarding as completed
      try {
        await markOnboardingCompleted()
        console.log('✅ Onboarding marked as completed')
      } catch (error) {
        console.error('Failed to mark onboarding complete:', error)
      }
      
      router.replace("/(home)")
    } catch (err) {
      console.error("Google OAuth error", err)
    } finally {
      setLoading(false)
    }
  }, [router])

  const handleEmailSignIn = useCallback(async () => {
    try {
      setLoading(true)
      await authClient.signIn.email({
        email,
        password,
      })
      
      await markOnboardingCompleted()
      router.replace("/(home)")
    } catch (err) {
      console.error("Email sign-in error", err)
      alert("Sign in failed. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }, [email, password, router])

  // Keep the rest of the UI the same, just update the button handlers
  return (
    <LinearGradient
      colors={["#FFFFFF", "#F7F5FF"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0.3, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        {/* ... existing logo and text ... */}
        
        {/* Add email/password inputs */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={styles.emailBtn}
            onPress={handleEmailSignIn}
            disabled={loading}
          >
            <Text style={styles.emailBtnText}>
              {loading ? "Signing in..." : "Sign in with Email"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.orText}>OR</Text>

        <TouchableOpacity
          style={styles.googleBtn}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          {/* ... existing Google button UI ... */}
        </TouchableOpacity>

        {/* ... existing footer ... */}
      </View>
    </LinearGradient>
  )
}

// Keep existing styles
const styles = StyleSheet.create({
  // ... existing styles ...
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emailBtn: {
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  emailBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  orText: {
    textAlign: 'center',
    marginVertical: 16,
    color: '#666',
  },
})
```

#### File: `app/(auth)/sign-up.tsx`

Similar updates - replace Clerk OAuth with Better Auth:

```typescript
import { authClient } from '@/lib/auth/auth-client'
// ... same structure as sign-in but using authClient.signUp.email()
```

### Phase 5: Update Middleware

#### File: `lib/middleware/redirectMiddleware.ts`

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

### Phase 6: Update API Client

#### File: `lib/api/client.ts`

Replace the Clerk token interceptor:

```typescript
import axios from 'axios';
import { authClient } from '@/lib/auth/auth-client';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,  // Important for cookies!
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add session cookies
apiClient.interceptors.request.use(
  async (config) => {
    console.log('📤 Making API Request:', config.url);
    
    try {
      // Get session cookies from Better Auth
      const cookies = authClient.getCookie();
      
      if (cookies && config.headers) {
        config.headers['Cookie'] = cookies;
        console.log('✅ Added session cookies to request');
      }
    } catch (error) {
      console.error('❌ Error getting session cookies:', error);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Keep existing response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', response.status);
    return response;
  },
  async (error) => {
    console.error('❌ API Error:', error.response?.status);
    
    if (error.response?.status === 401) {
      console.log('🔐 Unauthorized - session may be invalid');
      // Optionally redirect to sign-in
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Phase 7: Update SubscriptionContext

#### File: `lib/contexts/SubscriptionContext.tsx`

Replace Clerk auth checks:

```typescript
import { useSession } from '@/lib/auth/auth-client';

export const SubscriptionProvider = ({ children }) => {
  const { data: session } = useSession();
  
  // Use session?.user instead of Clerk's isSignedIn
  const isSignedIn = !!session?.user;
  
  // Rest of the logic remains the same
  // ...
};
```

### Phase 8: Remove Clerk

```bash
cd mobile
npm uninstall @clerk/clerk-expo
```

Remove these files:
- `lib/auth/cache.ts` (Clerk token cache)

Search and remove any remaining Clerk imports:
```bash
grep -r "@clerk" . --exclude-dir=node_modules
```

### Phase 9: Test

1. Start the backend:
```bash
cd web
npm run dev
```

2. Start the mobile app:
```bash
cd mobile
npm start
```

3. Test authentication flows:
   - Sign up with email/password
   - Sign in with email/password
   - Sign in with Google
   - Sign out
   - API calls work
   - Session persists after app restart

## Important Notes

1. **Backend URL**: Make sure `EXPO_PUBLIC_API_URL` points to your running Next.js backend
2. **Cookies**: Better Auth uses cookies for sessions. The `withCredentials: true` in axios is crucial
3. **Deep Linking**: The scheme "mobile" is already configured in app.config.ts
4. **Testing**: Test on both iOS and Android if possible

## Troubleshooting

### "No session found"
- Check backend is running at correct URL
- Verify CORS settings in backend allow mobile origin
- Check cookies are being sent with requests

### "OAuth callback failed"
- Verify scheme is "mobile" in both app.config.ts and auth-client.ts
- Check Google OAuth redirect URLs in Google Cloud Console
- Try `expo://` scheme in development

### "API calls return 401"
- Session cookies not being sent - check withCredentials
- Backend not recognizing session - check Better Auth config
- Token provider not working - check AuthTokenProvider logs

## Next Steps After Migration

1. Update documentation
2. Add email verification flow
3. Add password reset
4. Add 2FA (optional)
5. Update app store description
6. Monitor error logs

---

**Migration Status**: 70% Complete
**Estimated Time Remaining**: 1-2 hours
