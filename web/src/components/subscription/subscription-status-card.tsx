// Subscription Status Component - Shows user's current subscription status

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';

interface SubscriptionStatus {
  hasSubscription: boolean;
  subscription: {
    id: string;
    status: string;
    displayStatus: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    nextBillingDate: string;
    cancelAtPeriodEnd: boolean;
    cancelledAt: string | null;
    trialEnd: string | null;
    createdAt: string;
  } | null;
  access: {
    hasAccess: boolean;
    isActive: boolean;
    isTrial: boolean;
    daysRemaining: number | null;
  };
  features: {
    hasAccess: boolean;
    subscription: any;
    upgradeUrl: string | null;
  };
}

export function SubscriptionStatusCard() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/subscription/status');
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
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

      if (data.paymentLink) {
        window.location.href = data.paymentLink;
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to create subscription');
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/subscription/portal');
      const data = await response.json();

      if (data.portalUrl) {
        window.open(data.portalUrl, '_blank');
      }
    } catch (err) {
      setError('Failed to open customer portal');
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return;
    }

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelAtPeriodEnd: true }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        fetchSubscriptionStatus(); // Refresh status
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to cancel subscription');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-destructive">
            <XCircle className="mx-auto h-12 w-12 mb-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status?.hasSubscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>
            Subscribe to access all features with unlimited usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">Pro Plan</h3>
                <Badge variant="default">$19.99/month</Badge>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Unlimited PDF processing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Unlimited audio transcription
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Unlimited YouTube processing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Unlimited course generation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Unlimited webpage processing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  7-day free trial
                </li>
              </ul>
            </div>
            <Button onClick={handleSubscribe} className="w-full" size="lg">
              Subscribe Now - Start Free Trial
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { subscription, access } = status;

  if (!subscription) return null;

  const getStatusBadge = () => {
    if (access.isTrial) {
      return <Badge variant="secondary">Free Trial</Badge>;
    }
    if (subscription.status === 'ACTIVE') {
      return <Badge variant="default">Active</Badge>;
    }
    if (subscription.status === 'CANCELLED') {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    if (subscription.status === 'ON_HOLD') {
      return <Badge variant="outline">Payment Issue</Badge>;
    }
    return <Badge variant="outline">{subscription.displayStatus}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Subscription Status</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Manage your subscription and billing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {access.isTrial && access.daysRemaining !== null && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Free Trial Active</p>
              <p className="text-sm text-muted-foreground">
                {access.daysRemaining} days remaining in your trial
              </p>
            </div>
          </div>
        )}

        {subscription.cancelAtPeriodEnd && (
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-4">
            <p className="font-medium text-sm text-yellow-900 dark:text-yellow-100">
              Subscription Cancelled
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Your subscription will end on {formatDate(subscription.currentPeriodEnd)}
            </p>
          </div>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-medium">Pro - $19.99/month</span>
          </div>
          
          {subscription.nextBillingDate && !subscription.cancelAtPeriodEnd && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Next billing date</span>
              <span className="font-medium">{formatDate(subscription.nextBillingDate)}</span>
            </div>
          )}

          {subscription.currentPeriodEnd && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current period ends</span>
              <span className="font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium">{subscription.displayStatus}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleManageSubscription}
            variant="outline"
            className="flex-1"
          >
            Manage Billing
          </Button>
          
          {!subscription.cancelAtPeriodEnd && subscription.status === 'ACTIVE' && (
            <Button
              onClick={handleCancelSubscription}
              variant="destructive"
              className="flex-1"
            >
              Cancel Subscription
            </Button>
          )}
        </div>

        {access.hasAccess && (
          <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Full Access</p>
              <p className="text-sm text-muted-foreground">
                You have unlimited access to all features
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
