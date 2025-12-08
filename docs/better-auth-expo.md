Based on the Better Auth documentation, here's your comprehensive execution plan for implementing Better Auth in your Next.js + Expo application:

## 🎯 **Execution Plan for Better Auth Implementation**

### **Architecture Overview**
- **Backend**: Next.js API routes (`/api/auth/[...all]`)
- **Frontend 1**: Next.js web app
- **Frontend 2**: Expo mobile app (iOS/Android)
- **Shared Auth**: Single Better Auth instance serving all platforms

---

## **Phase 1: Backend Setup (Next.js API)**

### 1. **Install Dependencies**
```bash
npm install better-auth @better-auth/expo
npm install @prisma/client prisma  # or your preferred DB adapter
```

### 2. **Configure Environment Variables**
Create/update `.env`:
```env
BETTER_AUTH_SECRET=your-secret-key-min-32-chars  # Generate with: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000  # Your Next.js base URL
DATABASE_URL=your-database-connection-string
```

### 3. **Create Auth Instance**
Create `lib/auth.ts`:
```typescript
import { betterAuth } from "better-auth";
import { expo } from "@better-auth/expo";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or mysql, sqlite
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    // Add other providers as needed
  },
  trustedOrigins: [
    "myapp://",  // Your Expo app scheme
    ...(process.env.NODE_ENV === "development" ? [
      "exp://*/*",
      "exp://192.168.*.*:*/*",
      "exp://localhost:*/*"
    ] : [])
  ],
  plugins: [
    expo()  // Enable Expo support
  ]
});
```

### 4. **Create API Route Handler**
Create `app/api/auth/[...all]/route.ts`:
```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

### 5. **Setup Database**
Run migrations to create necessary tables:
```bash
npx prisma migrate dev
```

---

## **Phase 2: Next.js Web Frontend**

### 1. **Install Client Dependencies**
```bash
npm install better-auth
```

### 2. **Create Auth Client**
Create `lib/auth-client.ts`:
```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

### 3. **Add Server Actions Plugin (Optional)**
Update `lib/auth.ts` to support Next.js server actions:
```typescript
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  // ... other config
  plugins: [
    expo(),
    nextCookies()  // Handles cookies in server actions
  ]
});
```

### 4. **Create Auth Pages**
**Sign In Page** (`app/sign-in/page.tsx`):
```typescript
"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSignIn = async () => {
    await authClient.signIn.email({ email, password });
    router.push("/dashboard");
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSignIn(); }}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Sign In</button>
    </form>
  );
}
```

### 5. **Protect Routes**
**Protected Page** (`app/dashboard/page.tsx`):
```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/sign-in");
  }

  return <h1>Welcome {session.user.name}</h1>;
}
```

### 6. **Optional: Add Middleware Protection**
Create `proxy.ts` (Next.js 16) or `middleware.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/protected/:path*"]
};
```

---

## **Phase 3: Expo Mobile App**

### 1. **Install Dependencies**
```bash
npm install better-auth @better-auth/expo expo-secure-store expo-linking expo-web-browser expo-constants
```

### 2. **Configure Metro Bundler**
Create/update `metro.config.js`:
```javascript
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
```

### 3. **Configure App Scheme**
Update `app.json`:
```json
{
  "expo": {
    "scheme": "myapp",
    "name": "Your App"
  }
}
```

### 4. **Create Auth Client**
Create `lib/auth-client.ts`:
```typescript
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",  // Your Next.js backend URL
  plugins: [
    expoClient({
      scheme: "myapp",
      storagePrefix: "myapp",
      storage: SecureStore,
    })
  ]
});
```

### 5. **Create Auth Screens**
**Sign In Screen** (`app/sign-in.tsx`):
```typescript
import { useState } from "react";
import { View, TextInput, Button } from "react-native";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "expo-router";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    await authClient.signIn.email({ email, password });
    router.replace("/dashboard");
  };

  return (
    <View>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}
```

### 6. **Access Session**
```typescript
import { Text } from "react-native";
import { authClient } from "@/lib/auth-client";

export default function Dashboard() {
  const { data: session } = authClient.useSession();
  
  return <Text>Welcome, {session?.user.name}</Text>;
}
```

### 7. **Make Authenticated API Requests**
```typescript
const makeAuthenticatedRequest = async () => {
  const cookies = authClient.getCookie();
  
  const response = await fetch("http://localhost:3000/api/secure-endpoint", {
    headers: {
      "Cookie": cookies,
    },
    credentials: "omit"
  });
  
  return response.json();
};
```

---

## **Phase 4: Advanced Features**

### 1. **Social Sign-In (Google, Apple, etc.)**
**Next.js**:
```typescript
await authClient.signIn.social({
  provider: "google",
  callbackURL: "/dashboard"
});
```

**Expo**:
```typescript
await authClient.signIn.social({
  provider: "google",
  callbackURL: "/dashboard"  // Converts to myapp://dashboard on native
});
```

### 2. **Two-Factor Authentication**
Add to `lib/auth.ts`:
```typescript
import { twoFactor } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    expo(),
    twoFactor()
  ]
});
```

### 3. **Session Management**
```typescript
// Refresh session
await authClient.session.refresh();

// Sign out
await authClient.signOut();
```

---

## **Phase 5: Testing & Deployment**

### 1. **Test Locally**
```bash
# Terminal 1 - Next.js
npm run dev

# Terminal 2 - Expo
npx expo start
```

### 2. **Update Environment Variables for Production**
```env
BETTER_AUTH_URL=https://yourdomain.com
# Update trusted origins in auth.ts
```

### 3. **Deploy Considerations**
- Ensure `DATABASE_URL` points to production database
- Set secure `BETTER_AUTH_SECRET`
- Configure OAuth callback URLs for production domain
- Update Expo `scheme` for production builds

---

## **Key Points to Remember**

✅ **Single auth instance** serves both web and mobile  
✅ **Expo plugin** handles deep linking and secure storage  
✅ **Session cookies** automatically managed  
✅ **Server-side validation** in Next.js API routes  
✅ **Trusted origins** must include Expo scheme  
✅ **SecureStore** for mobile token storage  

This architecture gives you a unified authentication system across web and mobile with minimal code duplication!