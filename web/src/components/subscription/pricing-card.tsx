// Pricing Page Component - Displays subscription pricing

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type BillingInterval = 'monthly' | 'yearly';

export function PricingCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  const pricing = {
    monthly: {
      price: 19.99,
      period: '/month',
      savings: null,
    },
    yearly: {
      price: 89,
      period: '/year',
      savings: 'Save $151/year (63% off)',
    },
  };

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      setError('Failed to create subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'Unlimited PDF, Audio & Video Processing',
    'AI Course Generation',
    'Smart Notes & Flashcards',
    'Interactive Quizzes',
    'Priority Support',
  ];

  const currentPricing = pricing[billingInterval];

  return (
    <div className="neomorphic rounded-3xl p-8 md:p-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl neomorphic-inset mb-6">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold mb-3">Pro Plan</h2>
        <p className="text-muted-foreground">
          Everything you need to supercharge your learning
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Start with 3 free notes, then upgrade for unlimited access
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="inline-flex items-center rounded-full p-1 neomorphic-inset">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
              billingInterval === 'monthly'
                ? "bg-linear-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('yearly')}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
              billingInterval === 'yearly'
                ? "bg-linear-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Price */}
      <div className="text-center mb-8">
        <div className="flex items-baseline justify-center gap-2 mb-2">
          <span className="text-6xl font-bold bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            ${currentPricing.price}
          </span>
          <span className="text-xl text-muted-foreground">{currentPricing.period}</span>
        </div>
        {currentPricing.savings && (
          <p className="text-sm font-medium text-green-500 mb-2">
            {currentPricing.savings}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Cancel anytime • No commitment
        </p>
      </div>

      {/* Features */}
      <div className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="shrink-0 w-6 h-6 rounded-full neomorphic-inset flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <span className="text-base">{feature}</span>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-2xl neomorphic-inset p-4 mb-6 text-sm text-destructive text-center">
          {error}
        </div>
      )}

      {/* CTA Button */}
      <Button
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full h-14 text-lg font-semibold rounded-2xl neomorphic hover: transition-all duration-300 dark:text-white"
        size="lg"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent dark:text-white" />
            <span>Creating subscription...</span>
          </div>
        ) : (
          'Get Started Now'
        )}
      </Button>

      {/* Bottom Note */}
      <p className="text-center text-sm text-muted-foreground mt-6">
        Secure payment powered by Dodo Payments 🔒
      </p>
    </div>
  );
}
