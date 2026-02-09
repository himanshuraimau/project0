"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AuthComparison } from "@/components/landing/auth-comparison";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function SignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
      });
      if (error) {
        toast.error(error.message || "Failed to sign in");
        setIsLoading(false);
        return;
      }
      if (data) {
        toast.success("Signed in successfully!");
        router.push("/dashboard");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="grid h-full min-h-0 w-full grid-cols-1 bg-background text-foreground lg:grid-cols-2">
      <div className="flex flex-col justify-between px-6 py-12 sm:px-10 md:px-16 lg:px-20">
        <div className="mx-auto w-full max-w-[380px] flex-1 flex flex-col justify-center">
          <div className="mb-10 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
              <Image
                src="/logo.png"
                alt=""
                width={32}
                height={32}
                className="object-contain invert"
              />
            </div>
          </div>
          <h1 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welcome to Flinote
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Log in or sign in with your email.
          </p>

          <div className="mt-8 space-y-4">
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <GoogleIcon className="mr-3 h-5 w-5 text-primary-foreground" />
              )}
              Continue with Google
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-neutral-100 dark:border-neutral-800" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Or with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, email: e.target.value }))
                  }
                  required
                  disabled={isLoading}
                  className="h-12 rounded-xl border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, password: e.target.value }))
                  }
                  required
                  disabled={isLoading}
                  className="h-12 rounded-xl border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-xl bg-foreground font-semibold text-background hover:bg-foreground/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="font-semibold text-foreground hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>

        <footer className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Flinote uses secure authentication.{" "}
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            {" · "}
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </p>
        </footer>
      </div>

      <div className="hidden border-l border-border bg-muted/20 lg:flex lg:flex-col lg:justify-center lg:px-16 lg:py-16">
        <AuthComparison />
      </div>
    </div>
  );
}
