// Main export file for Dodo Payments utilities

// Client and configuration
export { getDodoClient, validateDodoConfig, testDodoConnection } from './client';
export { DODO_CONFIG, SUBSCRIPTION_CONFIG, SUBSCRIPTION_PLAN, WEBHOOK_EVENTS } from './constants';

// Services
export { DodoSubscriptionService } from './subscription';
export { DodoWebhookService } from './webhooks';

// Types
export type {
  DodoSubscriptionResponse,
  DodoSubscriptionCreateRequest,
  DodoWebhookPayload,
  DodoSubscriptionStatus,
  SubscriptionBillingAddress,
  CreateSubscriptionParams,
  SubscriptionManagementResult,
} from './types';

// Utility functions
export const DodoUtils = {
  /**
   * Format price for display
   */
  formatPrice: (priceInCents: number): string => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  },

  /**
   * Validate billing address
   */
  validateBillingAddress: (address: any): boolean => {
    const required = ['city', 'country', 'state', 'street', 'zipcode'];
    return required.every(field => 
      address[field] && typeof address[field] === 'string' && address[field].trim()
    );
  },

  /**
   * Get country code for Dodo (ISO 3166-1 alpha-2)
   */
  getCountryCode: (countryName: string): string => {
    // Simple mapping - in production, use a proper country code library
    const countryMap: Record<string, string> = {
      'United States': 'US',
      'United Kingdom': 'GB', 
      'Canada': 'CA',
      'Australia': 'AU',
      'India': 'IN',
      // Add more as needed
    };
    
    return countryMap[countryName] || 'US'; // Default to US
  },

  /**
   * Calculate trial end date
   */
  calculateTrialEnd: (trialDays: number): Date => {
    const now = new Date();
    return new Date(now.getTime() + (trialDays * 24 * 60 * 60 * 1000));
  },

  /**
   * Check if subscription is expiring soon
   */
  isExpiringSoon: (endDate: Date, daysThreshold: number = 7): boolean => {
    const now = new Date();
    const threshold = new Date(now.getTime() + (daysThreshold * 24 * 60 * 60 * 1000));
    return endDate <= threshold;
  },
};