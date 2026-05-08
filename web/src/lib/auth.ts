import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { expo } from "@better-auth/expo";
import { importPKCS8, SignJWT } from "jose";
import { prisma } from "./prisma";

const appUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
const usingHttpsAppUrl = appUrl.startsWith("https://");

async function generateAppleClientSecret() {
  const privateKey = process.env.APPLE_PRIVATE_KEY;
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const clientId = process.env.APPLE_CLIENT_ID;

  if (!privateKey || !teamId || !keyId || !clientId) return undefined;

  const key = await importPKCS8(privateKey, "ES256");
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setSubject(clientId)
    .setAudience("https://appleid.apple.com")
    .setIssuedAt(now)
    .setExpirationTime(now + 180 * 24 * 60 * 60)
    .sign(key);
}

const appleClientSecret = await generateAppleClientSecret();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production with email service
  },

  // Always prefer explicit public URL config (ngrok/Vercel/custom domain) to avoid
  // OAuth callback mismatches when NODE_ENV is development.
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === "development" ? "http://localhost:3000/" : undefined),

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID as string,
      clientSecret: appleClientSecret!,
      appBundleIdentifier: process.env.APPLE_APP_BUNDLE_IDENTIFIER as string,
    },
  },

  // Advanced configuration
  advanced: {
    // OAuth state cookies can be rejected on HTTPS dev domains if not secure.
    useSecureCookies: process.env.NODE_ENV === "production" || usingHttpsAppUrl,
    cookiePrefix: "better-auth",
  },

  // Trust requests from mobile app
  trustedOrigins: [
    "http://localhost:8081", // Expo dev server
    "flinote://", // Mobile app scheme
    "flinote://*", // Mobile app scheme with paths
    "Flinote://", // Mobile app scheme (capitalized variant)
    "mobile://", // Legacy mobile scheme (for backward compatibility)
    "exp://", // Expo Go scheme
    "exp://**", // Expo Go wildcard support in development
    "https://appleid.apple.com", // Apple Sign In
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    process.env.BETTER_AUTH_URL || "",
  ].filter(Boolean),

  // Enable the nextCookies plugin for server actions
  plugins: [
    nextCookies(),
    expo(), // Enable Expo support for mobile app
  ],
});

// Export type inference for client
export type Session = typeof auth.$Infer.Session;
