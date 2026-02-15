'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Payment Success Handler Component
 * Shows a loading message while waiting for webhook to activate subscription
 */
export function PaymentSuccessHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [retryCount, setRetryCount] = useState(0);
  const [status, setStatus] = useState<'checking' | 'success' | 'timeout'>('checking');

  useEffect(() => {
    // Only run if payment=success is in the URL
    if (searchParams?.get('payment') !== 'success') {
      return;
    }

    let timeoutId: NodeJS.Timeout;
    
    const checkSubscriptionStatus = async () => {
      try {
        const response = await fetch('/api/subscription/status');
        const data = await response.json();

        if (data.hasSubscription && data.access?.hasAccess) {
          // Subscription is active!
          setStatus('success');
          
          // Remove the payment=success param and reload
          const url = new URL(window.location.href);
          url.searchParams.delete('payment');
          
          // Small delay to show success message
          setTimeout(() => {
            window.location.href = url.toString();
          }, 1500);
        } else if (retryCount < 20) {
          // Still waiting for webhook, retry after 2 seconds
          timeoutId = setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000);
        } else {
          // Timeout after 40 seconds (20 retries * 2 seconds)
          setStatus('timeout');
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
        if (retryCount < 20) {
          timeoutId = setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000);
        } else {
          setStatus('timeout');
        }
      }
    };

    checkSubscriptionStatus();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searchParams, retryCount, router]);

  // Only show this component if payment=success is in the URL
  if (searchParams?.get('payment') !== 'success') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg p-8 max-w-md mx-4 shadow-lg">
        {status === 'checking' && (
          <>
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">
              Processing Payment...
            </h2>
            <p className="text-center text-muted-foreground">
              Please wait while we activate your subscription.
              This usually takes a few seconds.
            </p>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Attempt {retryCount + 1} of 20
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full h-12 w-12 bg-green-500 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center mb-2 text-green-600">
              Payment Successful!
            </h2>
            <p className="text-center text-muted-foreground">
              Your subscription is now active. Redirecting...
            </p>
          </>
        )}

        {status === 'timeout' && (
          <>
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full h-12 w-12 bg-yellow-500 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center mb-2 text-yellow-600">
              Taking Longer Than Expected
            </h2>
            <p className="text-center text-muted-foreground mb-4">
              Your payment was successful, but we're still activating your subscription.
              This can take up to a few minutes.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setStatus('checking');
                  setRetryCount(0);
                }}
                className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('payment');
                  window.location.href = url.toString();
                }}
                className="flex-1 bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90"
              >
                Continue Anyway
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
