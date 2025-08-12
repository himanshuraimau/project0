"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserControl } from "@/components/user-control";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CrownIcon } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const { user, isLoaded } = useUser();
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    // Check if user has an active subscription
    const checkSubscription = async () => {
      if (user) {
        try {
          // Look for subscription metadata in user's public metadata
          const hasPro = user.publicMetadata?.subscriptionTier === "pro";
          setIsPro(!!hasPro);
        } catch (error) {
          console.error("Error checking subscription status:", error);
          setIsPro(false);
        }
      }
    };

    if (isLoaded) {
      checkSubscription();
    }
  }, [user, isLoaded]);

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
        {!isPro && (
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
