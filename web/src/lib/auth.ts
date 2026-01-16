import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { expo } from "@better-auth/expo";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production with email service
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  // Advanced configuration
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "better-auth",
  },

  // Trust requests from mobile app
  trustedOrigins: [
    "http://localhost:8081", // Expo dev server
    "Flinote://", // Mobile app scheme
    "mobile://", // Legacy mobile scheme (for backward compatibility)
    "exp://", // Expo Go scheme
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
