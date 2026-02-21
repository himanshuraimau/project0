/**
 * Main Payments Module
 * Centralizes all payment-related functionality
 * 
 * Usage:
 * import { PaymentService } from '@/lib/payments';
 * 
 * // Create subscription
 * await PaymentService.createSubscription({ ... });
 * 
 * // Change plan
 * await PaymentService.changePlan({ userId, targetBillingInterval: 'yearly', immediate: true });
 * 
 * // Cancel subscription
 * await PaymentService.cancelSubscription({ userId, cancelAtPeriodEnd: true });
 */

// Main Payment Service
export { PaymentService } from './payment-service';
export type { 
  PlanComparison,
  CreateSubscriptionParams as PaymentCreateParams,
  PlanChangeParams,
  CancelSubscriptionParams,
  PaymentRegion
} from './payment-service';

// Dodo Payments Integration
export {
  DodoSubscriptionService,
  DodoWebhookService,
  getDodoConfig,
  DODO_CONFIG,
  SUBSCRIPTION_CONFIG,
  SUBSCRIPTION_CONFIG_YEARLY,
  SUBSCRIPTION_PLAN,
  SUBSCRIPTION_PLAN_YEARLY,
  WEBHOOK_EVENTS,
  getDodoClient,
  validateDodoConfig,
  testDodoConnection,
  // UPI & Regional Payment Method Constants
  PAYMENT_METHOD_TYPES,
  REGIONAL_PAYMENT_CONFIG,
  TEST_UPI_IDS,
} from './dodo';

export type {
  DodoSubscriptionResponse,
  DodoSubscriptionCreateRequest,
  DodoWebhookPayload,
  DodoSubscriptionStatus,
  SubscriptionBillingAddress,
  CreateSubscriptionParams as DodoCreateParams,
  SubscriptionManagementResult,
  BillingInterval,
  WebhookEvent,
  // Regional Payment Types
  PaymentMethodType,
  BillingCurrency,
  BillingCountry,
  RegionalCheckoutOptions,
  CreateCheckoutSessionParams,
  CheckoutSessionResult,
} from './dodo';

// Region Detection Utilities
export {
  detectRegionFromPhone,
  isIndianPincode,
  formatIndianPhoneNumber,
  getPaymentRegionConfig,
  validateIndianPhoneForUPI,
} from './utils';
