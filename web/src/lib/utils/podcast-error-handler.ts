/**
 * Podcast-specific error handling utilities
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { toast } from 'sonner';
import { 
  PodcastErrorType, 
  PodcastErrorInfo, 
  PodcastRetryConfig, 
  PodcastErrorRecoveryOptions,
  PodcastOperationContext,
  PODCAST_RETRY_CONFIGS
} from '../types/podcast-error.types';
import { AppError, AppErrorType, createAppError, classifyError } from './enhanced-error-handler';

// Error message mappings for podcast-specific errors
export const PODCAST_ERROR_MESSAGES: Record<PodcastErrorType, { 
  message: string; 
  userMessage: string; 
  statusCode: number; 
  retryable: boolean;
  recoveryOptions: PodcastErrorRecoveryOptions;
}> = {
  // Generation errors
  [PodcastErrorType.GENERATION_FAILED]: {
    message: 'Podcast generation failed',
    userMessage: 'Failed to generate your podcast. Please try again with different settings.',
    statusCode: 500,
    retryable: true,
    recoveryOptions: {
      canRetry: true,
      canRegenerate: true,
      canChangeSettings: true,
      canContactSupport: true,
      suggestedActions: ['Try again', 'Change voice settings', 'Shorten content', 'Contact support']
    }
  },
  [PodcastErrorType.GENERATION_TIMEOUT]: {
    message: 'Podcast generation timed out',
    userMessage: 'Podcast generation is taking longer than expected. Please try again.',
    statusCode: 408,
    retryable: true,
    recoveryOptions: {
      canRetry: true,
      canRegenerate: true,
      canChangeSettings: true,
      canContactSupport: false,
      suggestedActions: ['Try again', 'Shorten content', 'Use different quality settings']
    }
  },
  [PodcastErrorType.GENERATION_CANCELLED]: {
    message: 'Podcast generation was cancelled',
    userMessage: 'Podcast generation was cancelled. You can start a new generation.',
    statusCode: 499,
    retryable: true,
    recoveryOptions: {
      canRetry: true,
      canRegenerate: true,
      canChangeSettings: false,
      canContactSupport: false,
      suggestedActions: ['Start new generation']
    }
  },

  // ElevenLabs API errors
  [PodcastErrorType.ELEVENLABS_API_ERROR]: {
    message: 'ElevenLabs API error',
    userMessage: 'Voice generation service is temporarily unavailable. Please try again.',
    statusCode: 502,
    retryable: true,
    recoveryOptions: {
      canRetry: true,
      canRegenerate: true,
      canChangeSettings: false,
      canContactSupport: true,
      suggestedActions: ['Try again in a few minutes', 'Contact support if issue persists']
    }
  },
  [PodcastErrorType.ELEVENLABS_QUOTA_EXCEEDED]: {
    message: 'ElevenLabs quota exceeded',
    userMessage: 'Voice generation quota exceeded. Please try again later or upgrade your plan.',
    statusCode: 429,
    retryable: true,
    recoveryOptions: {
      canRetry: true,
      canRegenerate: false,
      canChangeSettings: false,
      canContactSupport: true,
      suggestedActions: ['Try again later', 'Upgrade plan', 'Contact support']
    }
  },
  [PodcastErrorType.ELEVENLABS_AUTHENTICATION_FAILED]: {
    message: 'ElevenLabs authentication failed',
    userMessage: 'Voice service authentication failed. Please contact support.',
    statusCode: 401,
    retryable: false,
    recoveryOptions: {
      canRetry: false,
      canRegenerate: false,
      canChangeSettings: false,
      canContactSupport: true,
      suggestedActions: ['Contact support']
    }
  },
  [PodcastErrorType.ELEVENLABS_INVALID_VOICE]: {
    message: 'Invalid voice selection',
    userMessage: 'Selected voice is not available. Please choose a different voice.',
    statusCode: 400,
    retryable: false,
    recoveryOptions: {
      canRetry: false,
      canRegenerate: true,
      canChangeSettings: true,
      canContactSupport: false,
      suggestedActions: ['Choose different voice', 'Try default voices']
    }
  },
  [PodcastErrorType.ELEVENLABS_CONTENT_TOO_LONG]: {
    message: 'Content too long for podcast generation',
    userMessage: 'Your content is too long for podcast generation. Please shorten it.',
    statusCode: 400,
    retryable: false,
    recoveryOptions: {
      canRetry: false,
      canRegenerate: true,
      canChangeSettings: false,
      canContactSupport: false,
      suggestedActions: ['Shorten content', 'Split into multiple podcasts']
    }
  },
  [PodcastErrorType.ELEVENLABS_CONTENT_TOO_SHORT]: {
    message: 'Content too short for podcast generation',
    userMessage: 'Your content is too short for podcast generation. Please add more content.',
    statusCode: 400,
    retryable: false,
    recoveryOptions: {
      canRetry: false,
      canRegenerate: true,
      canChangeSettings: false,
      canContactSupport: false,
      suggestedActions: ['Add more content', 'Expand your notes']
    }
  },

  // Webhook errors
  [PodcastErrorType.WEBHOOK_VERIFICATION_FAILED]: {
    message: 'Webhook verification failed',
    userMessage: 'Unable to process podcast update. Please refresh to check status.',
    statusCode: 401,
    retryable: false,
    recoveryOptions: {
      canRetry: false,
      canRegenerate: false,
      canChangeSettings: false,
      canContactSupport: true,
      suggestedActions: ['Refresh page', 'Contact support']
    }
  },
  [PodcastErrorType.WEBHOOK_PROCESSING_FAILED]: {
    message: 'Webhook processing failed',
    userMessage: 'Failed to update podcast status. Please refresh to check current status.',
    statusCode: 500,
    retryable: true,
    recoveryOptions: {
      canRetry: true,
      canRegenerate: false,
      canChangeSettings: false,
      canContactSupport: false,
      suggestedActions: ['Refresh page', 'Check podcast status']
    }
  },
  [PodcastErrorType.WEBHOOK_DUPLICATE_EVENT]: {
    message: 'Duplicate webhook event received',
    userMessage: 'Podcast status already updated.',
    statusCode: 409,
    retryable: false,
    recoveryOptions: {
      canRetry: false,
      canRegenerate: false,
      canChangeSettings: false,
      canContactSupport: false,
      suggestedActions: ['No action needed']
    }
  },

  // Audio processing errors
  [PodcastErrorType.AUDIO_DOWNLOAD_FAILED]: {
    message: 'Audio download failed',
    userMessage: 'Failed to download podcast audio. Please try again.',
    statusCode: 500,
    retryable: true,
    recoveryOptions: {
      canRetry: true,
      canRegenerate: false,
      canChangeSettings: false,
      canContactSupport: true,
      suggestedActions: ['Try again', 'Check internet connection', 'Contact support']
    }
  },
  [PodcastErrorType.AUDIO_UPLOAD_FAILED]: {
    message: 'Audio upload failed',
    userMessage: 'Failed to save podcast audio. Please try regenerating.',
    statusCode: 500,
    retryable: true,
    recoveryOptions: {
      canRetry: true,
      canRegenerate: true,
      canChangeSettings: false,
      canContactSupport: true,
      suggestedActions: ['Try again', 'Regenerate podcast', 'Contact support']
    }
  },
  [PodcastErrorType.AUDIO_PROCESSING_FAILED]: {
    message: 'Audio processing failed',
    userMessage: 'Failed to process podcast audio. Please try regenerating.',
    statusCode: 500,
    retryable: true,
    recoveryOptions: {
      canRetry: true,
      canRegenerate: true,
      canChangeSettings: false,
      canContactSupport: true,
      suggestedActions: ['Try again', 'Regenerate podcast', 'Contact support']
    }
  },
  [PodcastErrorType.AUDIO_PLAYBACK_FAILED]: {
    message: 'Audio playback failed',
    userMessage: 'Unable to play podcast audio. Please try refreshing or downloading.',
    statusCode: 500,
    retryable: true,
    recoveryOptions: {
      canRetry: true,
      canRegenerate: false,
      canChangeSettings: false,
      canContactSupport: false,
      suggestedActions: ['Refresh page', 'Try different browser', 'Download audio']
    }
  },
  [PodcastErrorType.AUDIO_FILE_CORRUPTED]: {
    message: 'Audio file is corrupted',
    userMessage: 'Podcast audio file is corrupted. Please regenerate the podcast.',
    statusCode: 422,
    retryable: false,
    recoveryOptions: {
      canRetry: false,
      canRegenerate: true,
      canChangeSettings: false,
      canContactSupport: true,
      suggestedActions: ['Regenerate podcast', 'Contact support']
    }
  },

  // Transcript errors
  [PodcastErrorType.TRANSCRIPT_SYNC_FAILED]: {
    message: 'Transcript synchronization failed',
    userMessage: 'Unable to sync transcript with audio. Playback will continue without highlighting.',
    statusCode: 500,
    retryable: true,
    recoveryOptions: {
      canRetry: true,
      canRegenerate: false,
      canChangeSettings: false,
      canContactSupport: false,
      suggestedActions: ['Refresh page', 'Continue without sync']
    }
  },
  [PodcastErrorType.TRANSCRIPT_PROCESSING_FAILED]: {
    message: 'Transcript processing failed',
    userMessage: 'Unable to process transcript. You can still listen to the audio.',
    statusCode: 500,
    retryable: true,
    recoveryOptions: {
      canRetry: true,
      canRegenerate: false,
      canChangeSettings: false,
      canContactSupport: false,
      suggestedActions: ['Refresh page', 'Listen without transcript']
    }
  },
  [PodcastErrorType.TRANSCRIPT_NOT_AVAILABLE]: {
    message: 'Transcript not available',
    userMessage: 'Transcript is not available for this podcast.',
    statusCode: 404,
    retryable: false,
    recoveryOptions: {
      canRetry: false,
      canRegenerate: false,
      canChangeSettings: false,
      canContactSupport: false,
      suggestedActions: ['Listen without transcript']
    }
  },

  // Database errors
  [PodcastErrorType.PODCAST_NOT_FOUND]: {
    message: 'Podcast not found',
    userMessage: 'Podcast not found. It may have been deleted.',
    statusCode: 404,
    retryable: false,
    recoveryOptions: {
      canRetry: false,
      canRegenerate: true,
      canChangeSettings: false,
      canContactSupport: false,
      suggestedActions: ['Generate new podcast', 'Check podcast list']
    }
  },
  [PodcastErrorType.PODCAST_SAVE_FAILED]: {
    message: 'Failed to save podcast',
    userMessage: 'Unable to save podcast. Please try again.',
    statusCode: 500,
    retryable: true,
    recoveryOptions: {
      canRetry: true,
      canRegenerate: true,
      canChangeSettings: false,
      canContactSupport: true,
      suggestedActions: ['Try again', 'Contact support']
    }
  },
  [PodcastErrorType.PODCAST_DELETE_FAILED]: {
    message: 'Failed to delete podcast',
    userMessage: 'Unable to delete podcast. Please try again.',
    statusCode: 500,
    retryable: true,
    recoveryOptions: {
      canRetry: true,
      canRegenerate: false,
      canChangeSettings: false,
      canContactSupport: true,
      suggestedActions: ['Try again', 'Refresh page', 'Contact support']
    }
  },
  [PodcastErrorType.PODCAST_UPDATE_FAILED]: {
    message: 'Failed to update podcast',
    userMessage: 'Unable to update podcast. Please try again.',
    statusCode: 500,
    retryable: true,
    recoveryOptions: {
      canRetry: true,
      canRegenerate: false,
      canChangeSettings: false,
      canContactSupport: true,
      suggestedActions: ['Try again', 'Refresh page', 'Contact support']
    }
  },

  // Validation errors
  [PodcastErrorType.INVALID_NOTE_CONTENT]: {
    message: 'Invalid note content',
    userMessage: 'Note content is invalid or empty. Please check your note.',
    statusCode: 400,
    retryable: false,
    recoveryOptions: {
      canRetry: false,
      canRegenerate: false,
      canChangeSettings: false,
      canContactSupport: false,
      suggestedActions: ['Check note content', 'Add more content to note']
    }
  },
  [PodcastErrorType.INVALID_GENERATION_OPTIONS]: {
    message: 'Invalid generation options',
    userMessage: 'Podcast generation settings are invalid. Please check your settings.',
    statusCode: 400,
    retryable: false,
    recoveryOptions: {
      canRetry: false,
      canRegenerate: true,
      canChangeSettings: true,
      canContactSupport: false,
      suggestedActions: ['Check settings', 'Use default settings']
    }
  },
  [PodcastErrorType.INVALID_VOICE_SETTINGS]: {
    message: 'Invalid voice settings',
    userMessage: 'Voice settings are invalid. Please select valid voices.',
    statusCode: 400,
    retryable: false,
    recoveryOptions: {
      canRetry: false,
      canRegenerate: true,
      canChangeSettings: true,
      canContactSupport: false,
      suggestedActions: ['Select different voices', 'Use default voices']
    }
  },

  // Permission errors
  [PodcastErrorType.PODCAST_ACCESS_DENIED]: {
    message: 'Access denied to podcast',
    userMessage: 'You don\'t have permission to access this podcast.',
    statusCode: 403,
    retryable: false,
    recoveryOptions: {
      canRetry: false,
      canRegenerate: false,
      canChangeSettings: false,
      canContactSupport: true,
      suggestedActions: ['Contact support', 'Check permissions']
    }
  },
  [PodcastErrorType.NOTE_ACCESS_DENIED]: {
    message: 'Access denied to note',
    userMessage: 'You don\'t have permission to access this note.',
    statusCode: 403,
    retryable: false,
    recoveryOptions: {
      canRetry: false,
      canRegenerate: false,
      canChangeSettings: false,
      canContactSupport: true,
      suggestedActions: ['Contact support', 'Check permissions']
    }
  },

  // Generic podcast errors
  [PodcastErrorType.PODCAST_SERVICE_UNAVAILABLE]: {
    message: 'Podcast service unavailable',
    userMessage: 'Podcast service is temporarily unavailable. Please try again later.',
    statusCode: 503,
    retryable: true,
    recoveryOptions: {
      canRetry: true,
      canRegenerate: false,
      canChangeSettings: false,
      canContactSupport: true,
      suggestedActions: ['Try again later', 'Contact support']
    }
  },
  [PodcastErrorType.PODCAST_UNKNOWN_ERROR]: {
    message: 'Unknown podcast error',
    userMessage: 'An unexpected error occurred. Please try again.',
    statusCode: 500,
    retryable: true,
    recoveryOptions: {
      canRetry: true,
      canRegenerate: true,
      canChangeSettings: false,
      canContactSupport: true,
      suggestedActions: ['Try again', 'Contact support']
    }
  }
};

/**
 * Creates a podcast-specific error object
 */
export function createPodcastError(
  type: PodcastErrorType,
  context?: PodcastOperationContext,
  customMessage?: string,
  customUserMessage?: string
): PodcastErrorInfo {
  const errorConfig = PODCAST_ERROR_MESSAGES[type];
  const errorId = Math.random().toString(36).substring(2, 15);
  
  return {
    type,
    message: customMessage || errorConfig.message,
    userMessage: customUserMessage || errorConfig.userMessage,
    statusCode: errorConfig.statusCode,
    retryable: errorConfig.retryable,
    context: context ? {
      operation: context.operation,
      podcastId: context.podcastId,
      noteId: context.noteId,
      userId: context.userId,
      generationOptions: context.generationOptions,
      timestamp: context.timestamp
    } : undefined,
    timestamp: new Date(),
    errorId,
    podcastId: context?.podcastId,
    noteId: context?.noteId,
    userId: context?.userId
  };
}

/**
 * Classifies unknown errors into podcast-specific error types
 */
export function classifyPodcastError(
  error: unknown, 
  context?: PodcastOperationContext
): PodcastErrorInfo {
  // Handle existing PodcastErrorInfo objects
  if (error && typeof error === 'object' && 'type' in error && 'userMessage' in error) {
    return error as PodcastErrorInfo;
  }
  
  // Handle standard Error objects with podcast-specific classification
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // ElevenLabs specific errors
    if (message.includes('elevenlabs') || message.includes('voice generation')) {
      if (message.includes('quota') || message.includes('limit')) {
        return createPodcastError(PodcastErrorType.ELEVENLABS_QUOTA_EXCEEDED, context);
      }
      if (message.includes('authentication') || message.includes('unauthorized')) {
        return createPodcastError(PodcastErrorType.ELEVENLABS_AUTHENTICATION_FAILED, context);
      }
      if (message.includes('voice') && message.includes('invalid')) {
        return createPodcastError(PodcastErrorType.ELEVENLABS_INVALID_VOICE, context);
      }
      if (message.includes('content too long') || message.includes('text too long')) {
        return createPodcastError(PodcastErrorType.ELEVENLABS_CONTENT_TOO_LONG, context);
      }
      if (message.includes('content too short') || message.includes('text too short')) {
        return createPodcastError(PodcastErrorType.ELEVENLABS_CONTENT_TOO_SHORT, context);
      }
      return createPodcastError(PodcastErrorType.ELEVENLABS_API_ERROR, context);
    }
    
    // Generation specific errors
    if (message.includes('generation') && message.includes('failed')) {
      return createPodcastError(PodcastErrorType.GENERATION_FAILED, context);
    }
    if (message.includes('generation') && message.includes('timeout')) {
      return createPodcastError(PodcastErrorType.GENERATION_TIMEOUT, context);
    }
    if (message.includes('generation') && message.includes('cancelled')) {
      return createPodcastError(PodcastErrorType.GENERATION_CANCELLED, context);
    }
    
    // Audio specific errors
    if (message.includes('audio')) {
      if (message.includes('download')) {
        return createPodcastError(PodcastErrorType.AUDIO_DOWNLOAD_FAILED, context);
      }
      if (message.includes('upload')) {
        return createPodcastError(PodcastErrorType.AUDIO_UPLOAD_FAILED, context);
      }
      if (message.includes('playback') || message.includes('play')) {
        return createPodcastError(PodcastErrorType.AUDIO_PLAYBACK_FAILED, context);
      }
      if (message.includes('corrupt')) {
        return createPodcastError(PodcastErrorType.AUDIO_FILE_CORRUPTED, context);
      }
      return createPodcastError(PodcastErrorType.AUDIO_PROCESSING_FAILED, context);
    }
    
    // Transcript specific errors
    if (message.includes('transcript')) {
      if (message.includes('sync')) {
        return createPodcastError(PodcastErrorType.TRANSCRIPT_SYNC_FAILED, context);
      }
      if (message.includes('not available') || message.includes('not found')) {
        return createPodcastError(PodcastErrorType.TRANSCRIPT_NOT_AVAILABLE, context);
      }
      return createPodcastError(PodcastErrorType.TRANSCRIPT_PROCESSING_FAILED, context);
    }
    
    // Podcast database errors
    if (message.includes('podcast')) {
      if (message.includes('not found')) {
        return createPodcastError(PodcastErrorType.PODCAST_NOT_FOUND, context);
      }
      if (message.includes('save') || message.includes('create')) {
        return createPodcastError(PodcastErrorType.PODCAST_SAVE_FAILED, context);
      }
      if (message.includes('delete')) {
        return createPodcastError(PodcastErrorType.PODCAST_DELETE_FAILED, context);
      }
      if (message.includes('update')) {
        return createPodcastError(PodcastErrorType.PODCAST_UPDATE_FAILED, context);
      }
    }
    
    // Validation errors
    if (message.includes('invalid')) {
      if (message.includes('note') || message.includes('content')) {
        return createPodcastError(PodcastErrorType.INVALID_NOTE_CONTENT, context);
      }
      if (message.includes('voice')) {
        return createPodcastError(PodcastErrorType.INVALID_VOICE_SETTINGS, context);
      }
      if (message.includes('options') || message.includes('settings')) {
        return createPodcastError(PodcastErrorType.INVALID_GENERATION_OPTIONS, context);
      }
    }
    
    // Permission errors
    if (message.includes('access denied') || message.includes('forbidden')) {
      if (message.includes('podcast')) {
        return createPodcastError(PodcastErrorType.PODCAST_ACCESS_DENIED, context);
      }
      if (message.includes('note')) {
        return createPodcastError(PodcastErrorType.NOTE_ACCESS_DENIED, context);
      }
    }
    
    // Webhook errors
    if (message.includes('webhook')) {
      if (message.includes('verification')) {
        return createPodcastError(PodcastErrorType.WEBHOOK_VERIFICATION_FAILED, context);
      }
      if (message.includes('duplicate')) {
        return createPodcastError(PodcastErrorType.WEBHOOK_DUPLICATE_EVENT, context);
      }
      return createPodcastError(PodcastErrorType.WEBHOOK_PROCESSING_FAILED, context);
    }
  }
  
  // Handle HTTP response errors
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    
    switch (status) {
      case 404:
        return createPodcastError(PodcastErrorType.PODCAST_NOT_FOUND, context);
      case 403:
        return createPodcastError(PodcastErrorType.PODCAST_ACCESS_DENIED, context);
      case 429:
        return createPodcastError(PodcastErrorType.ELEVENLABS_QUOTA_EXCEEDED, context);
      case 503:
        return createPodcastError(PodcastErrorType.PODCAST_SERVICE_UNAVAILABLE, context);
      default:
        return createPodcastError(PodcastErrorType.PODCAST_UNKNOWN_ERROR, context);
    }
  }
  
  // Fallback to generic podcast error
  return createPodcastError(PodcastErrorType.PODCAST_UNKNOWN_ERROR, context, 
    error instanceof Error ? error.message : String(error));
}

/**
 * Displays podcast error with appropriate UI feedback
 */
export function displayPodcastError(
  error: unknown,
  context?: PodcastOperationContext,
  options: {
    showToast?: boolean;
    toastDuration?: number;
    onRetry?: () => void;
    suppressConsoleLog?: boolean;
  } = {}
): PodcastErrorInfo {
  const {
    showToast = true,
    toastDuration = 5000,
    onRetry,
    suppressConsoleLog = false
  } = options;
  
  const errorInfo = classifyPodcastError(error, context);
  
  // Log error for debugging (unless suppressed)
  if (!suppressConsoleLog) {
    console.error(`[${errorInfo.errorId}] Podcast ${errorInfo.type}:`, {
      message: errorInfo.message,
      userMessage: errorInfo.userMessage,
      context: errorInfo.context,
      retryable: errorInfo.retryable,
      operation: context?.operation,
      podcastId: context?.podcastId,
      noteId: context?.noteId
    });
  }
  
  // Show toast notification
  if (showToast) {
    const toastOptions: Parameters<typeof toast.error>[1] = {
      duration: toastDuration,
      id: errorInfo.errorId
    };
    
    // Add retry action if error is retryable and action provided
    if (errorInfo.retryable && onRetry) {
      toastOptions.action = {
        label: 'Retry',
        onClick: onRetry
      };
    }
    
    // Show different toast types based on error severity
    if (errorInfo.statusCode >= 500) {
      toast.error(errorInfo.userMessage, toastOptions);
    } else if (errorInfo.statusCode >= 400) {
      toast.warning(errorInfo.userMessage, toastOptions);
    } else {
      toast.info(errorInfo.userMessage, toastOptions);
    }
  }
  
  return errorInfo;
}

/**
 * Determines if a podcast error should trigger a retry
 */
export function shouldRetryPodcastError(
  error: PodcastErrorInfo, 
  operation: string = 'default'
): boolean {
  const config = PODCAST_RETRY_CONFIGS[operation] || PODCAST_RETRY_CONFIGS.generation;
  return error.retryable && config.retryableErrors.includes(error.type as any);
}

/**
 * Gets retry configuration for a specific operation
 */
export function getPodcastRetryConfig(operation: string): PodcastRetryConfig {
  return PODCAST_RETRY_CONFIGS[operation] || PODCAST_RETRY_CONFIGS.generation;
}

/**
 * Implements exponential backoff delay calculation
 */
export function calculateRetryDelay(
  retryCount: number, 
  config: PodcastRetryConfig
): number {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, retryCount);
  return Math.min(delay, config.maxDelay);
}

/**
 * Creates a retry function with exponential backoff
 */
export function createRetryFunction<T>(
  operation: () => Promise<T>,
  config: PodcastRetryConfig,
  context?: PodcastOperationContext
): (retryCount?: number) => Promise<T> {
  return async (retryCount = 0): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      const errorInfo = classifyPodcastError(error, context);
      
      if (retryCount >= config.maxRetries || !shouldRetryPodcastError(errorInfo, context?.operation)) {
        throw errorInfo;
      }
      
      const delay = calculateRetryDelay(retryCount, config);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return createRetryFunction(operation, config, context)(retryCount + 1);
    }
  };
}