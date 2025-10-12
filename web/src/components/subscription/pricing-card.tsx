// Pricing Page Component - Displays subscription pricing

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles } from 'lucide-react';

export function PricingCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/subscription/create', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.paymentLink) {
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
      </div>

      {/* Price */}
      <div className="text-center mb-8">
        <div className="flex items-baseline justify-center gap-2 mb-2">
          <span className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            $19.99
          </span>
          <span className="text-xl text-muted-foreground">/month</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Cancel anytime • No commitment
        </p>
      </div>

      {/* Features */}
      <div className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full neomorphic-inset flex items-center justify-center">
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
        className="w-full h-14 text-lg font-semibold rounded-2xl neomorphic hover:shadow-lg transition-all duration-300 dark:text-white"
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
