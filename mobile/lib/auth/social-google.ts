import * as WebBrowser from "expo-web-browser";
import { authClient } from "./auth-client";

let didCompleteAuthSession = false;
let isGoogleSignInInFlight = false;

export function maybeCompleteAuthSessionOnce() {
  if (didCompleteAuthSession) {
    return;
  }
  WebBrowser.maybeCompleteAuthSession();
  didCompleteAuthSession = true;
}

type GoogleSocialSignInResult =
  | { skipped: true }
  | { skipped: false; response: Awaited<ReturnType<typeof authClient.signIn.social>> };

export async function signInWithGoogleSingleFlight(
  callbackURL: string
): Promise<GoogleSocialSignInResult> {
  if (isGoogleSignInInFlight) {
    return { skipped: true };
  }

  isGoogleSignInInFlight = true;
  try {
    const response = await authClient.signIn.social({
      provider: "google",
      callbackURL,
    });
    return { skipped: false, response };
  } finally {
    isGoogleSignInInFlight = false;
  }
}
