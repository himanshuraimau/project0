// Dodo Payments client setup and configuration

import DodoPayments from 'dodopayments';
import { DODO_CONFIG } from './constants';

// Singleton client instance
let dodoClientInstance: DodoPayments | null = null;

/**
 * Get or create Dodo Payments client instance
 */
export function getDodoClient(): DodoPayments {
  if (!dodoClientInstance) {
    if (!DODO_CONFIG.apiKey) {
      throw new Error('DODO_PAYMENTS_API_KEY environment variable is required');
    }

    console.log('Initializing Dodo client with:', {
      environment: DODO_CONFIG.environment,
      hasApiKey: !!DODO_CONFIG.apiKey,
      apiKeyLength: DODO_CONFIG.apiKey?.length,
    });

    dodoClientInstance = new DodoPayments({
      bearerToken: DODO_CONFIG.apiKey,
      environment: DODO_CONFIG.environment as 'test_mode' | 'live_mode',
    });
  }

  return dodoClientInstance;
}

/**
 * Validate Dodo Payments configuration
 */
export function validateDodoConfig(): void {
  const requiredEnvVars = [
    'DODO_PAYMENTS_API_KEY',
    'DODO_PAYMENTS_WEBHOOK_KEY', 
    'DODO_PAYMENTS_RETURN_URL',
    'NEXT_PUBLIC_DODO_PAYMENT_SUBSCRIPTION_ID',
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required Dodo Payments environment variables: ${missing.join(', ')}`
    );
  }
}

/**
 * Test Dodo Payments connection
 */
export async function testDodoConnection(): Promise<boolean> {
  try {
    const client = getDodoClient();
    // Try to list subscriptions to test connection
    await client.subscriptions.list({ page_size: 1 });
    return true;
  } catch (error) {
    console.error('Dodo Payments connection test failed:', error);
    return false;
  }
}

// Validate configuration on import
if (typeof window === 'undefined') {
  // Only validate on server-side
  try {
    validateDodoConfig();
  } catch (error) {
    console.warn('Dodo Payments configuration warning:', error);
  }
}