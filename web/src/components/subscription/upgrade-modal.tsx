"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon,
  File01Icon,
  Brain01Icon,
  FlashIcon,
  Message01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export type BillingInterval = "monthly" | "yearly";

const PRICING = {
  monthly: {
    price: 19,
    label: "Monthly",
    sublabel: "billed monthly",
    savings: null,
  },
  yearly: {
    price: 89,
    pricePerMonth: 7.42,
    label: "Annual",
    sublabel: "billed yearly",
    savings: "Save 63%",
  },
} as const;

const FEATURES = [
  {
    icon: File01Icon,
    text: "Unlimited PDF uploads, audio hours, and YouTube videos",
  },
  {
    icon: Brain01Icon,
    text: "Smarter notes, flashcards, quizzes, and mind maps",
  },
  {
    icon: FlashIcon,
    text: "Faster AI edits and generation",
  },
  {
    icon: Message01Icon,
    text: "Unlimited chat with notes and podcast summaries",
  },
] as const;

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SubscriptionStatus = {
  hasSubscription: boolean;
  subscription: { status: string } | null;
};

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("yearly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [cancellingPending, setCancellingPending] = useState(false);
  const [completingPayment, setCompletingPayment] = useState(false);

  const isPending = status?.subscription?.status === "PENDING";

  useEffect(() => {
    if (!open) return;
    setStatusLoading(true);
    setError(null);
    fetch("/api/subscription/status")
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch(() => setStatus(null))
      .finally(() => setStatusLoading(false));
  }, [open]);

  const handleCompletePayment = async () => {
    try {
      setCompletingPayment(true);
      const res = await fetch("/api/subscription/payment-link");
      const data = await res.json();
      if (data.paymentLink) {
        window.location.href = data.paymentLink;
        return;
      }
      setError(data.error || "Could not get payment link.");
    } catch {
      setError("Failed to get payment link.");
    } finally {
      setCompletingPayment(false);
    }
  };

  const handleCancelPending = async () => {
    try {
      setCancellingPending(true);
      setError(null);
      const res = await fetch("/api/subscription/cancel-pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus((prev) =>
          prev && prev.subscription
            ? { ...prev, subscription: null, hasSubscription: false }
            : null
        );
        window.dispatchEvent(new CustomEvent("subscription-updated"));
      } else {
        setError(data.error || "Failed to cancel pending subscription.");
      }
    } catch {
      setError("Failed to cancel pending subscription.");
    } finally {
      setCancellingPending(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingInterval }),
      });
      const data = await response.json();

      if (data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
        return;
      }
      if (data.paymentLink) {
        window.location.href = data.paymentLink;
        return;
      }
      setError(data.error || "Something went wrong. Please try again.");
    } catch (err) {
      setError("Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const yearly = PRICING.yearly;
  const monthly = PRICING.monthly;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-border bg-card p-0 gap-0 overflow-hidden rounded-2xl shadow-xl dark:bg-card">
        <div className="p-6 sm:p-8">
          <DialogTitle className="text-2xl font-semibold tracking-tight text-foreground pr-10">
            {isPending ? "Complete your upgrade" : "Upgrade to Premium"}
          </DialogTitle>

          {statusLoading && (
            <p className="mt-2 text-muted-foreground">Loading…</p>
          )}

          {!statusLoading && isPending && (
            <>
              <p className="mt-2 text-lg text-muted-foreground">
                Your subscription is waiting for payment. Complete checkout or cancel to choose a different plan.
              </p>
              <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                    <HugeiconsIcon icon={Clock01Icon} className="size-5 text-amber-600 dark:text-amber-400" />
                  </span>
                  <div>
                    <p className="font-medium text-foreground">Payment pending</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Click below to finish checkout, or cancel to start over.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    onClick={handleCompletePayment}
                    disabled={completingPayment || cancellingPending}
                    className="rounded-xl font-semibold"
                  >
                    {completingPayment ? "Loading…" : "Complete payment"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelPending}
                    disabled={completingPayment || cancellingPending}
                    className="rounded-xl font-semibold"
                  >
                    {cancellingPending ? "Cancelling…" : "Cancel pending"}
                  </Button>
                </div>
              </div>
              {error && (
                <p className="mt-3 text-sm text-destructive">{error}</p>
              )}
            </>
          )}

          {!statusLoading && !isPending && (
            <>
          <p className="mt-2 text-lg text-muted-foreground">
            Flinote is{" "}
            <span className="font-medium italic text-primary">faster</span>,{" "}
            <span className="font-medium italic text-primary">smarter</span>,
            and{" "}
            <span className="font-medium italic text-primary">unlimited</span>{" "}
            with Pro.
          </p>

          <ul className="mt-6 space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center text-lg justify-center rounded-lg bg-primary/10">
                  <HugeiconsIcon icon={Icon} className="size-4" />
                </span>
                <span className=" text-foreground">{text}</span>
              </li>
            ))}
          </ul>

          {/* Pricing cards */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setBillingInterval("yearly")}
              className={cn(
                "rounded-xl border-2 p-4 text-left transition-colors",
                billingInterval === "yearly"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-primary px-2 py-0.5 font-medium text-primary-foreground">
                  {yearly.savings}
                </span>
                <span className=" font-medium text-muted-foreground">
                  {yearly.label}
                </span>
              </div>
              <p className="mt-2 text-xl font-bold tracking-tight text-foreground">
                ${yearly.price}
              </p>
              <p className="text-xs text-muted-foreground">{yearly.sublabel}</p>
            </button>

            <button
              type="button"
              onClick={() => setBillingInterval("monthly")}
              className={cn(
                "rounded-xl border-2 p-4 text-left transition-colors",
                billingInterval === "monthly"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50",
              )}
            >
              <span className=" font-medium text-muted-foreground">
                {monthly.label}
              </span>
              <p className="mt-2 text-xl font-bold tracking-tight text-foreground">
                ${monthly.price}
                <span className="text-sm font-normal text-muted-foreground">
                  /month
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                {monthly.sublabel}
              </p>
            </button>
          </div>

          {error && (
            <p className="mt-4 text-center text-sm text-destructive">{error}</p>
          )}

          <Button
            onClick={handleUpgrade}
            disabled={loading}
            className="mt-6 w-full h-12 text-base font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            size="lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Taking you to checkout…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <HugeiconsIcon icon={SparklesIcon} className="size-5" />
                Upgrade now
                <HugeiconsIcon icon={SparklesIcon} className="size-5" />
              </span>
            )}
          </Button>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Join thousands of students learning smarter with Flinote.
          </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
