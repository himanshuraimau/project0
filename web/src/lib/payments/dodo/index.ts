// Main export file for Dodo Payments integration
// Clean, organized exports

// Configuration
export { getDodoConfig, DODO_CONFIG, SUBSCRIPTION_CONFIG, SUBSCRIPTION_CONFIG_YEARLY, SUBSCRIPTION_PLAN, SUBSCRIPTION_PLAN_YEARLY, WEBHOOK_EVENTS } from './config/constants';
export type { WebhookEvent } from './config/constants';

// Client
export { getDodoClient, validateDodoConfig, testDodoConnection } from './config/client';

// Services
export { DodoSubscriptionService } from './services/subscription';
export { DodoWebhookService } from './services/webhooks';

// Types
export type {
  DodoSubscriptionResponse,
  DodoSubscriptionCreateRequest,
  DodoWebhookPayload,
  DodoSubscriptionStatus,
  SubscriptionBillingAddress,
  CreateSubscriptionParams,
  SubscriptionManagementResult,
  BillingInterval,
} from './types';
