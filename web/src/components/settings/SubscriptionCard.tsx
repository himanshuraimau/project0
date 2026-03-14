"use client";

import { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSettingsSubscription } from "@/contexts/settings-subscription-context";
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
import { useUpgradeModal } from "@/contexts/upgrade-modal-context";
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

const PRICE_MONTHLY = 19;
const PRICE_YEARLY = 89;
const PRICE_YEARLY_PER_MONTH = PRICE_YEARLY / 12; // e.g. $7.42/mo when billed yearly

function formatDate(date: string | Date | null | undefined): string | null {
  if (date == null) return null;
  const d = new Date(date);
  if (isNaN(d.getTime()) || d.getTime() < 86400000) return null; // Invalid or epoch
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SubscriptionCard() {
  const {
    data: subscriptionData,
    loading: isLoading,
    refetch,
    setData: setSubscriptionData,
  } = useSettingsSubscription();
  const [cancelling, setCancelling] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const { openUpgradeModal } = useUpgradeModal();

  const hasActiveSubscription =
    subscriptionData?.hasSubscription && subscriptionData?.access?.hasAccess;
  const sub = subscriptionData?.subscription;
  // For pending upgrade, nextBillingDate is null - use currentPeriodEnd (monthlyPeriodEnd) for display
  const displayDate = (d: string | Date | null | undefined) =>
    formatDate(d) ?? "—";
  const nextBillingDisplay = displayDate(
    sub?.nextBillingDate ?? sub?.currentPeriodEnd,
  );
  const isPendingUpgrade =
    sub?.status === "PENDING" &&
    (sub?.metadata as { upgradeFromMonthly?: boolean })?.upgradeFromMonthly;

  const handleUpgrade = () => {
    openUpgradeModal();
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelAtPeriodEnd: true }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(
          "Subscription will cancel at the end of the billing period.",
        );
        setShowCancelConfirm(false);
        // Optimistically update UI immediately so button switches without refresh
        setSubscriptionData((prev) =>
          prev && prev.subscription
            ? {
                ...prev,
                subscription: {
                  ...prev.subscription,
                  cancelAtPeriodEnd: true,
                  cancelledAt:
                    data.subscription?.cancelledAt ??
                    prev.subscription.cancelledAt,
                },
              }
            : prev,
        );
        window.dispatchEvent(new CustomEvent("subscription-updated"));
        refetch(true, true); // silent refetch, no loading spinner
      } else {
        toast.error(data.error || "Failed to cancel subscription.");
      }
    } catch (error) {
      toast.error("Failed to cancel subscription.");
    } finally {
      setCancelling(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setReactivating(true);
    try {
      const response = await fetch("/api/subscription/reactivate", {
        method: "POST",
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setShowReactivateConfirm(false);
        toast.success(
          data.message || "Subscription reactivated. Your plan will continue.",
        );
        refetch(true);
        window.dispatchEvent(new CustomEvent("subscription-updated"));
      } else {
        toast.error(data.error || "Failed to reactivate subscription.");
      }
    } catch (error) {
      toast.error("Failed to reactivate subscription.");
    } finally {
      setReactivating(false);
    }
  };

  const handleOpenBillingPortal = async () => {
    setIsOpeningPortal(true);
    try {
      const response = await fetch("/api/subscription/portal");
      const data = await response.json();
      if (response.ok && data.portalUrl) {
        toast.success("Opening billing portal...");
        window.location.href = data.portalUrl;
      } else {
        toast.error(data.error || "Failed to open billing portal.");
      }
    } catch (error) {
      toast.error("Failed to open billing portal.");
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const handleUpgradeToYearly = async () => {
    setIsUpgrading(true);
    try {
      // Use /upgrade for immediate plan change via Paddle API
      const response = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success && data.paymentLink) {
        setShowUpgradeDialog(false);
        toast.success("Redirecting to complete payment...");
        window.location.href = data.paymentLink;
        return;
      }
      if (data.success && !data.paymentLink) {
        setShowUpgradeDialog(false);
        toast.success(
          data.message ||
            "Yearly plan activated. Payment was charged immediately.",
        );
        refetch(true);
        window.dispatchEvent(new CustomEvent("subscription-updated"));
        return;
      }
      toast.error(data.error || "Failed to change subscription plan.");
    } catch (error) {
      toast.error("Failed to change subscription plan.");
    } finally {
      setIsUpgrading(false);
    }
  };

  // Determine if user is on yearly plan
  const yearlyPriceId =
    process.env.NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID;
  const isYearly =
    subscriptionData?.subscription?.priceId === yearlyPriceId;
  const scheduledPlan =
    subscriptionData?.subscription?.metadata?.scheduledPriceId;
  const hasScheduledChange =
    scheduledPlan &&
    scheduledPlan !== subscriptionData?.subscription?.priceId;
  const scheduledToYearly = scheduledPlan === yearlyPriceId;

  const planDisplay = hasActiveSubscription
    ? isYearly
      ? `Pro - $${PRICE_YEARLY}/year`
      : `Pro - $${PRICE_MONTHLY}/month`
    : "Free";
  const hasSubscriptionHistory =
    subscriptionData?.hasSubscription && !hasActiveSubscription;

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
            {!isYearly && hasScheduledChange && scheduledToYearly && (
              <div className="absolute -top-3 right-4 inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white shadow-md">
                <HugeiconsIcon
                  icon={CheckmarkCircle01Icon}
                  className="size-3.5"
                />
                Upgrading to Yearly
              </div>
            )}
            {/* Yearly upsell badge hidden for Monthly Cancelled (nothing to purchase until period ends) */}
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
                    {nextBillingDisplay !== "—" && (
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon
                          icon={Calendar01Icon}
                          className="size-4 shrink-0"
                        />
                        {sub.cancelAtPeriodEnd || sub.status === "CANCELLED"
                          ? isYearly
                            ? `Access until ${nextBillingDisplay}`
                            : `Monthly Active until: ${nextBillingDisplay}`
                          : `Next billing: ${nextBillingDisplay}`}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon
                        icon={Mail01Icon}
                        className="size-4 shrink-0"
                      />
                      Status:{" "}
                      <span
                        className={`font-medium ${
                          sub.cancelAtPeriodEnd
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {sub.cancelAtPeriodEnd
                          ? "Cancelling at period end"
                          : sub.displayStatus}
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
                <>
                  <div className="flex flex-col gap-1 w-full sm:w-auto">
                    <Button
                      onClick={handleUpgrade}
                      className="w-full sm:w-auto rounded-xl h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 cursor-pointer font-medium"
                    >
                      Upgrade to Pro
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      ${PRICE_MONTHLY}/mo or $
                      {PRICE_YEARLY_PER_MONTH.toFixed(2)}/mo when billed yearly
                      (${PRICE_YEARLY}/yr)
                    </p>
                  </div>
                  {hasSubscriptionHistory && (
                    <Button
                      onClick={handleOpenBillingPortal}
                      variant="outline"
                      className="rounded-xl h-11 px-5 cursor-pointer shrink-0"
                      disabled={isOpeningPortal}
                    >
                      {isOpeningPortal ? "Opening…" : "Billing Portal"}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {/* Upgrade UI: only for monthly (hidden for Yearly Active) */}
                  {!isYearly &&
                    hasScheduledChange &&
                    scheduledToYearly &&
                    nextBillingDisplay !== "—" && (
                      <div className="flex-1 rounded-xl h-11 px-5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 flex items-center justify-center gap-2">
                        <HugeiconsIcon
                          icon={CheckmarkCircle01Icon}
                          className="size-4 text-green-600 dark:text-green-400"
                        />
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">
                          Upgrading on {nextBillingDisplay}
                        </span>
                      </div>
                    )}
                  {sub?.cancelAtPeriodEnd && sub?.status === "ACTIVE" ? (
                    <Button
                      onClick={() => setShowReactivateConfirm(true)}
                      variant="outline"
                      className="rounded-xl h-11 px-5 cursor-pointer border-primary/50 text-primary hover:bg-primary/10 hover:border-primary"
                      disabled={isUpgrading || reactivating}
                    >
                      {reactivating ? (
                        <HugeiconsIcon
                          icon={Loading01Icon}
                          className="size-4 animate-spin mr-2"
                        />
                      ) : null}
                      {reactivating
                        ? "Reactivating…"
                        : "Reactivate subscription"}
                    </Button>
                  ) : sub?.status !== "CANCELLED" && !sub?.cancelAtPeriodEnd ? (
                    <Button
                      onClick={() => setShowCancelConfirm(true)}
                      variant="outline"
                      className="rounded-xl h-11 px-5 cursor-pointer border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive"
                      disabled={isUpgrading}
                    >
                      {isYearly ? "Cancel Yearly" : "Cancel Monthly"}
                    </Button>
                  ) : null}
                  <Button
                    onClick={handleOpenBillingPortal}
                    variant="outline"
                    className="rounded-xl h-11 px-5 cursor-pointer"
                    disabled={isOpeningPortal || isUpgrading}
                  >
                    {isOpeningPortal ? "Opening…" : "Billing Portal"}
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Billing history / Transaction history */}
          <section>
            <h3 className="text-base font-semibold text-foreground mb-4">
              {hasActiveSubscription
                ? "Billing history"
                : hasSubscriptionHistory
                  ? "Transaction history"
                  : "Billing history"}
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
                      {isYearly ? `$${PRICE_YEARLY}` : `$${PRICE_MONTHLY}`}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {isYearly ? "/year" : "/month"}
                    </span>
                  </div>
                </div>
                {!sub.cancelAtPeriodEnd && sub.status !== "CANCELLED" && (
                  <>
                    {isPendingUpgrade ? (
                      <div className="rounded-xl border-2 border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-4">
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                          Complete your payment to activate the yearly plan.
                        </p>
                        <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                          {nextBillingDisplay !== "—" &&
                            `Your current access continues until ${nextBillingDisplay}.`}
                        </p>
                      </div>
                    ) : (
                      <>
                        {hasScheduledChange && scheduledToYearly && (
                          <div className="rounded-xl border-2 border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20 p-4">
                            <div className="flex items-start gap-3">
                              <HugeiconsIcon
                                icon={CheckmarkCircle01Icon}
                                className="size-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5"
                              />
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                                  Upgrade Scheduled
                                </p>
                                <p className="text-sm text-green-800 dark:text-green-200">
                                  Your plan will upgrade to{" "}
                                  <strong>Yearly (${PRICE_YEARLY}/year)</strong>{" "}
                                  on {nextBillingDisplay}. You'll keep your
                                  current monthly plan until then.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
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
                              Due {nextBillingDisplay}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-semibold text-foreground">
                              {hasScheduledChange && scheduledToYearly
                                ? `$${PRICE_YEARLY}`
                                : isYearly
                                  ? `$${PRICE_YEARLY}`
                                  : `$${PRICE_MONTHLY}`}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {hasScheduledChange && scheduledToYearly
                                ? "/year"
                                : isYearly
                                  ? "/year"
                                  : "/month"}
                            </span>
                          </div>
                        </div>
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                          <p className="text-sm text-foreground/90">
                            {hasScheduledChange && scheduledToYearly
                              ? `Your payment method will be charged $${PRICE_YEARLY} for the yearly plan on the next billing date.`
                              : "Your payment method will be charged automatically on the next billing date."}
                          </p>
                        </div>
                      </>
                    )}
                  </>
                )}
                {(sub.cancelAtPeriodEnd || sub.status === "CANCELLED") && (
                  <div className="rounded-xl border border-orange-200/50 bg-orange-50/50 dark:border-orange-900/30 dark:bg-orange-950/20 p-4">
                    <p className="text-sm text-orange-900 dark:text-orange-100">
                      Your subscription is cancelled. You keep access to all Pro
                      features until {nextBillingDisplay}.
                      {sub.status === "CANCELLED" && " No future charges."}
                      {sub.cancelAtPeriodEnd &&
                        sub.status === "ACTIVE" &&
                        " You can reactivate below to keep your plan after this period."}
                    </p>
                  </div>
                )}
              </div>
            ) : hasSubscriptionHistory && sub ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 rounded-2xl border border-border bg-muted/20">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
                  <HugeiconsIcon icon={CreditCardIcon} className="size-6" />
                </div>
                <p className="font-medium text-foreground">Plan ended</p>
                <p className="text-sm text-muted-foreground text-center mt-1 max-w-sm">
                  Your Pro subscription has ended. Upgrade again or view past
                  invoices in the Billing Portal.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <Button
                    onClick={handleUpgrade}
                    size="sm"
                    className="rounded-xl cursor-pointer"
                  >
                    <HugeiconsIcon icon={SparklesIcon} className="size-4 mr-1.5" />
                    Upgrade to Pro
                  </Button>
                  <Button
                    onClick={handleOpenBillingPortal}
                    variant="outline"
                    size="sm"
                    className="rounded-xl cursor-pointer"
                    disabled={isOpeningPortal}
                  >
                    {isOpeningPortal ? "Opening…" : "Billing Portal"}
                  </Button>
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

      <AlertDialog
        open={showReactivateConfirm}
        onOpenChange={setShowReactivateConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Your plan will continue and you will be charged at the next
              billing date. You can cancel again anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={reactivating}
              className="cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <Button
              disabled={reactivating}
              onClick={handleReactivateSubscription}
              className="cursor-pointer"
            >
              {reactivating ? (
                <HugeiconsIcon
                  icon={Loading01Icon}
                  className="size-4 animate-spin mr-2"
                />
              ) : null}
              {reactivating ? "Reactivating…" : "Reactivate"}
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
