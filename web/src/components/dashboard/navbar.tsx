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
        <UserControl showName />
      </div>
    </header>
  );
}
