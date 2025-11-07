/**
 * Podcast-specific error types and interfaces
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { AppErrorType } from '../utils/enhanced-error-handler';

// Podcast-specific error types
export enum PodcastErrorType {
  // Generation errors
  GENERATION_FAILED = 'PODCAST_GENERATION_FAILED',
  GENERATION_TIMEOUT = 'PODCAST_GENERATION_TIMEOUT',
  GENERATION_CANCELLED = 'PODCAST_GENERATION_CANCELLED',
  
  // ElevenLabs API errors
  ELEVENLABS_API_ERROR = 'ELEVENLABS_API_ERROR',
  ELEVENLABS_QUOTA_EXCEEDED = 'ELEVENLABS_QUOTA_EXCEEDED',
  ELEVENLABS_AUTHENTICATION_FAILED = 'ELEVENLABS_AUTHENTICATION_FAILED',
  ELEVENLABS_INVALID_VOICE = 'ELEVENLABS_INVALID_VOICE',
  ELEVENLABS_CONTENT_TOO_LONG = 'ELEVENLABS_CONTENT_TOO_LONG',
  ELEVENLABS_CONTENT_TOO_SHORT = 'ELEVENLABS_CONTENT_TOO_SHORT',
  
  // Webhook errors
  WEBHOOK_VERIFICATION_FAILED = 'WEBHOOK_VERIFICATION_FAILED',
  WEBHOOK_PROCESSING_FAILED = 'WEBHOOK_PROCESSING_FAILED',
  WEBHOOK_DUPLICATE_EVENT = 'WEBHOOK_DUPLICATE_EVENT',
  
  // Audio processing errors
  AUDIO_DOWNLOAD_FAILED = 'AUDIO_DOWNLOAD_FAILED',
  AUDIO_UPLOAD_FAILED = 'AUDIO_UPLOAD_FAILED',
  AUDIO_PROCESSING_FAILED = 'AUDIO_PROCESSING_FAILED',
  AUDIO_PLAYBACK_FAILED = 'AUDIO_PLAYBACK_FAILED',
  AUDIO_FILE_CORRUPTED = 'AUDIO_FILE_CORRUPTED',
  
  // Transcript errors
  TRANSCRIPT_SYNC_FAILED = 'TRANSCRIPT_SYNC_FAILED',
  TRANSCRIPT_PROCESSING_FAILED = 'TRANSCRIPT_PROCESSING_FAILED',
  TRANSCRIPT_NOT_AVAILABLE = 'TRANSCRIPT_NOT_AVAILABLE',
  
  // Database errors
  PODCAST_NOT_FOUND = 'PODCAST_NOT_FOUND',
  PODCAST_SAVE_FAILED = 'PODCAST_SAVE_FAILED',
  PODCAST_DELETE_FAILED = 'PODCAST_DELETE_FAILED',
  PODCAST_UPDATE_FAILED = 'PODCAST_UPDATE_FAILED',
  
  // Validation errors
  INVALID_NOTE_CONTENT = 'INVALID_NOTE_CONTENT',
  INVALID_GENERATION_OPTIONS = 'INVALID_GENERATION_OPTIONS',
  INVALID_VOICE_SETTINGS = 'INVALID_VOICE_SETTINGS',
  
  // Permission errors
  PODCAST_ACCESS_DENIED = 'PODCAST_ACCESS_DENIED',
  NOTE_ACCESS_DENIED = 'NOTE_ACCESS_DENIED',
  
  // Generic podcast errors
  PODCAST_SERVICE_UNAVAILABLE = 'PODCAST_SERVICE_UNAVAILABLE',
  PODCAST_UNKNOWN_ERROR = 'PODCAST_UNKNOWN_ERROR'
}

// Podcast error information interface
export interface PodcastErrorInfo {
  type: PodcastErrorType | AppErrorType;
  message: string;
  userMessage: string;
  retryable: boolean;
  statusCode: number;
  context?: Record<string, unknown>;
  timestamp: Date;
  errorId: string;
  podcastId?: string;
  noteId?: string;
  userId?: string;
}

// Retry configuration for podcast operations
export interface PodcastRetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: (PodcastErrorType | AppErrorType)[];
}

// Error recovery options
export interface PodcastErrorRecoveryOptions {
  canRetry: boolean;
  canRegenerate: boolean;
  canChangeSettings: boolean;
  canContactSupport: boolean;
  suggestedActions: string[];
}

// Error state for podcast components
export interface PodcastErrorState {
  hasError: boolean;
  error: PodcastErrorInfo | null;
  retryCount: number;
  maxRetries: number;
  isRetrying: boolean;
  recoveryOptions: PodcastErrorRecoveryOptions;
}

// Error context for different podcast operations
export interface PodcastOperationContext {
  operation: 'generate' | 'regenerate' | 'delete' | 'play' | 'download' | 'sync';
  podcastId?: string;
  noteId?: string;
  userId?: string;
  generationOptions?: Record<string, unknown>;
  timestamp: Date;
}

// Default retry configurations for different operations
export const PODCAST_RETRY_CONFIGS: Record<string, PodcastRetryConfig> = {
  generation: {
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableErrors: [
      PodcastErrorType.ELEVENLABS_API_ERROR,
      PodcastErrorType.GENERATION_TIMEOUT,
      PodcastErrorType.AUDIO_DOWNLOAD_FAILED,
      PodcastErrorType.AUDIO_UPLOAD_FAILED,
      AppErrorType.NETWORK_ERROR,
      AppErrorType.SERVER_UNAVAILABLE
    ]
  },
  playback: {
    maxRetries: 2,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2,
    retryableErrors: [
      PodcastErrorType.AUDIO_PLAYBACK_FAILED,
      AppErrorType.NETWORK_ERROR
    ]
  },
  sync: {
    maxRetries: 2,
    baseDelay: 500,
    maxDelay: 2000,
    backoffMultiplier: 1.5,
    retryableErrors: [
      PodcastErrorType.TRANSCRIPT_SYNC_FAILED,
      PodcastErrorType.TRANSCRIPT_PROCESSING_FAILED
    ]
  },
  webhook: {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 60000,
    backoffMultiplier: 2,
    retryableErrors: [
      PodcastErrorType.WEBHOOK_PROCESSING_FAILED,
      PodcastErrorType.AUDIO_DOWNLOAD_FAILED,
      PodcastErrorType.AUDIO_UPLOAD_FAILED,
      AppErrorType.DATABASE_CONNECTION_FAILED,
      AppErrorType.NETWORK_ERROR
    ]
  }
};