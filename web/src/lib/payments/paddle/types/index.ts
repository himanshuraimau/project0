export type BillingInterval = 'monthly' | 'yearly';

export interface PaddleSubscriptionItem {
  priceId: string;
  quantity: number;
}

export interface CheckoutSessionResult {
  success: boolean;
  transactionId?: string;
  checkoutUrl?: string;
  error?: string;
}

export interface SubscriptionManagementResult {
  success: boolean;
  subscriptionId?: string;
  error?: string;
  data?: any;
}
