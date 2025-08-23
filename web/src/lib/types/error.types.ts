/**
 * Error types and interfaces for course creation error handling
 * Requirements: 8.1, 8.3, 8.5
 */

export enum CourseCreationError {
  // Validation errors
  TITLE_VALIDATION = 'TITLE_VALIDATION',
  UNITS_VALIDATION = 'UNITS_VALIDATION',
  CHAPTERS_VALIDATION = 'CHAPTERS_VALIDATION',
  
  // AI generation errors
  UNITS_GENERATION = 'UNITS_GENERATION',
  CHAPTERS_GENERATION = 'CHAPTERS_GENERATION',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  AI_QUOTA_EXCEEDED = 'AI_QUOTA_EXCEEDED',
  AI_TIMEOUT = 'AI_TIMEOUT',
  
  // Save/database errors
  SAVE_FAILURE = 'SAVE_FAILURE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  
  // Authentication errors
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface CourseCreationErrorInfo {
  type: CourseCreationError;
  message: string;
  userMessage: string;
  retryable: boolean;
  context?: Record<string, any>;
  timestamp: Date;
}

export interface ErrorState {
  hasError: boolean;
  error: CourseCreationErrorInfo | null;
  retryCount: number;
  maxRetries: number;
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
}