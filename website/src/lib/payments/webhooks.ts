// Dodo Payments webhook handling service

import crypto from 'crypto';
import { DODO_CONFIG, WEBHOOK_EVENTS } from './constants';
import type { DodoWebhookPayload } from './types';

export class DodoWebhookService {
  /**
   * Verify webhook signature for security
   */
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string = DODO_CONFIG.webhookKey
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(`sha256=${expectedSignature}`),
        Buffer.from(signature)
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Process webhook payload
   */
  static async processWebhook(payload: DodoWebhookPayload): Promise<void> {
    try {
      console.log('Processing Dodo webhook:', {
        type: payload.type,
        subscriptionId: payload.data.subscription_id,
        timestamp: payload.timestamp,
      });

      switch (payload.type) {
        case WEBHOOK_EVENTS.SUBSCRIPTION_ACTIVE:
          await this.handleSubscriptionActive(payload);
          break;
          
        case WEBHOOK_EVENTS.SUBSCRIPTION_ON_HOLD:
          await this.handleSubscriptionOnHold(payload);
          break;
          
        case WEBHOOK_EVENTS.SUBSCRIPTION_CANCELLED:
          await this.handleSubscriptionCancelled(payload);
          break;
          
        case WEBHOOK_EVENTS.SUBSCRIPTION_RENEWED:
          await this.handleSubscriptionRenewed(payload);
          break;
          
        case WEBHOOK_EVENTS.SUBSCRIPTION_FAILED:
          await this.handleSubscriptionFailed(payload);
          break;
          
        case WEBHOOK_EVENTS.PAYMENT_SUCCEEDED:
          await this.handlePaymentSucceeded(payload);
          break;
          
        case WEBHOOK_EVENTS.PAYMENT_FAILED:
          await this.handlePaymentFailed(payload);
          break;
          
        default:
          console.log('Unhandled webhook event type:', payload.type);
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }

  /**
   * Handle subscription activation
   */
  private static async handleSubscriptionActive(payload: DodoWebhookPayload): Promise<void> {
    const { subscription_id } = payload.data;
    
    if (!subscription_id) {
      console.error('No subscription_id in subscription.active webhook');
      return;
    }

    try {
      // TODO: Update subscription status in database
      console.log('Subscription activated:', subscription_id);
      
      // Find user by subscription_id and update status to ACTIVE
      // This will be implemented when we create the database service
      
    } catch (error) {
      console.error('Failed to handle subscription activation:', error);
      throw error;
    }
  }

  /**
   * Handle subscription on hold
   */
  private static async handleSubscriptionOnHold(payload: DodoWebhookPayload): Promise<void> {
    const { subscription_id } = payload.data;
    
    if (!subscription_id) {
      console.error('No subscription_id in subscription.on_hold webhook');
      return;
    }

    try {
      console.log('Subscription on hold:', subscription_id);
      
      // TODO: Update subscription status in database to ON_HOLD
      // Optionally notify user about payment issue
      
    } catch (error) {
      console.error('Failed to handle subscription on hold:', error);
      throw error;
    }
  }

  /**
   * Handle subscription cancellation
   */
  private static async handleSubscriptionCancelled(payload: DodoWebhookPayload): Promise<void> {
    const { subscription_id, cancelled_at } = payload.data;
    
    if (!subscription_id) {
      console.error('No subscription_id in subscription.cancelled webhook');
      return;
    }

    try {
      console.log('Subscription cancelled:', subscription_id);
      
      // TODO: Update subscription status in database to CANCELLED
      // Set cancelled_at timestamp
      
    } catch (error) {
      console.error('Failed to handle subscription cancellation:', error);
      throw error;
    }
  }

  /**
   * Handle subscription renewal
   */
  private static async handleSubscriptionRenewed(payload: DodoWebhookPayload): Promise<void> {
    const { subscription_id, next_billing_date } = payload.data;
    
    if (!subscription_id) {
      console.error('No subscription_id in subscription.renewed webhook');
      return;
    }

    try {
      console.log('Subscription renewed:', subscription_id);
      
      // TODO: Update subscription billing dates in database
      // Ensure status is ACTIVE
      
    } catch (error) {
      console.error('Failed to handle subscription renewal:', error);
      throw error;
    }
  }

  /**
   * Handle subscription failure
   */
  private static async handleSubscriptionFailed(payload: DodoWebhookPayload): Promise<void> {
    const { subscription_id } = payload.data;
    
    if (!subscription_id) {
      console.error('No subscription_id in subscription.failed webhook');
      return;
    }

    try {
      console.log('Subscription failed:', subscription_id);
      
      // TODO: Update subscription status in database to FAILED
      // Optionally notify user about the failure
      
    } catch (error) {
      console.error('Failed to handle subscription failure:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  private static async handlePaymentSucceeded(payload: DodoWebhookPayload): Promise<void> {
    const { payment_id, subscription_id } = payload.data;
    
    try {
      console.log('Payment succeeded:', { payment_id, subscription_id });
      
      // TODO: Log successful payment
      // Update subscription if needed
      
    } catch (error) {
      console.error('Failed to handle payment success:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment
   */
  private static async handlePaymentFailed(payload: DodoWebhookPayload): Promise<void> {
    const { payment_id, subscription_id } = payload.data;
    
    try {
      console.log('Payment failed:', { payment_id, subscription_id });
      
      // TODO: Log failed payment
      // Optionally notify user
      
    } catch (error) {
      console.error('Failed to handle payment failure:', error);
      throw error;
    }
  }
}