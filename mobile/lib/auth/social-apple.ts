import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { authClient } from "./auth-client";

let didCompleteAuthSession = false;
let isAppleSignInInFlight = false;

export function maybeCompleteAuthSessionOnce() {
  if (didCompleteAuthSession) {
    return;
  }
  WebBrowser.maybeCompleteAuthSession();
  didCompleteAuthSession = true;
}

type AppleSocialSignInResult =
  | { skipped: true }
  | { skipped: false; response: Awaited<ReturnType<typeof authClient.signIn.social>> };

const NONCE_CHARSET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._";

async function generateRawNonce(length = 32): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += NONCE_CHARSET[randomBytes[i] % NONCE_CHARSET.length];
  }
  return result;
}

// Native Sign In with Apple: no browser, no redirect_uri, no OAuth proxy hop.
// Apple's own ASAuthorizationController hands us a verifiable identityToken directly.
async function signInWithAppleNative(): Promise<AppleSocialSignInResult> {
  const rawNonce = await generateRawNonce();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!credential.identityToken) {
    throw new Error("Apple sign-in did not return an identity token.");
  }

  const response = await authClient.signIn.social({
    provider: "apple",
    idToken: {
      token: credential.identityToken,
      nonce: rawNonce,
    },
  });

  return { skipped: false, response };
}

// Fallback for platforms without native Sign In with Apple (Android/web).
async function signInWithAppleWeb(
  callbackURL: string
): Promise<AppleSocialSignInResult> {
  const response = await authClient.signIn.social({
    provider: "apple",
    callbackURL,
  });
  return { skipped: false, response };
}

export async function signInWithAppleSingleFlight(
  callbackURL: string
): Promise<AppleSocialSignInResult> {
  if (isAppleSignInInFlight) {
    return { skipped: true };
  }

  isAppleSignInInFlight = true;
  try {
    if (Platform.OS === "ios" && (await AppleAuthentication.isAvailableAsync())) {
      try {
        return await signInWithAppleNative();
      } catch (err) {
        if ((err as { code?: string })?.code === "ERR_REQUEST_CANCELED") {
          return { skipped: true };
        }
        throw err;
      }
    }
    return await signInWithAppleWeb(callbackURL);
  } finally {
    isAppleSignInInFlight = false;
  }
}
