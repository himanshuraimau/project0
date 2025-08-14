"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { UserControl } from "@/components/user-control";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CrownIcon } from "lucide-react";
import { useSubscriptionStatus } from "@/hooks/use-subscription-status";

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  // Use the shared hook for subscription status
  const { isPro, loading } = useSubscriptionStatus();

  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between border-b border-border bg-background px-6",
        className
      )}
    >
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-foreground">Project0</h1>
      </div>

      <div className="flex items-center gap-4">
        {!loading && !isPro && (
          <Button asChild size="sm" variant="ghost">
            <Link href="/pricing">
              <CrownIcon className="mr-1.5 h-4 w-4" /> Upgrade
            </Link>
          </Button>
        )}
        {!loading && isPro && (
          <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 px-3 py-1.5 border border-purple-200 dark:border-purple-800">
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Pro Plan
            </span>
          </div>
        )}
        <UserControl showName />
      </div>
    </header>
  );
}
