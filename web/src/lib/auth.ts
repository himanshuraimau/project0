import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { expo } from "@better-auth/expo";
import { createRemoteJWKSet, decodeJwt, importPKCS8, jwtVerify, SignJWT } from "jose";
import { prisma } from "./prisma";

const appUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
const usingHttpsAppUrl = appUrl.startsWith("https://");

async function generateAppleClientSecret() {
  const privateKeyRaw = process.env.APPLE_PRIVATE_KEY;
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const clientId = process.env.APPLE_CLIENT_ID;

  if (!privateKeyRaw || !teamId || !keyId || !clientId) return undefined;

  // Common env-var format is a single-line string with literal `\n`.
  const privateKey = privateKeyRaw.includes("\\n")
    ? privateKeyRaw.replace(/\\n/g, "\n")
    : privateKeyRaw;

  try {
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
  } catch (err) {
    console.warn(
      "Apple client secret generation failed; Apple Sign In will be disabled until APPLE_PRIVATE_KEY is fixed.",
      err
    );
    return undefined;
  }
}

const appleClientSecret = await generateAppleClientSecret();

// better-auth's built-in verifyIdToken swallows every failure (bad audience, bad nonce,
// expired token, JWKS fetch error) into the same generic `false` -> "Invalid token".
// This mirrors its logic but logs the actual decoded claims and the specific check that
// failed, so a rejected sign-in tells us *why* instead of just *that*.
const appleJWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

async function verifyAppleIdTokenWithLogging(token: string, nonce?: string) {
  const expectedAudience = process.env.APPLE_APP_BUNDLE_IDENTIFIER as string;

  try {
    const claims = decodeJwt(token);
    console.log("[apple-verify] unverified claims:", {
      aud: claims.aud,
      iss: claims.iss,
      nonce: claims.nonce,
      exp: claims.exp,
      expectedAudience,
      expectedNonce: nonce,
    });
  } catch (err) {
    console.error("[apple-verify] could not even decode token:", err);
    return false;
  }

  try {
    const { payload } = await jwtVerify(token, appleJWKS, {
      issuer: "https://appleid.apple.com",
      audience: expectedAudience,
      maxTokenAge: "1h",
    });

    if (nonce && payload.nonce !== nonce) {
      console.error("[apple-verify] NONCE MISMATCH", { expected: nonce, got: payload.nonce });
      return false;
    }

    console.log("[apple-verify] verification succeeded");
    return !!payload;
  } catch (err) {
    console.error("[apple-verify] jwtVerify rejected the token:", err);
    return false;
  }
}

const appleProvider =
  appleClientSecret && process.env.APPLE_CLIENT_ID && process.env.APPLE_APP_BUNDLE_IDENTIFIER
    ? {
        clientId: process.env.APPLE_CLIENT_ID as string,
        clientSecret: appleClientSecret,
        appBundleIdentifier: process.env.APPLE_APP_BUNDLE_IDENTIFIER as string,
        verifyIdToken: verifyAppleIdTokenWithLogging,
      }
    : undefined;

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
    ...(appleProvider ? { apple: appleProvider } : {}),
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
    "flinote://sign-in", // Mobile OAuth return path
    "Flinote://", // Mobile app scheme (capitalized variant)
    "Flinote://sign-in",
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
