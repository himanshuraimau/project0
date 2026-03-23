"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, Star, Globe, ShieldCheck, Layers } from "lucide-react";

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

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
      />
    </svg>
  );
}

const PILLS = [
  { icon: Globe, label: "50+ languages" },
  { icon: ShieldCheck, label: "Legal to use" },
  { icon: Layers, label: "Flashcards" },
];

interface AuthScreenProps {
  mode: "sign-in" | "sign-up";
  onGoogleClick: () => void;
  isGoogleLoading: boolean;
  onAppleClick: () => void;
  isAppleLoading: boolean;
}

export function AuthScreen({
  mode,
  onGoogleClick,
  isGoogleLoading,
  onAppleClick,
  isAppleLoading,
}: AuthScreenProps) {
  return (
    <div className="relative flex flex-col items-center justify-center bg-background py-8 w-full">
      <div className="mx-auto w-full max-w-[460px] px-4 sm:px-6">
        <h1 className="text-center text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-8 md:mb-10 leading-[1.1]">
          Let AI make learning easier
        </h1>

        <div className="flex items-center justify-center gap-6 md:gap-8 mb-10 md:mb-12">
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm md:text-base font-semibold text-primary tracking-tight">
              Loved by 10000+ students
            </span>
          </div>

          <div className="h-10 w-px bg-border" />

          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl md:text-3xl font-bold text-foreground tracking-tighter tabular-nums">
              4.9
            </span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className="h-3.5 w-3.5 md:h-4 md:w-4 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={onGoogleClick}
            disabled={isGoogleLoading}
            className="h-12 md:h-14 w-full cursor-pointer rounded-2xl bg-foreground text-background hover:bg-foreground/90 transition-all text-base font-bold shadow-lg shadow-foreground/15 hover:shadow-xl hover:shadow-foreground/20"
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <GoogleIcon className="mr-2 h-5 w-5" />
            )}
            Continue with Google
          </Button>

          <Button
            onClick={onAppleClick}
            disabled={isAppleLoading}
            className="h-12 md:h-14 w-full cursor-pointer rounded-2xl bg-foreground text-background hover:bg-foreground/90 transition-all text-base font-bold shadow-lg shadow-foreground/15 hover:shadow-xl hover:shadow-foreground/20"
          >
            {isAppleLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <AppleIcon className="mr-2 h-5 w-5" />
            )}
            Continue with Apple
          </Button>
        </div>

        <div className="mt-8 md:mt-10 text-center space-y-6">
          <p className="text-base text-muted-foreground">
            {mode === "sign-in"
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <Link
              href={mode === "sign-in" ? "/sign-up" : "/sign-in"}
              className="font-bold text-foreground hover:underline underline-offset-4"
            >
              {mode === "sign-in" ? "Sign up" : "Sign in"}
            </Link>
          </p>

          <p className="text-xs md:text-sm leading-relaxed text-muted-foreground/90 max-w-[320px] mx-auto">
            By continuing, you accept Flinote&apos;s{" "}
            <Link
              href="/terms"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
