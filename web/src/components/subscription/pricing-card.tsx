"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon,
  Tick01Icon,
  LockIcon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

type BillingInterval = "monthly" | "yearly";
type PaymentRegion = "DEFAULT" | "IN";

interface PricingCardProps {
  defaultRegion?: PaymentRegion;
}

export function PricingCard({ defaultRegion = "DEFAULT" }: PricingCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("yearly");
  const [region, setRegion] = useState<PaymentRegion>(defaultRegion);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [zipcode, setZipcode] = useState("");

  const pricing = {
    monthly: {
      price: 19.99,
      priceINR: 1699,
      period: "/month",
      savings: null as string | null,
      savingsINR: null as string | null,
    },
    yearly: {
      price: 89,
      priceINR: 7499,
      period: "/year",
      savings: "Save $151/year (63% off)",
      savingsINR: "Save ₹12,889/year (63% off)",
    },
  };

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate phone for India region
      if (region === "IN" && !phoneNumber.trim()) {
        setError("Phone number is required for UPI payments");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/subscription/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          billingInterval,
          region,
          phoneNumber: region === "IN" ? phoneNumber.trim() : undefined,
          zipcode: region === "IN" && zipcode.trim() ? zipcode.trim() : undefined,
        }),
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
  const isIndiaRegion = region === "IN";
  const displayPrice = isIndiaRegion ? currentPricing.priceINR : currentPricing.price;
  const currencySymbol = isIndiaRegion ? "₹" : "$";
  const savingsText = isIndiaRegion ? currentPricing.savingsINR : currentPricing.savings;

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

      {/* Region toggle */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex rounded-full border border-border bg-muted/50 p-1">
          <button
            type="button"
            onClick={() => setRegion("DEFAULT")}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              region === "DEFAULT"
                ? "bg-background text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            International
          </button>
          <button
            type="button"
            onClick={() => setRegion("IN")}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              region === "IN"
                ? "bg-background text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            🇮🇳 India (UPI)
          </button>
        </div>
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
            {currencySymbol}{displayPrice}
          </span>
          <span className="text-lg text-muted-foreground">
            {currentPricing.period}
          </span>
        </div>
        {savingsText && (
          <p className="text-sm font-medium text-primary mt-1">
            {savingsText}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Cancel anytime · No commitment
        </p>
        {isIndiaRegion && (
          <p className="text-xs text-muted-foreground mt-1">
            Pay with UPI, Google Pay, or Cards
          </p>
        )}
      </div>

      {/* India region: Phone number input */}
      {isIndiaRegion && (
        <div className="space-y-3 mb-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1.5">
              Phone Number <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                +91
              </span>
              <input
                type="tel"
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="9876543210"
                className="w-full h-10 pl-12 pr-3 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                maxLength={10}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Required for UPI payments
            </p>
          </div>
          <div>
            <label htmlFor="zipcode" className="block text-sm font-medium text-foreground mb-1.5">
              PIN Code <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              type="text"
              id="zipcode"
              value={zipcode}
              onChange={(e) => setZipcode(e.target.value)}
              placeholder="560001"
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              maxLength={6}
            />
          </div>
        </div>
      )}

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
        {isIndiaRegion && " · RBI compliant"}
      </p>
    </div>
  );
}
