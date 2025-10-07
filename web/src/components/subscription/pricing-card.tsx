// Pricing Page Component - Displays subscription pricing

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Sparkles, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function PricingCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-muted-foreground">
          One plan with unlimited access to all features
        </p>
      </div>

      <div className="max-w-lg mx-auto">
        <Card className="border-2 border-primary shadow-lg">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl">Pro Plan</CardTitle>
            <CardDescription className="text-base">
              Everything you need to boost your learning
            </CardDescription>
            <div className="mt-6">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold">$19.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                7-day free trial included
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Unlimited PDF Processing</p>
                  <p className="text-sm text-muted-foreground">
                    Extract text and generate AI notes from any PDF
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Unlimited Audio Transcription</p>
                  <p className="text-sm text-muted-foreground">
                    Convert audio files to text with AI-powered transcription
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Unlimited YouTube Processing</p>
                  <p className="text-sm text-muted-foreground">
                    Get transcripts and notes from any YouTube video
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">AI Course Generation</p>
                  <p className="text-sm text-muted-foreground">
                    Create complete courses with chapters and learning materials
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Unlimited Webpage Processing</p>
                  <p className="text-sm text-muted-foreground">
                    Extract and summarize content from any webpage
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">AI-Powered Notes</p>
                  <p className="text-sm text-muted-foreground">
                    Generate structured notes from any content
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Priority Support</p>
                  <p className="text-sm text-muted-foreground">
                    Get help when you need it
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Creating subscription...' : 'Start 7-Day Free Trial'}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                No credit card required for trial
              </p>
              <p className="text-xs text-muted-foreground">
                Cancel anytime. No commitment. No hidden fees.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center space-y-4">
          <h3 className="font-semibold text-lg">Frequently Asked Questions</h3>
          
          <div className="text-left space-y-4 max-w-md mx-auto">
            <div>
              <p className="font-medium text-sm">Can I cancel anytime?</p>
              <p className="text-sm text-muted-foreground">
                Yes! Cancel anytime from your dashboard. You'll retain access until the end of your billing period.
              </p>
            </div>

            <div>
              <p className="font-medium text-sm">What happens after the trial?</p>
              <p className="text-sm text-muted-foreground">
                After 7 days, you'll be charged $19.99/month. Cancel before the trial ends to avoid charges.
              </p>
            </div>

            <div>
              <p className="font-medium text-sm">Are there any usage limits?</p>
              <p className="text-sm text-muted-foreground">
                No! Process unlimited files and generate unlimited content with your subscription.
              </p>
            </div>

            <div>
              <p className="font-medium text-sm">What payment methods do you accept?</p>
              <p className="text-sm text-muted-foreground">
                We accept all major credit cards through our secure payment processor, Dodo Payments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
