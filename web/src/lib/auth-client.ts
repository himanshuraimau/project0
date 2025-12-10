import { createAuthClient } from "better-auth/react";
import type { Session } from "./auth";

// Use correct base URL for development vs production
const getBaseURL = () => {
  // In development, use localhost
  if (process.env.NODE_ENV === "development") {
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  }
  // In production, use the configured URL
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});

// Export commonly used methods for convenience
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  $Infer,
} = authClient;

// Type exports
export type { Session };
