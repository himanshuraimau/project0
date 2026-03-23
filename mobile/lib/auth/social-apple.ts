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

export async function signInWithAppleSingleFlight(
  callbackURL: string
): Promise<AppleSocialSignInResult> {
  if (isAppleSignInInFlight) {
    return { skipped: true };
  }

  isAppleSignInInFlight = true;
  try {
    const response = await authClient.signIn.social({
      provider: "apple",
      callbackURL,
    });
    return { skipped: false, response };
  } finally {
    isAppleSignInInFlight = false;
  }
}
