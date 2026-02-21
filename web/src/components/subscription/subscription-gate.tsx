// Subscription Gate Component - Blocks features behind subscription paywall

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Loader2, Sparkles } from 'lucide-react';

interface SubscriptionGateProps {
  children: React.ReactNode;
  featureName?: string;
  loadingMessage?: string;
}

export function SubscriptionGate({ 
  children, 
  featureName = 'this feature',
  loadingMessage = 'Checking subscription...'
}: SubscriptionGateProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const response = await fetch('/api/subscription/status');
      const data = await response.json();
      
      setHasAccess(data.access?.hasAccess || false);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
      });

      const data = await response.json();

      const redirectUrl = data.data?.checkoutUrl || data.paymentLink;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Subscription Required</CardTitle>
            <CardDescription>
              Subscribe to unlock {featureName} and all other premium features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Unlimited PDF processing</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Unlimited audio transcription</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Unlimited YouTube processing</span>
              </div>
              {/* TODO: COURSE_GENERATION_FEATURE - Uncomment to re-enable course generation feature */}
              {/* <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>AI course generation</span>
              </div> */}
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Start with 1 free note</span>
              </div>
            </div>
            
            <Button onClick={handleSubscribe} className="w-full" size="lg">
              Start Free Trial - $19.99/month
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              Cancel anytime. No commitment required.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
