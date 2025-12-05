// TypeScript types for Dodo Payments integration

export interface DodoSubscriptionResponse {
  subscription_id: string;
  client_secret: string;
  customer: {
    customer_id: string;
    email: string;
    name: string;
  };
  payment_link?: string;
  recurring_pre_tax_amount: number;
  status: DodoSubscriptionStatus;
  created_at: string;
  next_billing_date: string;
  current_period_start?: string;
  current_period_end?: string;
  trial_end?: string;
  cancel_at_next_billing_date?: boolean;
  cancelled_at?: string;
}

export interface DodoSubscriptionCreateRequest {
  billing: {
    city: string;
    country: 'US' | 'GB' | 'CA' | 'AU' | 'IN' | string; // Allow any string but suggest common ones
    state: string;
    street: string;
    zipcode: string;
  };
  customer: {
    email: string;
    name: string;
    phone_number?: string;
  } | {
    customer_id: string;
  };
  product_id: string;
  quantity?: number;
  payment_link?: boolean;
  return_url?: string;
  trial_period_days?: number;
  metadata?: Record<string, any>;
}

export interface DodoWebhookPayload {
  business_id: string;
  timestamp: string;
  type: string;
  data: {
    subscription_id?: string;
    payment_id?: string;
    customer?: {
      customer_id: string;
      email: string;
      name: string;
    };
    status?: DodoSubscriptionStatus;
    next_billing_date?: string;
    cancelled_at?: string;
    trial_end?: string;
    [key: string]: any;
  };
}

export type DodoSubscriptionStatus = 
  | 'pending'
  | 'active' 
  | 'on_hold'
  | 'cancelled'
  | 'failed'
  | 'expired';

export interface SubscriptionBillingAddress {
  city: string;
  country: string;
  state: string;
  street: string;
  zipcode: string;
}

export type BillingInterval = 'monthly' | 'yearly';

export interface CreateSubscriptionParams {
  userId: string;
  userEmail: string;
  userName: string;
  billingAddress: SubscriptionBillingAddress;
  billingInterval?: BillingInterval; // Defaults to 'monthly' if not specified
  trialDays?: number;
  metadata?: Record<string, any>;
}

export interface SubscriptionManagementResult {
  success: boolean;
  subscriptionId?: string;
  paymentLink?: string;
  error?: string;
  data?: any;
}