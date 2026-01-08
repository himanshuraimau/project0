"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

export default function SignUp() {
  const router = useRouter();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? '#000000' : '#ffffff',
    bgSecondary: isDark ? '#171717' : '#f9fafb',
    text: isDark ? '#ffffff' : '#000000',
    textMuted: isDark ? '#a3a3a3' : '#737373',
    textSubtle: isDark ? '#737373' : '#a3a3a3',
    border: isDark ? '#262626' : '#e5e5e5',
    borderLight: isDark ? '#404040' : '#d4d4d4',
    input: isDark ? '#171717' : '#f4f4f5',
    inputBorder: isDark ? '#262626' : '#d4d4d4',
    buttonPrimary: isDark ? '#ffffff' : '#000000',
    buttonPrimaryText: isDark ? '#000000' : '#ffffff',
    buttonSecondary: isDark ? '#000000' : '#ffffff',
    buttonSecondaryText: isDark ? '#ffffff' : '#000000',
    buttonSecondaryBorder: isDark ? '#262626' : '#e5e5e5',
    buttonSecondaryHover: isDark ? '#171717' : '#f4f4f5',
    grid: isDark ? '#404040' : '#e5e5e5',
    gridOpacity: isDark ? 0.2 : 0.4,
    glow: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    glowSize: isDark ? '600px' : '500px',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await authClient.signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });

      if (error) {
        toast.error(error.message || "Failed to sign up");
        setIsLoading(false);
        return;
      }

      if (data) {
        toast.success("Account created successfully!");
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Sign up error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch (error) {
      toast.error("Failed to sign up with Google");
      console.error("Google sign up error:", error);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full grid lg:grid-cols-2"
      style={{ 
        backgroundColor: colors.bg,
        color: colors.text 
      }}
    >
      {/* Left Column: Form */}
      <div className="flex flex-col justify-between p-8 md:p-12 lg:p-16 relative">
        <div className="flex flex-col justify-center flex-1 max-w-[400px] mx-auto w-full animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="mb-8">
            <h1 
              className="text-3xl font-bold tracking-tight mb-2"
              style={{ color: colors.text }}
            >
              Create an account
            </h1>
            <p style={{ color: colors.textMuted }}>
              Start learning smarter with AI-powered notes.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 relative transition-colors"
              style={{
                backgroundColor: colors.buttonSecondary,
                borderColor: colors.buttonSecondaryBorder,
                color: colors.buttonSecondaryText,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.buttonSecondaryHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.buttonSecondary;
              }}
              onClick={handleGoogleSignUp}
              disabled={isGoogleLoading || isLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg 
                  className="mr-2 h-4 w-4" 
                  viewBox="0 0 24 24"
                  style={{ color: colors.buttonSecondaryText }}
                >
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
                <span 
                  className="w-full border-t"
                  style={{ borderColor: colors.border }}
                />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span 
                  className="px-2"
                  style={{ 
                    backgroundColor: colors.bg,
                    color: colors.textSubtle 
                  }}
                >
                  Or sign up with email
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label 
                  htmlFor="name"
                  style={{ color: colors.textMuted }}
                >
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="h-11 transition-all"
                  style={{
                    backgroundColor: colors.input,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  }}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label 
                  htmlFor="email"
                  style={{ color: colors.textMuted }}
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="h-11 transition-all"
                  style={{
                    backgroundColor: colors.input,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  }}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label 
                    htmlFor="password"
                    style={{ color: colors.textMuted }}
                  >
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="h-11 transition-all"
                    style={{
                      backgroundColor: colors.input,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    }}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
                </div>

                <div className="space-y-2">
                  <Label 
                    htmlFor="confirmPassword"
                    style={{ color: colors.textMuted }}
                  >
                    Confirm
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="h-11 transition-all"
                    style={{
                      backgroundColor: colors.input,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    }}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold transition-transform hover:scale-[1.02]"
              style={{
                backgroundColor: colors.buttonPrimary,
                color: colors.buttonPrimaryText,
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p 
            className="text-center text-sm mt-8"
            style={{ color: colors.textSubtle }}
          >
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-medium transition-all hover:underline"
              style={{ color: colors.text }}
            >
              Sign in
            </Link>
          </p>

          <p 
            className="text-center text-xs mt-4 leading-relaxed max-w-[300px] mx-auto"
            style={{ color: colors.textSubtle }}
          >
            By signing up, you agree to our{" "}
            <Link 
              href="/terms" 
              className="underline transition-colors"
              style={{ color: colors.textSubtle }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.textSubtle;
              }}
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link 
              href="/privacy" 
              className="underline transition-colors"
              style={{ color: colors.textSubtle }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.textSubtle;
              }}
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>

      {/* Right Column: Visual */}
      <div 
        className="hidden lg:flex flex-col justify-center items-center relative overflow-hidden border-l"
        style={{
          backgroundColor: colors.bgSecondary,
          borderColor: colors.border,
        }}
      >
         {/* Background Pattern */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, ${colors.grid} 1px, transparent 1px), linear-gradient(to bottom, ${colors.grid} 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            opacity: colors.gridOpacity,
          }}
        />
        
        {/* Abstract Glow */}
        <div 
          className="absolute bottom-0 right-0 rounded-full blur-[120px]"
          style={{
            width: colors.glowSize,
            height: colors.glowSize,
            backgroundColor: colors.glow,
          }}
        />

        <div className="relative z-10 p-12 max-w-lg text-center">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl border"
              style={{
                backgroundColor: colors.bg,
                borderColor: colors.border,
              }}
            >
              <Sparkles className="w-8 h-8" style={{ color: colors.text }} />
            </div>
            
            <h2 
              className="text-3xl font-bold mb-4"
              style={{ color: colors.text }}
            >
              Master any subject
            </h2>
            <p 
              className="text-lg leading-relaxed"
              style={{ color: colors.textMuted }}
            >
              Join 10,000+ students who are saving 10+ hours a week using JelliNote&apos;s AI summaries and quizzes.
            </p>
            
            <div className="mt-8 flex justify-center gap-2">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: colors.text }}
              />
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: colors.textSubtle }}
              />
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: colors.textSubtle }}
              />
            </div>
        </div>
      </div>
    </div>
  );
}