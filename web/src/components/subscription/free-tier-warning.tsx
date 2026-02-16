"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, SparklesIcon } from "@hugeicons/core-free-icons";
import { useUpgradeModal } from "@/contexts/upgrade-modal-context";
import { cn } from "@/lib/utils";
import { subscriptionCache } from "@/lib/subscription-cache";

interface FreeTierStatus {
  used: number;
  limit: number;
  remaining: number;
}

export function FreeTierWarning() {
  const [status, setStatus] = useState<FreeTierStatus | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const { openUpgradeModal } = useUpgradeModal();

  useEffect(() => {
    const cached = subscriptionCache.getCached();
    if (cached) {
      setHasSubscription(cached.hasSubscription && cached.access?.hasAccess);
      if (cached.features?.freeNotes) {
        setStatus(cached.features.freeNotes);
      }
    }

    fetchStatus();

    const unsubscribe = subscriptionCache.subscribe((data) => {
      setHasSubscription(data.hasSubscription && data.access?.hasAccess);
      if (data.features?.freeNotes) {
        setStatus(data.features.freeNotes);
      }
    });

    return unsubscribe;
  }, []);

  const fetchStatus = async () => {
    try {
      const data = await subscriptionCache.getStatus();

      setHasSubscription(data.hasSubscription && data.access?.hasAccess);

      if (data.features?.freeNotes) {
        setStatus(data.features.freeNotes);
      }
    } catch (error) {
      console.error("Error fetching free tier status:", error);
    }
  };

  if (hasSubscription) return null;
  if (!status) return null;

  const isLimitReached = status.remaining === 0;
  const isNearLimit = status.remaining <= 1 && status.remaining > 0;

  if (!isLimitReached && !isNearLimit) return null;

  return (
    <div
      role="alert"
      className={cn(
        "relative mb-6 overflow-hidden rounded-2xl  bg-card shadow-s",
        isLimitReached
          ? "border-destructive/30 before:bg-destructive/80"
          : "border-primary/20 before:bg-primary/60"
      )}
    >
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
        <div className="flex gap-4">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              isLimitReached
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary"
            )}
          >
            <HugeiconsIcon
              icon={isLimitReached ? AlertCircleIcon : SparklesIcon}
              className="h-5 w-5"
            />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
              {isLimitReached
                ? "Free tier limit reached"
                : "Almost at your free limit"}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {isLimitReached ? (
                <>
                  You&apos;ve used all {status.limit} free notes. Upgrade to Pro
                  for unlimited notes and more features.
                </>
              ) : (
                <>
                  {status.remaining} free note
                  {status.remaining !== 1 ? "s" : ""} left out of {status.limit}
                  . Upgrade to Pro for unlimited access.
                </>
              )}
            </p>
          </div>
        </div>
        <Button
          onClick={openUpgradeModal}
          size="default"
          className={cn(
            "shrink-0 font-semibold shadow-sm transition-all",
            isLimitReached
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          <HugeiconsIcon icon={SparklesIcon} className="mr-2 h-4 w-4" />
          Upgrade to Pro
        </Button>
      </div>
    </div>
  );
}
