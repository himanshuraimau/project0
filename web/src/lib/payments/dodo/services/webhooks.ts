// Dodo Payments webhook verification service
// Uses Standard Webhooks specification (webhook-signature, webhook-id, webhook-timestamp)

import crypto from 'crypto';
import { DODO_CONFIG } from '../config/constants';
import type { DodoWebhookPayload } from '../types';

export class DodoWebhookService {
  /**
   * Verify webhook signature using Standard Webhooks specification
   * Dodo Payments uses Standard Webhooks: https://standardwebhooks.com/
   */
  static verifyWebhookSignature(
    payload: string,
    headers: {
      'webhook-id': string;
      'webhook-signature': string;
      'webhook-timestamp': string;
    },
    secret: string = DODO_CONFIG.webhookKey
  ): boolean {
    try {
      const { 'webhook-id': webhookId, 'webhook-signature': signature, 'webhook-timestamp': timestamp } = headers;

      if (!webhookId || !signature || !timestamp) {
        console.error('Missing required webhook headers');
        return false;
      }

      // Build signed message: webhook-id.webhook-timestamp.payload
      const signedContent = `${webhookId}.${timestamp}.${payload}`;

      // Compute HMAC SHA256
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(signedContent)
        .digest('hex');

      // Standard Webhooks format: signature is prefixed with "sha256="
      const expectedSignatureWithPrefix = `sha256=${expectedSignature}`;

      // Compare signatures using timing-safe comparison
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignatureWithPrefix)
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Verify webhook timestamp to prevent replay attacks
   * Standard Webhooks recommends rejecting requests older than 5 minutes
   */
  static verifyWebhookTimestamp(timestamp: string, toleranceSeconds: number = 300): boolean {
    try {
      const webhookTime = parseInt(timestamp, 10);
      const currentTime = Math.floor(Date.now() / 1000);
      const timeDifference = Math.abs(currentTime - webhookTime);

      if (timeDifference > toleranceSeconds) {
        console.warn(`Webhook timestamp too old: ${timeDifference}s difference`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to verify webhook timestamp:', error);
      return false;
    }
  }
}
