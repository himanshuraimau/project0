import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

// EXPO_PUBLIC_API_URL intentionally contains the API prefix (e.g. http://192.168.1.6:3000/api)
// but the Better Auth client expects the backend root (no /api suffix). Strip any trailing
// /api so the auth client posts to the correct endpoints (e.g. http://192.168.1.6:3000).
const rawApiUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
const AUTH_BASE_URL = rawApiUrl.replace(/\/api\/?$/i, "");

export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL,
  plugins: [
    expoClient({
      scheme: "mobile",
      storagePrefix: "better-auth", // MUST match backend cookiePrefix
      storage: SecureStore,
    })
  ]
});

// Export commonly used methods
export const { signIn, signUp, signOut, useSession } = authClient;
