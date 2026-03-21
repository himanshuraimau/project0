'use client';

import { initializePaddle } from '@paddle/paddle-js';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type MobileCheckoutData = {
  priceId: string;
  customerEmail: string;
  customData: { userId: string; revenuecat_app_user_id?: string };
  environment: string;
  clientToken: string;
  discountCode?: string;
  successUrl: string;
  cancelUrl: string;
};

function appendQuery(url: string, query: Record<string, string>) {
  const parsed = new URL(url);
  Object.entries(query).forEach(([key, value]) => parsed.searchParams.set(key, value));
  return parsed.toString();
}

function CheckoutStatus({ statusMessage, error }: { statusMessage: string; error: string | null }) {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm text-center">
        <h1 className="text-xl font-semibold mb-2">Flinote Checkout</h1>
        {!error ? (
          <p className="text-sm text-muted-foreground">{statusMessage}</p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <p className="text-xs text-muted-foreground">
              Please go back to the app and try again.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function MobileCheckoutContent() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams?.get('token') ?? '', [searchParams]);
  const [statusMessage, setStatusMessage] = useState('Preparing secure checkout...');
  const [error, setError] = useState<string | null>(null);
  const hasOpenedRef = useRef(false);
  const didCompleteRef = useRef(false);

  useEffect(() => {
    if (!token || hasOpenedRef.current) {
      return;
    }

    const run = async () => {
      try {
        const response = await fetch(`/api/subscription/mobile-checkout?token=${encodeURIComponent(token)}`);
        const payload = await response.json();

        if (!response.ok || !payload?.success || !payload?.data) {
          throw new Error(payload?.error || 'Unable to resolve checkout session');
        }

        const data = payload.data as MobileCheckoutData;
        setStatusMessage('Opening secure payment...');

        const paddle = await initializePaddle({
          token: data.clientToken,
          environment: data.environment === 'production' ? 'production' : 'sandbox',
          eventCallback: (event) => {
            if (event.name === 'checkout.completed') {
              didCompleteRef.current = true;
              const eventData = event.data as any;
              const transactionId = eventData?.transaction_id || '';
              const subscriptionId = eventData?.subscription_id || '';
              const successUrl = appendQuery(data.successUrl, {
                status: 'success',
                ...(transactionId ? { transaction_id: transactionId } : {}),
                ...(subscriptionId ? { subscription_id: subscriptionId } : {}),
              });
              window.location.href = successUrl;
            }

            if (event.name === 'checkout.closed' && !didCompleteRef.current) {
              const cancelUrl = appendQuery(data.cancelUrl, { status: 'canceled' });
              window.location.href = cancelUrl;
            }
          },
        });

        if (!paddle) {
          throw new Error('Paddle initialization failed');
        }

        hasOpenedRef.current = true;
        paddle.Checkout.open({
          items: [{ priceId: data.priceId, quantity: 1 }],
          customer: { email: data.customerEmail },
          customData: data.customData,
          ...(data.discountCode ? { discountCode: data.discountCode } : {}),
          // Mobile redirects are handled in checkout.completed / checkout.closed.
        });
      } catch (err: any) {
        setError(err.message || 'Failed to open checkout');
      }
    };

    run();
  }, [token]);

  return <CheckoutStatus statusMessage={statusMessage} error={error} />;
}

export default function MobileCheckoutPage() {
  return (
    <Suspense fallback={<CheckoutStatus statusMessage="Preparing secure checkout..." error={null} />}>
      <MobileCheckoutContent />
    </Suspense>
  );
}
