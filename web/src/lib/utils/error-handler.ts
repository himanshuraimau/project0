/**
 * Error handling utilities for course creation
 * Requirements: 8.1, 8.3, 8.5
 */

import { CourseCreationError, CourseCreationErrorInfo, RetryConfig } from '@/lib/types/error.types';

/**
 * Maps error messages to specific error types and user-friendly messages
 */
export function classifyError(error: unknown): CourseCreationErrorInfo {
  const timestamp = new Date();
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Title validation errors
    if (message.includes('title must be between') || message.includes('title is required')) {
      return {
        type: CourseCreationError.TITLE_VALIDATION,
        message: error.message,
        userMessage: 'Please enter a valid course title (2-100 characters).',
        retryable: false,
        timestamp
      };
    }
    
    // Units validation errors
    if (message.includes('units') && (message.includes('required') || message.includes('empty'))) {
      return {
        type: CourseCreationError.UNITS_VALIDATION,
        message: error.message,
        userMessage: 'Please ensure all units have valid names.',
        retryable: false,
        timestamp
      };
    }
    
    // AI generation errors
    if (message.includes('failed to generate units')) {
      return {
        type: CourseCreationError.UNITS_GENERATION,
        message: error.message,
        userMessage: 'Unable to generate course units. Please try again or check your course title.',
        retryable: true,
        timestamp
      };
    }
    
    if (message.includes('failed to generate chapters')) {
      return {
        type: CourseCreationError.CHAPTERS_GENERATION,
        message: error.message,
        userMessage: 'Unable to generate course chapters. Please try again or modify your units.',
        retryable: true,
        timestamp
      };
    }
    
    // AI service specific errors
    if (message.includes('ai service') || message.includes('openai') || message.includes('model')) {
      return {
        type: CourseCreationError.AI_SERVICE_ERROR,
        message: error.message,
        userMessage: 'AI service is temporarily unavailable. Please try again in a few moments.',
        retryable: true,
        timestamp
      };
    }
    
    // Quota/rate limiting errors
    if (message.includes('quota') || message.includes('rate limit') || message.includes('too many requests')) {
      return {
        type: CourseCreationError.AI_QUOTA_EXCEEDED,
        message: error.message,
        userMessage: 'AI service limit reached. Please try again in a few minutes.',
        retryable: true,
        timestamp
      };
    }
    
    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out')) {
      return {
        type: CourseCreationError.AI_TIMEOUT,
        message: error.message,
        userMessage: 'Request timed out. Please try again with a shorter course title or simpler units.',
        retryable: true,
        timestamp
      };
    }
    
    // Database/save errors
    if (message.includes('failed to save') || message.includes('database') || message.includes('prisma')) {
      return {
        type: CourseCreationError.SAVE_FAILURE,
        message: error.message,
        userMessage: 'Unable to save your course. Please try again.',
        retryable: true,
        timestamp
      };
    }
    
    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return {
        type: CourseCreationError.NETWORK_ERROR,
        message: error.message,
        userMessage: 'Network connection issue. Please check your internet connection and try again.',
        retryable: true,
        timestamp
      };
    }
    
    // Authentication errors
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return {
        type: CourseCreationError.AUTHENTICATION_ERROR,
        message: error.message,
        userMessage: 'Please sign in to continue creating your course.',
        retryable: false,
        timestamp
      };
    }
  }
  
  // Handle fetch response errors
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as any).status;
    
    if (status === 401) {
      return {
        type: CourseCreationError.UNAUTHORIZED,
        message: 'Unauthorized access',
        userMessage: 'Please sign in to continue creating your course.',
        retryable: false,
        timestamp
      };
    }
    
    if (status === 503) {
      return {
        type: CourseCreationError.AI_SERVICE_ERROR,
        message: 'Service unavailable',
        userMessage: 'AI service is temporarily unavailable. Please try again in a few moments.',
        retryable: true,
        timestamp
      };
    }
    
    if (status >= 500) {
      return {
        type: CourseCreationError.SAVE_FAILURE,
        message: 'Server error',
        userMessage: 'Server error occurred. Please try again.',
        retryable: true,
        timestamp
      };
    }
  }
  
  // Generic unknown error
  return {
    type: CourseCreationError.UNKNOWN_ERROR,
    message: error instanceof Error ? error.message : 'Unknown error occurred',
    userMessage: 'An unexpected error occurred. Please try again.',
    retryable: true,
    timestamp
  };
}

/**
 * Determines if an error should trigger a retry
 */
export function shouldRetry(errorInfo: CourseCreationErrorInfo, retryCount: number, maxRetries: number): boolean {
  if (!errorInfo.retryable || retryCount >= maxRetries) {
    return false;
  }
  
  // Don't retry validation errors
  if (errorInfo.type === CourseCreationError.TITLE_VALIDATION ||
      errorInfo.type === CourseCreationError.UNITS_VALIDATION ||
      errorInfo.type === CourseCreationError.CHAPTERS_VALIDATION ||
      errorInfo.type === CourseCreationError.AUTHENTICATION_ERROR ||
      errorInfo.type === CourseCreationError.UNAUTHORIZED) {
    return false;
  }
  
  return true;
}

/**
 * Calculates retry delay with exponential backoff
 */
export function calculateRetryDelay(retryCount: number, config: RetryConfig): number {
  return config.retryDelay * Math.pow(config.backoffMultiplier, retryCount);
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  backoffMultiplier: 2
};

/**
 * Executes a function with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (error: CourseCreationErrorInfo, retryCount: number) => void
): Promise<T> {
  let lastError: CourseCreationErrorInfo | null = null;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const errorInfo = classifyError(error);
      lastError = errorInfo;
      
      if (attempt < config.maxRetries && shouldRetry(errorInfo, attempt, config.maxRetries)) {
        const delay = calculateRetryDelay(attempt, config);
        
        if (onRetry) {
          onRetry(errorInfo, attempt + 1);
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw errorInfo;
    }
  }
  
  throw lastError;
}

/**
 * Enhanced fetch with error handling and retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      // Create error object with status for classification
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      (error as any).status = response.status;
      throw error;
    }
    
    return response;
  }, config);
}