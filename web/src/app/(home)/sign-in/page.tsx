"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Sparkles, Quote } from "lucide-react";

export default function SignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

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
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
      
      // If we get here without error, the redirect should happen automatically
      console.log("Google sign in initiated:", result);
    } catch (error: any) {
      console.error("Google sign in error:", error);
      
      // More detailed error message
      if (error.message?.includes("fetch")) {
        toast.error("Cannot connect to authentication server. Make sure the dev server is running.");
      } else {
        toast.error(error.message || "Failed to sign in with Google");
      }
      
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      {/* Left Column: Form */}
      <div className="flex flex-col justify-between p-8 md:p-12 lg:p-16 bg-background relative">
        <Link
          href="/"
          className="absolute top-8 left-8 md:left-12 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="flex flex-col justify-center flex-1 max-w-[400px] mx-auto w-full animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Welcome back
            </h1>
            <p className="text-muted-foreground">
              Enter your credentials to access your workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 relative"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
              )}
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or sign in with email
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="h-11 bg-secondary/20 border-border/50 focus:border-primary/50 transition-colors"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-11 bg-secondary/20 border-border/50 focus:border-primary/50 transition-colors"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="font-medium text-primary hover:underline transition-all"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Footer Text */}
        <div className="hidden lg:block text-xs text-muted-foreground">
          © 2024 JelliNote AI.
        </div>
      </div>

      {/* Right Column: Visual */}
      <div className="hidden lg:flex flex-col justify-center items-center relative bg-muted/20 text-foreground overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        {/* Abstract Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />

        <div className="relative z-10 p-12 max-w-lg text-center">
          <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm border border-border/50">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>

          <blockquote className="space-y-6">
            <div className="text-2xl font-medium leading-relaxed">
              &ldquo;JelliNote completely transformed how I study for my medical
              exams. The automated flashcards are a lifesaver.&rdquo;
            </div>
            <footer className="text-sm">
              <div className="font-semibold">Sarah Chen</div>
              <div className="text-muted-foreground">
                Med Student @ Stanford
              </div>
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
