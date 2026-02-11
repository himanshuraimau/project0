"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CreditCardIcon,
  CheckmarkCircle01Icon,
  Calendar01Icon,
  Mail01Icon,
  StarIcon,
  Loading01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UpgradeToYearlyDialog } from "@/components/subscription/upgrade-to-yearly-dialog";
import { toast } from "sonner";

const PREMIUM_FEATURES = [
  "Unlimited notes & folders",
  "Advanced AI features",
  "100 GB storage",
  "Priority support",
  "Custom themes",
  "Collaboration tools",
  "Export to all formats",
  "No watermarks",
];

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SubscriptionCard() {
  const [subscriptionData, setSubscriptionData] = useState<{
    hasSubscription: boolean;
    subscription?: {
      nextBillingDate: string;
      createdAt: string;
      displayStatus: string;
      status: string;
      productId: string;
    };
    access?: { hasAccess: boolean };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch("/api/subscription/status");
        if (response.ok) {
          const data = await response.json();
          setSubscriptionData(data);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSubscription();
  }, []);

  const hasActiveSubscription =
    subscriptionData?.hasSubscription && subscriptionData?.access?.hasAccess;
  const sub = subscriptionData?.subscription;

  const handleUpgrade = () => {
    window.location.href = "/pricing";
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
      });
      if (response.ok) {
        toast.success(
          "Subscription will cancel at the end of the billing period."
        );
        setShowCancelConfirm(false);
        const refetch = await fetch("/api/subscription/status");
        if (refetch.ok) setSubscriptionData(await refetch.json());
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err.error || "Failed to cancel subscription.");
      }
    } catch (error) {
      toast.error("Failed to cancel subscription.");
    } finally {
      setCancelling(false);
    }
  };

  const handleUpgradeToYearly = async () => {
    setIsUpgrading(true);
    try {
      const response = await fetch("/api/subscription/upgrade", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success && data.requiresPayment && data.paymentLink) {
        // Redirect to payment page to complete the upgrade
        toast.success("Redirecting to payment...");
        setShowUpgradeDialog(false);
        window.location.href = data.paymentLink;
      } else if (data.success) {
        // Upgrade completed without payment (shouldn't happen, but handle it)
        setShowUpgradeDialog(false);
        toast.success("Successfully upgraded to yearly plan! 🎉");
        // Refresh subscription data
        const refetch = await fetch("/api/subscription/status");
        if (refetch.ok) setSubscriptionData(await refetch.json());
      } else {
        toast.error(data.error || "Failed to upgrade subscription.");
      }
    } catch (error) {
      toast.error("Failed to upgrade subscription.");
    } finally {
      setIsUpgrading(false);
    }
  };

  // Determine if user is on yearly plan
  const yearlyProductId = process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO_SUBSCRIPTION_YEARLY;
  const isYearly = subscriptionData?.subscription?.productId === yearlyProductId;
  const planDisplay = hasActiveSubscription
    ? isYearly
      ? "Pro - $89/year"
      : "Pro - $19.99/month"
    : "Free";

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border/80 bg-muted/20">
          <div className="skeleton-base size-10 rounded-xl" />
          <div className="skeleton-base h-6 w-32 rounded-md" />
        </div>
        <div className="p-6 space-y-6">
          <div className="skeleton-base h-40 rounded-xl" />
          <div className="skeleton-base h-6 w-40 rounded-md" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-base h-6 rounded-md" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        {/* Card header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border/80 bg-muted/20">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HugeiconsIcon icon={CreditCardIcon} className="size-5" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Your plan
          </h2>
        </div>

        <div className="p-6 space-y-8">
          {/* Current plan block */}
          <div
            className={`relative rounded-2xl border-2 p-6 ${
              hasActiveSubscription
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-muted/20"
            }`}
          >
            {!isYearly && hasActiveSubscription && (
              <div className="absolute -top-3 right-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-md">
                <HugeiconsIcon icon={SparklesIcon} className="size-3.5" />
                Save $151 with yearly!
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    hasActiveSubscription
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {hasActiveSubscription && (
                    <HugeiconsIcon icon={StarIcon} className="size-3.5" />
                  )}
                  {hasActiveSubscription ? "Pro" : "Free"}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-foreground">
                  {hasActiveSubscription
                    ? planDisplay
                    : "You're on the Free plan"}
                </h3>
                {hasActiveSubscription && sub ? (
                  <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon
                        icon={Calendar01Icon}
                        className="size-4 shrink-0"
                      />
                      Next billing: {formatDate(sub.nextBillingDate)}
                    </div>
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon
                        icon={Mail01Icon}
                        className="size-4 shrink-0"
                      />
                      Status:{" "}
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {sub.displayStatus}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Upgrade to unlock premium features.
                  </p>
                )}
              </div>
              <div className="flex shrink-0 size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HugeiconsIcon icon={StarIcon} className="size-6" />
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              {!hasActiveSubscription ? (
                <Button
                  onClick={handleUpgrade}
                  className="w-full sm:w-auto rounded-xl h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 cursor-pointer font-medium"
                >
                  Upgrade to Pro — $19.99/month
                </Button>
              ) : (
                <>
                  {!isYearly && (
                    <Button
                      onClick={() => setShowUpgradeDialog(true)}
                      className="flex-1 rounded-xl h-11 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 cursor-pointer font-medium gap-2"
                      disabled={isUpgrading}
                    >
                      <HugeiconsIcon icon={SparklesIcon} className="size-4" />
                      Upgrade to Yearly
                    </Button>
                  )}
                  <Button
                    onClick={() => setShowCancelConfirm(true)}
                    variant="outline"
                    className="rounded-xl h-11 px-5 cursor-pointer border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive"
                    disabled={isUpgrading}
                  >
                    Cancel subscription
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Premium features */}
          <section>
            <h3 className="text-base font-semibold text-foreground mb-4">
              Premium features
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PREMIUM_FEATURES.map((text, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <HugeiconsIcon
                      icon={CheckmarkCircle01Icon}
                      className="size-3.5"
                    />
                  </span>
                  <span className="text-sm text-muted-foreground">{text}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="h-px bg-border" />

          {/* Billing history */}
          <section>
            <h3 className="text-base font-semibold text-foreground mb-4">
              Billing history
            </h3>
            {hasActiveSubscription && sub ? (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-border bg-muted/20">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">
                        Current billing cycle
                      </span>
                      <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                        Active
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Started {formatDate(sub.createdAt)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-semibold text-foreground">
                      {isYearly ? "$89" : "$19.99"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {isYearly ? "/year" : "/month"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-border">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">
                        Next payment
                      </span>
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                        Upcoming
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Due {formatDate(sub.nextBillingDate)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-semibold text-foreground">
                      {isYearly ? "$89" : "$19.99"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {isYearly ? "/year" : "/month"}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm text-foreground/90">
                    Your payment method will be charged automatically on the
                    next billing date.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 rounded-2xl border border-border bg-muted/20">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
                  <HugeiconsIcon icon={CreditCardIcon} className="size-7" />
                </div>
                <p className="font-medium text-foreground">
                  No billing history yet
                </p>
                <p className="text-sm text-muted-foreground text-center mt-1 max-w-xs">
                  Your payment history will appear here once you subscribe.
                </p>
                <Button
                  onClick={handleUpgrade}
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-xl cursor-pointer"
                  asChild
                >
                  <Link href="/pricing">View plans</Link>
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>

      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll keep access until the end of your current billing period.
              After that, your account will switch to the Free plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling} className="cursor-pointer">
              Keep subscription
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={cancelling}
              onClick={handleCancelSubscription}
              className="cursor-pointer"
            >
              {cancelling ? (
                <HugeiconsIcon
                  icon={Loading01Icon}
                  className="size-4 animate-spin mr-2"
                />
              ) : null}
              {cancelling ? "Cancelling…" : "Cancel subscription"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upgrade Dialog */}
      <UpgradeToYearlyDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        onConfirm={handleUpgradeToYearly}
        loading={isUpgrading}
      />
    </>
  );
}
