import type { Subscription } from '@/lib/api/types';

const DEFAULT_MONTHLY_AMOUNT = '$19.99';
const DEFAULT_YEARLY_AMOUNT = '$89';

export function getPriceIdConfig() {
  return {
    monthly: process.env.EXPO_PUBLIC_PADDLE_MONTHLY_PRICE_ID || '',
    yearly: process.env.EXPO_PUBLIC_PADDLE_YEARLY_PRICE_ID || '',
  };
}

export function isYearlySubscription(subscription: Subscription | null | undefined): boolean {
  if (!subscription) return false;

  const { yearly } = getPriceIdConfig();
  const normalizedPriceId = subscription.priceId?.toLowerCase() || '';

  if (yearly && normalizedPriceId === yearly.toLowerCase()) {
    return true;
  }

  // Fallback for legacy data during rollout
  const legacyProductId = subscription.productId?.toLowerCase() || '';
  return (
    normalizedPriceId.includes('yearly') ||
    normalizedPriceId.includes('annual') ||
    normalizedPriceId.includes('year') ||
    legacyProductId.includes('yearly') ||
    legacyProductId.includes('annual') ||
    legacyProductId.includes('year')
  );
}

export function getSubscriptionPlanDisplay(subscription: Subscription | null | undefined): string {
  if (!subscription) return 'Premium';
  return isYearlySubscription(subscription)
    ? `Pro - ${DEFAULT_YEARLY_AMOUNT}/year`
    : `Pro - ${DEFAULT_MONTHLY_AMOUNT}/month`;
}

export function getSubscriptionPlanDetails(subscription: Subscription | null | undefined) {
  if (isYearlySubscription(subscription)) {
    return { name: 'Pro', price: DEFAULT_YEARLY_AMOUNT, interval: 'year' as const };
  }
  return { name: 'Pro', price: DEFAULT_MONTHLY_AMOUNT, interval: 'month' as const };
}
