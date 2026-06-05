"use client";

import { useSession } from "@/lib/auth-client";
import { useEffect, useState } from "react";

const SESSION_RETRY_DELAYS_MS = [250, 500, 1000, 2000];

export function OnboardingAuthGate({ children }: { children: React.ReactNode }) {
  const { data: session, isPending, refetch } = useSession();
  const [retriesDone, setRetriesDone] = useState(false);

  useEffect(() => {
    if (isPending || session?.user) {
      return;
    }

    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    SESSION_RETRY_DELAYS_MS.forEach((delay) => {
      timeouts.push(
        setTimeout(() => {
          if (!cancelled) {
            void refetch();
          }
        }, delay),
      );
    });

    timeouts.push(
      setTimeout(() => {
        if (!cancelled) {
          setRetriesDone(true);
        }
      }, SESSION_RETRY_DELAYS_MS[SESSION_RETRY_DELAYS_MS.length - 1] + 500),
    );

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [isPending, session, refetch]);

  if (isPending || (!session?.user && !retriesDone)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t verify your session. Please try signing in again.
        </p>
        <a
          href="/sign-in"
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          Back to sign in
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
