"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon,
  File01Icon,
  Brain01Icon,
  FlashIcon,
  Message01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export type BillingInterval = "monthly" | "yearly";

const PRICING = {
  monthly: {
    price: 19.99,
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

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("yearly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            Upgrade to Premium
          </DialogTitle>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
