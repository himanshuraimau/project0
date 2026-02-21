// Subscription Status Component - Shows user's current subscription status

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UpgradeToYearlyDialog } from '@/components/subscription/upgrade-to-yearly-dialog';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  AlertCircleIcon,
  Tick01Icon,
  Cancel01Icon,
  Clock01Icon,
  Loading01Icon,
  SparklesIcon,
} from '@hugeicons/core-free-icons';
import { toast } from 'sonner';

interface SubscriptionStatus {
  hasSubscription: boolean;
  subscription: {
    id: string;
    status: string;
    displayStatus: string;
    productId: string;
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
  const [showPendingCancelDialog, setShowPendingCancelDialog] = useState(false);
  const [isRetryingPayment, setIsRetryingPayment] = useState(false);
  const [isCancellingPending, setIsCancellingPending] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  useEffect(() => {
    const handler = () => fetchSubscriptionStatus();
    window.addEventListener('subscription-updated', handler);
    return () => window.removeEventListener('subscription-updated', handler);
  }, []);

  const fetchSubscriptionStatus = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await fetch('/api/subscription/status');

      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ billingInterval: 'monthly' }),
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
      setError('Failed to create subscription');
    }
  };

  const handleRetryPayment = async () => {
    try {
      setIsRetryingPayment(true);
      const response = await fetch('/api/subscription/payment-link');
      const data = await response.json();

      if (data.paymentLink) {
        window.location.href = data.paymentLink;
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to get payment link');
    } finally {
      setIsRetryingPayment(false);
    }
  };

  const handleCancelPending = async () => {
    try {
      setIsCancellingPending(true);
      const response = await fetch('/api/subscription/cancel-pending', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the page to show pricing card
        window.location.reload();
      } else {
        setError(data.error || 'Failed to cancel pending subscription');
      }
    } catch (err) {
      setError('Failed to cancel pending subscription');
    } finally {
      setIsCancellingPending(false);
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
        toast.success(data.message);
        // Optimistically update UI so button switches immediately
        setStatus((prev) =>
          prev && prev.subscription
            ? {
                ...prev,
                subscription: {
                  ...prev.subscription,
                  cancelAtPeriodEnd: true,
                  cancelledAt: data.subscription?.cancelledAt ?? prev.subscription.cancelledAt,
                },
              }
            : prev
        );
        window.dispatchEvent(new CustomEvent('subscription-updated'));
        // Refetch to get full fresh state (silent = no loading spinner)
        fetchSubscriptionStatus(true);
      } else {
        toast.error(data.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      toast.error('Failed to cancel subscription');
    }
  };

  const handleReactivateSubscription = async () => {
    setIsReactivating(true);
    try {
      const response = await fetch('/api/subscription/reactivate', { method: 'POST' });
      const data = await response.json();
      if (response.ok && data.success) {
        setShowReactivateConfirm(false);
        toast.success(data.message || 'Subscription reactivated. Your plan will continue.');
        fetchSubscriptionStatus();
        window.dispatchEvent(new CustomEvent('subscription-updated'));
      } else {
        toast.error(data.error || 'Failed to reactivate subscription');
      }
    } catch (err) {
      toast.error('Failed to reactivate subscription');
    } finally {
      setIsReactivating(false);
    }
  };

  const handleOpenBillingPortal = async () => {
    setIsOpeningPortal(true);
    try {
      const response = await fetch('/api/subscription/portal');
      const data = await response.json();
      if (response.ok && data.portalUrl) {
        toast.success('Opening billing portal...');
        window.location.href = data.portalUrl;
      } else {
        toast.error(data.error || 'Failed to open billing portal');
      }
    } catch (err) {
      toast.error('Failed to open billing portal');
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const handleUpgradeToYearly = async () => {
    try {
      setIsUpgrading(true);
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success && data.paymentLink) {
        setShowUpgradeDialog(false);
        toast.success('Redirecting to complete payment...');
        window.location.href = data.paymentLink;
        return;
      }
      if (data.success) {
        setShowUpgradeDialog(false);
        toast.success(data.message || 'Yearly plan activated. Payment was charged immediately.');
        fetchSubscriptionStatus();
        window.dispatchEvent(new CustomEvent('subscription-updated'));
      } else {
        toast.error(data.error || 'Failed to change subscription plan');
      }
    } catch (err) {
      setError('Failed to change subscription plan');
    } finally {
      setIsUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <HugeiconsIcon icon={Loading01Icon} className="size-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="text-center text-destructive">
          <HugeiconsIcon icon={Cancel01Icon} className="mx-auto size-12 mb-2" />
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
    if (subscription.status === 'PENDING') {
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">Pending</Badge>;
    }
    if (subscription.status === 'CANCELLED') {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    if (subscription.status === 'ON_HOLD') {
      return <Badge variant="outline">Payment Issue</Badge>;
    }
    return <Badge variant="outline">{subscription.displayStatus}</Badge>;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime()) || date.getTime() < 86400000) {
      // Invalid or epoch (Jan 1, 1970)
      return null;
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Determine if yearly subscription based on product ID
  const yearlyProductId = process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO_SUBSCRIPTION_YEARLY;
  const isYearly = subscription.productId === yearlyProductId;
  const planDisplay = isYearly ? 'Pro - $89/year' : 'Pro - $19/month';

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8 md:p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Your subscription</h2>
        {getStatusBadge()}
      </div>

      <div className="space-y-6">
        {subscription.status === 'PENDING' && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 flex items-start gap-4">
            <HugeiconsIcon icon={Clock01Icon} className="size-6 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-lg text-amber-600 dark:text-amber-400">Payment pending</p>
              <p className="text-base text-muted-foreground">
                Your subscription is waiting for payment. Click "Complete Payment" to finish the checkout process.
              </p>
            </div>
          </div>
        )}
        {access.isTrial && access.daysRemaining !== null && (
          <div className="rounded-xl border border-border bg-muted/30 p-5 flex items-start gap-4">
            <HugeiconsIcon icon={Clock01Icon} className="size-6 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-lg">Free trial active</p>
              <p className="text-base text-muted-foreground">
                {access.daysRemaining} days remaining in your trial
              </p>
            </div>
          </div>
        )}

        {(subscription.cancelAtPeriodEnd || subscription.status === 'CANCELLED') && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <p className="font-medium text-lg text-amber-600 dark:text-amber-400">
              Subscription cancelled
            </p>
            <p className="text-base text-muted-foreground mt-2">
              You keep access until {formatDate(subscription.currentPeriodEnd) ?? formatDate(subscription.nextBillingDate) ?? 'the end of your billing period'}.
              {subscription.status === 'CANCELLED' && ' No future charges.'}
              {subscription.cancelAtPeriodEnd && subscription.status === 'ACTIVE' && ' You can reactivate below to keep your plan after this period.'}
            </p>
          </div>
        )}

        {!isYearly && subscription.status === 'ACTIVE' && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 flex items-start gap-4">
            <HugeiconsIcon icon={SparklesIcon} className="size-6 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-lg text-primary">
                {subscription.cancelAtPeriodEnd ? 'Change your mind? Upgrade to yearly!' : 'Upgrade to yearly and save!'}
              </p>
              <p className="text-base text-muted-foreground mt-1">
                Switch to our yearly plan and save <strong className="text-foreground">$139 per year</strong> (61% off)
              </p>
            </div>
          </div>
        )}

        {/* Subscription Details */}
        <div className="space-y-6 mb-10">
          <div className="flex justify-between items-center py-4">
            <span className="text-muted-foreground text-lg">Plan</span>
            <span className="font-semibold text-xl">{planDisplay}</span>
          </div>

          {!subscription.cancelAtPeriodEnd && (subscription.nextBillingDate || subscription.currentPeriodEnd) && (
            <div className="flex justify-between items-center py-4">
              <span className="text-muted-foreground text-lg">Next billing</span>
              <span className="font-medium text-lg">
                {formatDate(subscription.nextBillingDate || subscription.currentPeriodEnd) ?? '—'}
              </span>
            </div>
          )}

          {(subscription.currentPeriodEnd || subscription.nextBillingDate) && (
            <div className="flex justify-between items-center py-4">
              <span className="text-muted-foreground text-lg">Period ends</span>
              <span className="font-medium text-lg">
                {formatDate(subscription.currentPeriodEnd) ?? formatDate(subscription.nextBillingDate) ?? '—'}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          {subscription.status === 'PENDING' && (
            <>
              <Button
                onClick={handleRetryPayment}
                disabled={isRetryingPayment || isCancellingPending}
                className="flex-1 rounded-xl h-12 text-base font-semibold"
              >
                {isRetryingPayment ? 'Loading...' : 'Complete Payment'}
              </Button>
              <Button
                onClick={() => setShowPendingCancelDialog(true)}
                disabled={isRetryingPayment || isCancellingPending}
                variant="outline"
                className="flex-1 rounded-xl h-12 text-base font-semibold"
              >
                Cancel
              </Button>
            </>
          )}
          {subscription.status === 'ACTIVE' && !isYearly && (
            <Button
              onClick={() => setShowUpgradeDialog(true)}
              className="flex-1 rounded-xl h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              disabled={isRetryingPayment || isCancellingPending || isUpgrading}
            >
              <HugeiconsIcon icon={SparklesIcon} className="size-5" />
              {subscription.cancelAtPeriodEnd ? 'Upgrade to Yearly (keeps your plan)' : 'Upgrade to Yearly - Save $139'}
            </Button>
          )}
          {subscription.cancelAtPeriodEnd && subscription.status === 'ACTIVE' && (
            <Button
              onClick={() => setShowReactivateConfirm(true)}
              variant="outline"
              className="rounded-xl h-12 px-5 text-base font-semibold"
              disabled={isRetryingPayment || isCancellingPending || isUpgrading || isReactivating}
            >
              {isReactivating ? 'Reactivating…' : 'Reactivate subscription'}
            </Button>
          )}
          {subscription.status === 'ACTIVE' && !subscription.cancelAtPeriodEnd && (
            <Button
              onClick={handleCancelSubscription}
              variant="destructive"
              className="rounded-xl h-12 px-5 text-base font-semibold"
              disabled={isRetryingPayment || isCancellingPending || isUpgrading}
            >
              Cancel
            </Button>
          )}
          {subscription.status === 'ACTIVE' && (
            <Button
              onClick={handleOpenBillingPortal}
              variant="outline"
              className="rounded-xl h-12 px-5 text-base font-semibold"
              disabled={isOpeningPortal || isRetryingPayment || isCancellingPending}
            >
              {isOpeningPortal ? 'Opening…' : 'Billing Portal'}
            </Button>
          )}
        </div>

        {subscription.status === 'ACTIVE' && (
          <Dialog open={showReactivateConfirm} onOpenChange={setShowReactivateConfirm}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Reactivate subscription?</DialogTitle>
                <DialogDescription>
                  Your plan will continue and you will be charged at the next billing date. You can cancel again anytime.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowReactivateConfirm(false)}
                  disabled={isReactivating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReactivateSubscription}
                  disabled={isReactivating}
                >
                  {isReactivating ? 'Reactivating…' : 'Reactivate'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {subscription.status === 'PENDING' && (
          <Dialog open={showPendingCancelDialog} onOpenChange={setShowPendingCancelDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                  <span className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <HugeiconsIcon icon={AlertCircleIcon} className="size-5" />
                  </span>
                  Cancel Pending Subscription?
                </DialogTitle>
                <DialogDescription className="pt-2">
                  Your subscription is waiting for payment. Cancelling will remove the pending
                  subscription so you can start a new checkout anytime.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                This does not charge your card, but the current payment link will expire.
              </div>
              <DialogFooter className="gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowPendingCancelDialog(false)}
                  disabled={isCancellingPending}
                  className="flex-1"
                >
                  Keep Pending
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelPending}
                  disabled={isCancellingPending}
                  className="flex-1"
                >
                  {isCancellingPending ? 'Cancelling...' : 'Cancel Pending'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {access.hasAccess && (
          <div className="rounded-xl border border-border bg-primary/5 p-6 flex items-start gap-4">
            <HugeiconsIcon icon={Tick01Icon} className="size-6 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-lg">Full access active</p>
              <p className="text-lg text-muted-foreground">
                Unlimited access to all features
              </p>
            </div>
          </div>
        )}
      </div>
      {/* Upgrade Dialog */}
      <UpgradeToYearlyDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        onConfirm={handleUpgradeToYearly}
        loading={isUpgrading}
      />    </div>
  );
}
