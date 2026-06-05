"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { AuthScreen } from "@/components/auth/auth-screen";
import { useRedirectIfAuthenticated } from "@/components/auth/use-redirect-if-authenticated";
import { toast } from "sonner";

export default function SignUp() {
  const { session, isPending } = useRedirectIfAuthenticated("/dashboard");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  if (isPending || session?.user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to sign up with Google";
      toast.error(message);
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignUp = async () => {
    setIsAppleLoading(true);
    try {
      await authClient.signIn.social({
        provider: "apple",
        callbackURL: "/dashboard",
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to sign up with Apple";
      toast.error(message);
      setIsAppleLoading(false);
    }
  };

  return (
    <div className="flex h-screen min-h-0 w-full items-center justify-center overflow-hidden bg-background text-foreground">
      <div className="flex w-full min-h-0 items-center justify-center overflow-y-auto px-6 py-12 sm:px-10 md:px-16 lg:px-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <AuthScreen
          mode="sign-up"
          onGoogleClick={handleGoogleSignUp}
          isGoogleLoading={isGoogleLoading}
          onAppleClick={handleAppleSignUp}
          isAppleLoading={isAppleLoading}
        />
      </div>
    </div>
  );
}
