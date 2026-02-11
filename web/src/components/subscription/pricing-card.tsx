"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon,
  Tick01Icon,
  LockIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

type BillingInterval = "monthly" | "yearly";

export function PricingCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("yearly");

  const pricing = {
    monthly: {
      price: 19.99,
      period: "/month",
      savings: null,
    },
    yearly: {
      price: 89,
      period: "/year",
      savings: "Save $151/year (63% off)",
    },
  };

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/subscription/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ billingInterval }),
      });

      const data = await response.json();

      if (data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else if (data.paymentLink) {
        window.location.href = data.paymentLink;
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to create subscription. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    "Unlimited PDF, audio & video processing",
    "Smart notes, flashcards & quizzes",
    "Mind maps & podcast summaries",
    "Priority support",
  ];

  const currentPricing = pricing[billingInterval];

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5">
          <HugeiconsIcon icon={SparklesIcon} className="size-6" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
          Pro plan
        </h2>
        <p className="text-sm text-muted-foreground">
          Everything you need to supercharge your learning
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Start with 1 free note, then upgrade for unlimited access
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-full border border-border bg-muted/50 p-1">
          <button
            type="button"
            onClick={() => setBillingInterval("monthly")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              billingInterval === "monthly"
                ? "bg-background text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingInterval("yearly")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              billingInterval === "yearly"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Price */}
      <div className="text-center mb-6">
        <div className="flex items-baseline justify-center gap-1.5 mb-1">
          <span className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            ${currentPricing.price}
          </span>
          <span className="text-lg text-muted-foreground">
            {currentPricing.period}
          </span>
        </div>
        {currentPricing.savings && (
          <p className="text-sm font-medium text-primary mt-1">
            {currentPricing.savings}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Cancel anytime · No commitment
        </p>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HugeiconsIcon icon={Tick01Icon} className="size-3" />
            </span>
            <span className="text-sm text-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 mb-6 text-sm text-destructive text-center">
          {error}
        </div>
      )}

      <Button
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full h-12 text-base font-semibold rounded-xl"
        size="lg"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Creating subscription…
          </span>
        ) : (
          "Get started now"
        )}
      </Button>

      <p className="flex items-center justify-center gap-2 mt-5 text-xs text-muted-foreground">
        <HugeiconsIcon icon={LockIcon} className="size-3.5" />
        Secure payment
      </p>
    </div>
  );
}
