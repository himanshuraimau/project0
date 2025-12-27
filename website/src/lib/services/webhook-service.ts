/**
 * Webhook Service
 * Handles ElevenLabs webhook events for podcast generation status updates
 * Requirements: 2.1, 2.2, 2.5, 8.1
 */

import * as crypto from 'crypto';
import { Buffer } from 'buffer';
import { config } from '@/lib/config/environment';
import { podcastService } from './podcast-service';
import { PodcastStatus } from '@prisma/client';
import {
  ElevenLabsWebhookPayload,
  GenerationStartedPayload,
  GenerationCompletedPayload,
  GenerationFailedPayload,
} from '../types/podcast';

// Webhook processing result interface
interface WebhookProcessingResult {
  success: boolean;
  message: string;
  processed: boolean; // Whether the webhook was actually processed (not duplicate)
  error?: string;
}

// Webhook event types
type WebhookEventType = 'generation_started' | 'generation_completed' | 'generation_failed';

// Processed webhook tracking for idempotency
const processedWebhooks = new Map<string, { timestamp: number; result: WebhookProcessingResult }>();

// Clean up old processed webhook records every hour
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const WEBHOOK_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

setInterval(() => {
  const now = Date.now();
  processedWebhooks.forEach((value, key) => {
    if (now - value.timestamp > WEBHOOK_EXPIRY) {
      processedWebhooks.delete(key);
    }
  });
}, CLEANUP_INTERVAL);

/**
 * Webhook Service Class
 * Handles ElevenLabs webhook processing with signature verification and idempotency
 */
export class WebhookService {
  private readonly webhookSecret: string;

  constructor() {
    this.webhookSecret = config.ai.elevenlabs.webhookSecret;
    
    if (!this.webhookSecret) {
      console.warn('ElevenLabs webhook secret not configured. Webhook signature verification will be disabled.');
    }
  }

  /**
   * Main webhook handler - processes incoming ElevenLabs webhooks
   * Requirements: 2.1, 2.2, 2.5
   */
  async handleWebhook(
    payload: string,
    signature: string,
    headers: Record<string, string> = {}
  ): Promise<WebhookProcessingResult> {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(payload, signature)) {
        return {
          success: false,
          processed: false,
          message: 'Invalid webhook signature',
          error: 'INVALID_SIGNATURE',
        };
      }

      // Parse webhook payload
      let webhookData: ElevenLabsWebhookPayload;
      try {
        webhookData = JSON.parse(payload);
      } catch (parseError) {
        return {
          success: false,
          processed: false,
          message: 'Invalid JSON payload',
          error: 'INVALID_JSON',
        };
      }

      // Validate required fields
      if (!webhookData.event_type || !webhookData.project_id) {
        return {
          success: false,
          processed: false,
          message: 'Missing required webhook fields (event_type, project_id)',
          error: 'MISSING_FIELDS',
        };
      }

      // Check for idempotency - prevent duplicate processing
      const idempotencyKey = this.generateIdempotencyKey(webhookData);
      const existingResult = processedWebhooks.get(idempotencyKey);
      
      if (existingResult) {
        console.log(`Webhook already processed: ${idempotencyKey}`);
        return {
          ...existingResult.result,
          processed: false, // Mark as not processed since it's a duplicate
        };
      }

      // Process webhook based on event type
      let result: WebhookProcessingResult;
      
      switch (webhookData.event_type) {
        case 'generation_started':
          result = await this.processGenerationStarted(webhookData.data, webhookData.project_id);
          break;
          
        case 'generation_completed':
          result = await this.processGenerationCompleted(webhookData.data, webhookData.project_id);
          break;
          
        case 'generation_failed':
          result = await this.processGenerationFailed(webhookData.data, webhookData.project_id);
          break;
          
        default:
          result = {
            success: false,
            processed: false,
            message: `Unknown webhook event type: ${webhookData.event_type}`,
            error: 'UNKNOWN_EVENT_TYPE',
          };
      }

      // Store result for idempotency
      processedWebhooks.set(idempotencyKey, {
        timestamp: Date.now(),
        result: { ...result, processed: true },
      });

      return { ...result, processed: true };
      
    } catch (error) {
      console.error('Error processing webhook:', error);
      return {
        success: false,
        processed: false,
        message: 'Internal error processing webhook',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
      };
    }
  }

  /**
   * Verify webhook signature using HMAC-SHA256
   * Requirements: 2.5, 8.1
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      console.warn('Webhook secret not configured, skipping signature verification');
      return true; // Allow webhooks in development if secret not set
    }

    if (!signature) {
      console.error('No signature provided for webhook verification');
      return false;
    }

    try {
      // ElevenLabs uses HMAC-SHA256 for webhook signatures
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload, 'utf8')
        .digest('hex');

      // Handle different signature formats
      const providedSignature = signature.startsWith('sha256=') 
        ? signature.slice(7) // Remove 'sha256=' prefix
        : signature;

      // Use timing-safe comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      );
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Process generation_started webhook event
   * Requirements: 2.2
   */
  async processGenerationStarted(
    data: GenerationStartedPayload,
    projectId: string
  ): Promise<WebhookProcessingResult> {
    try {
      console.log(`Processing generation_started for project: ${projectId}`);

      // Find podcast by ElevenLabs project ID
      const podcast = await podcastService.getInstance().getPodcastByProjectId(projectId);
      
      if (!podcast) {
        return {
          success: false,
          processed: true,
          message: `Podcast not found for project ID: ${projectId}`,
          error: 'PODCAST_NOT_FOUND',
        };
      }

      // Update podcast status to IN_PROGRESS
      await podcastService.getInstance().updatePodcastStatus(
        podcast.id,
        PodcastStatus.IN_PROGRESS,
        20, // Set progress to 20% when generation starts
        undefined, // No error message
      );

      console.log(`Updated podcast ${podcast.id} status to IN_PROGRESS`);

      return {
        success: true,
        processed: true,
        message: `Generation started for podcast ${podcast.id}`,
      };
    } catch (error) {
      console.error('Error processing generation_started webhook:', error);
      return {
        success: false,
        processed: true,
        message: 'Failed to process generation_started webhook',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
      };
    }
  }

  /**
   * Process generation_completed webhook event
   * Requirements: 2.3
   */
  async processGenerationCompleted(
    data: GenerationCompletedPayload,
    projectId: string
  ): Promise<WebhookProcessingResult> {
    try {
      console.log(`Processing generation_completed for project: ${projectId}`);

      // Find podcast by ElevenLabs project ID
      const podcast = await podcastService.getInstance().getPodcastByProjectId(projectId);
      
      if (!podcast) {
        return {
          success: false,
          processed: true,
          message: `Podcast not found for project ID: ${projectId}`,
          error: 'PODCAST_NOT_FOUND',
        };
      }

      // Validate required data
      if (!data.audio_url) {
        console.error('No audio URL provided in completion webhook for project:', projectId);
        
        // Update podcast status to failed instead of completed
        await podcastService.getInstance().updatePodcastStatus(
          podcast.id,
          PodcastStatus.FAILED,
          undefined,
          'Audio URL not provided by ElevenLabs'
        );
        
        return {
          success: false,
          processed: true,
          message: 'No audio URL provided in completion webhook',
          error: 'MISSING_AUDIO_URL',
        };
      }

      // Download audio from ElevenLabs
      // Download audio from ElevenLabs and upload to UploadThing
      let audioUrl: string;
      let audioFileKey: string;
      try {
        const { uploadThingAudioStorageService } = await import('../uploadthing');
        
        const uploadResult = await uploadThingAudioStorageService.downloadAndUploadAudio(data.audio_url, {
          podcastId: podcast.id,
          noteId: podcast.noteId,
          userId: podcast.userId || '',
          title: podcast.title,
          duration: data.duration ? Math.round(data.duration) : undefined,
        });

        audioUrl = uploadResult.url;
        audioFileKey = uploadResult.fileKey;
      } catch (error) {
        console.error('Error downloading and uploading audio:', error);
        
        // Update podcast status to failed
        await podcastService.getInstance().updatePodcastStatus(
          podcast.id,
          PodcastStatus.FAILED,
          undefined,
          `Failed to download and upload audio: ${error instanceof Error ? error.message : 'Unknown error'}`
        );

        return {
          success: false,
          processed: true,
          message: 'Failed to download and upload audio file',
          error: error instanceof Error ? error.message : 'DOWNLOAD_UPLOAD_ERROR',
        };
      }

      // Update podcast status to completed
      await podcastService.getInstance().updatePodcastStatus(
        podcast.id,
        PodcastStatus.COMPLETED,
        100, // Set progress to 100%
        undefined, // No error message
        audioUrl,
        audioFileKey,
        data.duration ? Math.round(data.duration) : undefined,
        data.file_size || undefined
      );

      console.log(`Completed podcast ${podcast.id} processing`);

      return {
        success: true,
        processed: true,
        message: `Generation completed for podcast ${podcast.id}`,
      };
    } catch (error) {
      console.error('Error processing generation_completed webhook:', error);
      return {
        success: false,
        processed: true,
        message: 'Failed to process generation_completed webhook',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
      };
    }
  }

  /**
   * Process generation_failed webhook event
   * Requirements: 2.4
   */
  async processGenerationFailed(
    data: GenerationFailedPayload,
    projectId: string
  ): Promise<WebhookProcessingResult> {
    try {
      console.log(`Processing generation_failed for project: ${projectId}`);

      // Find podcast by ElevenLabs project ID
      const podcast = await podcastService.getInstance().getPodcastByProjectId(projectId);
      
      if (!podcast) {
        return {
          success: false,
          processed: true,
          message: `Podcast not found for project ID: ${projectId}`,
          error: 'PODCAST_NOT_FOUND',
        };
      }

      // Extract error message
      const errorMessage = data.error_message || 'Generation failed without specific error message';

      // Update podcast status to failed
      await podcastService.getInstance().updatePodcastStatus(
        podcast.id,
        PodcastStatus.FAILED,
        undefined, // Don't change progress
        errorMessage
      );

      console.log(`Updated podcast ${podcast.id} status to FAILED: ${errorMessage}`);

      return {
        success: true,
        processed: true,
        message: `Generation failed for podcast ${podcast.id}: ${errorMessage}`,
      };
    } catch (error) {
      console.error('Error processing generation_failed webhook:', error);
      return {
        success: false,
        processed: true,
        message: 'Failed to process generation_failed webhook',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
      };
    }
  }

  /**
   * Generate idempotency key for webhook deduplication
   * Requirements: 2.5
   */
  private generateIdempotencyKey(webhookData: ElevenLabsWebhookPayload): string {
    // Create a unique key based on event type, project ID, and timestamp
    const keyData = `${webhookData.event_type}:${webhookData.project_id}:${webhookData.timestamp}`;
    return crypto.createHash('sha256').update(keyData).digest('hex');
  }

  /**
   * Extract file key from UploadThing URL for deletion purposes
   */
  private extractFileKeyFromUrl(url: string): string {
    try {
      // UploadThing URLs typically have the format: https://uploadthing.com/f/{fileKey}
      const urlParts = url.split('/');
      return urlParts[urlParts.length - 1] || url;
    } catch (error) {
      console.warn('Failed to extract file key from URL:', url);
      return url; // Return full URL as fallback
    }
  }

  /**
   * Get webhook processing statistics
   */
  getProcessingStats(): {
    totalProcessed: number;
    cacheSize: number;
    oldestEntry: number | null;
  } {
    const entries = Array.from(processedWebhooks.values());
    return {
      totalProcessed: entries.length,
      cacheSize: processedWebhooks.size,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : null,
    };
  }

  /**
   * Clear processed webhook cache (for testing or maintenance)
   */
  clearProcessedWebhooks(): void {
    processedWebhooks.clear();
  }

  /**
   * Check if webhook service is properly configured
   */
  isConfigured(): boolean {
    return !!this.webhookSecret;
  }

  /**
   * Get configuration status for debugging
   */
  getConfigurationStatus(): {
    webhookSecret: boolean;
    configured: boolean;
  } {
    return {
      webhookSecret: !!this.webhookSecret,
      configured: this.isConfigured(),
    };
  }
}

// Export singleton instance
let _webhookService: WebhookService | null = null;

export const webhookService = {
  getInstance(): WebhookService {
    if (!_webhookService) {
      _webhookService = new WebhookService();
    }
    return _webhookService;
  },
};

// Export types for external use
export type {
  WebhookProcessingResult,
  WebhookEventType,
};