// Subscription Status Component - Shows user's current subscription status

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
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
      <div className="neomorphic rounded-3xl p-8">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="neomorphic rounded-3xl p-8">
        <div className="text-center text-destructive">
          <XCircle className="mx-auto h-12 w-12 mb-2" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!status?.hasSubscription) {
    return null; // Don't show anything if no subscription, the pricing card handles it
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
    <div className="neomorphic rounded-3xl p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Your Subscription</h2>
        {getStatusBadge()}
      </div>

      <div className="space-y-6">
        {access.isTrial && access.daysRemaining !== null && (
          <div className="neomorphic-inset rounded-2xl p-4 flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Free Trial Active</p>
              <p className="text-sm text-muted-foreground">
                {access.daysRemaining} days remaining in your trial
              </p>
            </div>
          </div>
        )}

        {subscription.cancelAtPeriodEnd && (
          <div className="neomorphic-inset rounded-2xl p-4">
            <p className="font-medium text-sm text-yellow-600 dark:text-yellow-400">
              Subscription Cancelled
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Your subscription will end on {formatDate(subscription.currentPeriodEnd)}
            </p>
          </div>
        )}

        {/* Subscription Details */}
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-semibold">Pro - $19.99/month</span>
          </div>
          
          {subscription.nextBillingDate && !subscription.cancelAtPeriodEnd && (
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Next billing</span>
              <span className="font-medium">{formatDate(subscription.nextBillingDate)}</span>
            </div>
          )}

          {subscription.currentPeriodEnd && (
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Period ends</span>
              <span className="font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          {!subscription.cancelAtPeriodEnd && subscription.status === 'ACTIVE' && (
            <Button
              onClick={handleCancelSubscription}
              variant="destructive"
              className="flex-1 rounded-2xl"
            >
              Cancel
            </Button>
          )}
        </div>

        {access.hasAccess && (
          <div className="neomorphic-inset rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Full Access Active</p>
              <p className="text-sm text-muted-foreground">
                Unlimited access to all features
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
