"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { AuthScreen } from "@/components/auth/auth-screen";
import { toast } from "sonner";

export default function SignIn() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to sign in with Google";
      toast.error(message);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex h-screen min-h-0 w-full items-center justify-center overflow-hidden bg-background text-foreground">
      <div className="flex w-full min-h-0 items-center justify-center overflow-y-auto px-6 py-12 sm:px-10 md:px-16 lg:px-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <AuthScreen
          mode="sign-in"
          onGoogleClick={handleGoogleSignIn}
          isGoogleLoading={isGoogleLoading}
        />
      </div>
    </div>
  );
}
