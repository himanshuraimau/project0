/**
 * Enhanced error handling system for the application
 * Provides specific, user-friendly error messages and proper error classification
 */

// Base error types for the application
export enum AppErrorType {
  // Authentication & Authorization
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  INVALID_SESSION = 'INVALID_SESSION',
  
  // Validation Errors
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INPUT_TOO_LONG = 'INPUT_TOO_LONG',
  INPUT_TOO_SHORT = 'INPUT_TOO_SHORT',
  
  // Course Generation Specific
  COURSE_TITLE_INVALID = 'COURSE_TITLE_INVALID',
  UNITS_INVALID = 'UNITS_INVALID',
  CHAPTERS_GENERATION_FAILED = 'CHAPTERS_GENERATION_FAILED',
  UNITS_GENERATION_FAILED = 'UNITS_GENERATION_FAILED',
  COURSE_SAVE_FAILED = 'COURSE_SAVE_FAILED',
  
  // External Services
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  AI_QUOTA_EXCEEDED = 'AI_QUOTA_EXCEEDED',
  AI_TIMEOUT = 'AI_TIMEOUT',
  YOUTUBE_API_FAILED = 'YOUTUBE_API_FAILED',
  YOUTUBE_VIDEO_NOT_FOUND = 'YOUTUBE_VIDEO_NOT_FOUND',
  TRANSCRIPT_UNAVAILABLE = 'TRANSCRIPT_UNAVAILABLE',
  
  // Credit System
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  CREDIT_DEDUCTION_FAILED = 'CREDIT_DEDUCTION_FAILED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  
  // File Processing
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE = 'UNSUPPORTED_FILE_TYPE',
  FILE_CORRUPT = 'FILE_CORRUPT',
  PDF_PROCESSING_FAILED = 'PDF_PROCESSING_FAILED',
  AUDIO_PROCESSING_FAILED = 'AUDIO_PROCESSING_FAILED',
  
  // Database Operations
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD = 'DUPLICATE_RECORD',
  DATABASE_CONSTRAINT_VIOLATION = 'DATABASE_CONSTRAINT_VIOLATION',
  
  // Network & Connectivity
  NETWORK_ERROR = 'NETWORK_ERROR',
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  SERVER_UNAVAILABLE = 'SERVER_UNAVAILABLE',
  
  // Generic
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}

export interface AppError {
  type: AppErrorType;
  message: string;
  userMessage: string;
  statusCode: number;
  retryable: boolean;
  context?: Record<string, unknown>;
  timestamp: Date;
  errorId?: string;
}

// Error message mappings for user-friendly display
export const ERROR_MESSAGES: Record<AppErrorType, { message: string; userMessage: string; statusCode: number; retryable: boolean }> = {
  // Authentication & Authorization
  [AppErrorType.AUTHENTICATION_FAILED]: {
    message: 'Authentication failed',
    userMessage: 'Please sign in to continue.',
    statusCode: 401,
    retryable: false
  },
  [AppErrorType.UNAUTHORIZED_ACCESS]: {
    message: 'Unauthorized access attempt',
    userMessage: 'You don\'t have permission to access this resource.',
    statusCode: 403,
    retryable: false
  },
  [AppErrorType.INVALID_SESSION]: {
    message: 'Invalid or expired session',
    userMessage: 'Your session has expired. Please sign in again.',
    statusCode: 401,
    retryable: false
  },
  
  // Validation Errors
  [AppErrorType.INVALID_INPUT]: {
    message: 'Invalid input provided',
    userMessage: 'Please check your input and try again.',
    statusCode: 400,
    retryable: false
  },
  [AppErrorType.MISSING_REQUIRED_FIELD]: {
    message: 'Required field is missing',
    userMessage: 'Please fill in all required fields.',
    statusCode: 400,
    retryable: false
  },
  [AppErrorType.INVALID_FORMAT]: {
    message: 'Invalid format provided',
    userMessage: 'Please use the correct format for this field.',
    statusCode: 400,
    retryable: false
  },
  [AppErrorType.INPUT_TOO_LONG]: {
    message: 'Input exceeds maximum length',
    userMessage: 'This field is too long. Please shorten it.',
    statusCode: 400,
    retryable: false
  },
  [AppErrorType.INPUT_TOO_SHORT]: {
    message: 'Input is too short',
    userMessage: 'This field is too short. Please provide more content.',
    statusCode: 400,
    retryable: false
  },
  
  // Course Generation Specific
  [AppErrorType.COURSE_TITLE_INVALID]: {
    message: 'Course title is invalid',
    userMessage: 'Please enter a course title between 2 and 100 characters.',
    statusCode: 400,
    retryable: false
  },
  [AppErrorType.UNITS_INVALID]: {
    message: 'One or more units are invalid',
    userMessage: 'Please ensure all units have valid names (2-100 characters each).',
    statusCode: 400,
    retryable: false
  },
  [AppErrorType.CHAPTERS_GENERATION_FAILED]: {
    message: 'Failed to generate course chapters',
    userMessage: 'Unable to generate chapters for your course. Please try with a different title or units.',
    statusCode: 500,
    retryable: true
  },
  [AppErrorType.UNITS_GENERATION_FAILED]: {
    message: 'Failed to generate course units',
    userMessage: 'Unable to generate units for your course. Please try with a different title.',
    statusCode: 500,
    retryable: true
  },
  [AppErrorType.COURSE_SAVE_FAILED]: {
    message: 'Failed to save course',
    userMessage: 'Unable to save your course. Please try again.',
    statusCode: 500,
    retryable: true
  },
  
  // External Services
  [AppErrorType.AI_SERVICE_UNAVAILABLE]: {
    message: 'AI service is currently unavailable',
    userMessage: 'AI service is temporarily unavailable. Please try again in a few minutes.',
    statusCode: 503,
    retryable: true
  },
  [AppErrorType.AI_QUOTA_EXCEEDED]: {
    message: 'AI service quota exceeded',
    userMessage: 'AI service usage limit reached. Please try again later.',
    statusCode: 429,
    retryable: true
  },
  [AppErrorType.AI_TIMEOUT]: {
    message: 'AI service request timed out',
    userMessage: 'Request took too long. Please try again with a shorter or simpler input.',
    statusCode: 408,
    retryable: true
  },
  [AppErrorType.YOUTUBE_API_FAILED]: {
    message: 'YouTube API request failed',
    userMessage: 'Unable to process YouTube video. Please try with a different video.',
    statusCode: 502,
    retryable: true
  },
  [AppErrorType.YOUTUBE_VIDEO_NOT_FOUND]: {
    message: 'YouTube video not found',
    userMessage: 'YouTube video not found. Please check the URL and try again.',
    statusCode: 404,
    retryable: false
  },
  [AppErrorType.TRANSCRIPT_UNAVAILABLE]: {
    message: 'Video transcript not available',
    userMessage: 'This video doesn\'t have a transcript available. Please try a different video.',
    statusCode: 404,
    retryable: false
  },
  
  // Credit System
  [AppErrorType.INSUFFICIENT_CREDITS]: {
    message: 'Insufficient credits',
    userMessage: 'You don\'t have enough credits for this operation. Please purchase more credits.',
    statusCode: 402,
    retryable: false
  },
  [AppErrorType.CREDIT_DEDUCTION_FAILED]: {
    message: 'Failed to deduct credits',
    userMessage: 'Unable to process credit deduction. Please try again.',
    statusCode: 500,
    retryable: true
  },
  [AppErrorType.PAYMENT_FAILED]: {
    message: 'Payment processing failed',
    userMessage: 'Payment could not be processed. Please check your payment method.',
    statusCode: 402,
    retryable: true
  },
  
  // File Processing
  [AppErrorType.FILE_TOO_LARGE]: {
    message: 'File size exceeds limit',
    userMessage: 'File is too large. Please choose a smaller file (max 20MB).',
    statusCode: 413,
    retryable: false
  },
  [AppErrorType.UNSUPPORTED_FILE_TYPE]: {
    message: 'Unsupported file type',
    userMessage: 'File type not supported. Please use PDF, MP3, MP4, or WAV files.',
    statusCode: 415,
    retryable: false
  },
  [AppErrorType.FILE_CORRUPT]: {
    message: 'File is corrupted or unreadable',
    userMessage: 'File appears to be corrupted. Please try uploading a different file.',
    statusCode: 400,
    retryable: false
  },
  [AppErrorType.PDF_PROCESSING_FAILED]: {
    message: 'PDF processing failed',
    userMessage: 'Unable to process PDF file. Please try a different file.',
    statusCode: 500,
    retryable: true
  },
  [AppErrorType.AUDIO_PROCESSING_FAILED]: {
    message: 'Audio processing failed',
    userMessage: 'Unable to process audio file. Please try a different file.',
    statusCode: 500,
    retryable: true
  },
  
  // Database Operations
  [AppErrorType.DATABASE_CONNECTION_FAILED]: {
    message: 'Database connection failed',
    userMessage: 'Service temporarily unavailable. Please try again in a moment.',
    statusCode: 503,
    retryable: true
  },
  [AppErrorType.RECORD_NOT_FOUND]: {
    message: 'Record not found',
    userMessage: 'The requested item could not be found.',
    statusCode: 404,
    retryable: false
  },
  [AppErrorType.DUPLICATE_RECORD]: {
    message: 'Duplicate record exists',
    userMessage: 'This item already exists. Please try a different name.',
    statusCode: 409,
    retryable: false
  },
  [AppErrorType.DATABASE_CONSTRAINT_VIOLATION]: {
    message: 'Database constraint violation',
    userMessage: 'Unable to save due to data requirements. Please check your input.',
    statusCode: 400,
    retryable: false
  },
  
  // Network & Connectivity
  [AppErrorType.NETWORK_ERROR]: {
    message: 'Network connection error',
    userMessage: 'Network connection failed. Please check your internet connection.',
    statusCode: 0,
    retryable: true
  },
  [AppErrorType.REQUEST_TIMEOUT]: {
    message: 'Request timed out',
    userMessage: 'Request took too long. Please try again.',
    statusCode: 408,
    retryable: true
  },
  [AppErrorType.SERVER_UNAVAILABLE]: {
    message: 'Server is unavailable',
    userMessage: 'Service is temporarily unavailable. Please try again later.',
    statusCode: 503,
    retryable: true
  },
  
  // Generic
  [AppErrorType.UNKNOWN_ERROR]: {
    message: 'Unknown error occurred',
    userMessage: 'An unexpected error occurred. Please try again.',
    statusCode: 500,
    retryable: true
  },
  [AppErrorType.INTERNAL_SERVER_ERROR]: {
    message: 'Internal server error',
    userMessage: 'Server error occurred. Please try again later.',
    statusCode: 500,
    retryable: true
  }
};

/**
 * Creates a standardized error object
 */
export function createAppError(
  type: AppErrorType,
  context?: Record<string, unknown>,
  customMessage?: string,
  customUserMessage?: string
): AppError {
  const errorConfig = ERROR_MESSAGES[type];
  const errorId = Math.random().toString(36).substring(2, 15);
  
  return {
    type,
    message: customMessage || errorConfig.message,
    userMessage: customUserMessage || errorConfig.userMessage,
    statusCode: errorConfig.statusCode,
    retryable: errorConfig.retryable,
    context,
    timestamp: new Date(),
    errorId
  };
}

/**
 * Classifies unknown errors into appropriate AppError types
 */
export function classifyError(error: unknown, context?: Record<string, unknown>): AppError {
  // Handle AppError objects
  if (error && typeof error === 'object' && 'type' in error && 'userMessage' in error) {
    return error as AppError;
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Authentication errors
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return createAppError(AppErrorType.AUTHENTICATION_FAILED, context);
    }
    
    if (message.includes('invalid session') || message.includes('session expired')) {
      return createAppError(AppErrorType.INVALID_SESSION, context);
    }
    
    // Validation errors
    if (message.includes('title must be between') || message.includes('course title')) {
      return createAppError(AppErrorType.COURSE_TITLE_INVALID, context);
    }
    
    if (message.includes('units') && (message.includes('required') || message.includes('invalid'))) {
      return createAppError(AppErrorType.UNITS_INVALID, context);
    }
    
    if (message.includes('required field') || message.includes('is required')) {
      return createAppError(AppErrorType.MISSING_REQUIRED_FIELD, context);
    }
    
    // AI service errors
    if (message.includes('ai service') || message.includes('openai')) {
      return createAppError(AppErrorType.AI_SERVICE_UNAVAILABLE, context);
    }
    
    if (message.includes('quota') || message.includes('limit exceeded') || message.includes('too many requests')) {
      return createAppError(AppErrorType.AI_QUOTA_EXCEEDED, context);
    }
    
    if (message.includes('timeout') || message.includes('timed out')) {
      return createAppError(AppErrorType.AI_TIMEOUT, context);
    }
    
    // YouTube/transcript errors
    if (message.includes('youtube') || message.includes('video')) {
      if (message.includes('not found')) {
        return createAppError(AppErrorType.YOUTUBE_VIDEO_NOT_FOUND, context);
      }
      return createAppError(AppErrorType.YOUTUBE_API_FAILED, context);
    }
    
    if (message.includes('transcript') || message.includes('no transcript')) {
      return createAppError(AppErrorType.TRANSCRIPT_UNAVAILABLE, context);
    }
    
    // Credit system errors
    if (message.includes('insufficient credits') || message.includes('not enough credits')) {
      return createAppError(AppErrorType.INSUFFICIENT_CREDITS, context);
    }
    
    // File processing errors
    if (message.includes('file too large') || message.includes('size limit')) {
      return createAppError(AppErrorType.FILE_TOO_LARGE, context);
    }
    
    if (message.includes('unsupported') || message.includes('invalid file type')) {
      return createAppError(AppErrorType.UNSUPPORTED_FILE_TYPE, context);
    }
    
    if (message.includes('pdf') && message.includes('process')) {
      return createAppError(AppErrorType.PDF_PROCESSING_FAILED, context);
    }
    
    if (message.includes('audio') && message.includes('process')) {
      return createAppError(AppErrorType.AUDIO_PROCESSING_FAILED, context);
    }
    
    // Database errors
    if (message.includes('database') || message.includes('prisma')) {
      if (message.includes('connection')) {
        return createAppError(AppErrorType.DATABASE_CONNECTION_FAILED, context);
      }
      if (message.includes('not found')) {
        return createAppError(AppErrorType.RECORD_NOT_FOUND, context);
      }
      return createAppError(AppErrorType.INTERNAL_SERVER_ERROR, context);
    }
    
    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return createAppError(AppErrorType.NETWORK_ERROR, context);
    }
    
    // Course generation specific
    if (message.includes('failed to generate chapters')) {
      return createAppError(AppErrorType.CHAPTERS_GENERATION_FAILED, context);
    }
    
    if (message.includes('failed to generate units')) {
      return createAppError(AppErrorType.UNITS_GENERATION_FAILED, context);
    }
    
    if (message.includes('failed to save')) {
      return createAppError(AppErrorType.COURSE_SAVE_FAILED, context);
    }
  }
  
  // Handle HTTP response errors
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    
    switch (status) {
      case 401:
        return createAppError(AppErrorType.AUTHENTICATION_FAILED, context);
      case 403:
        return createAppError(AppErrorType.UNAUTHORIZED_ACCESS, context);
      case 404:
        return createAppError(AppErrorType.RECORD_NOT_FOUND, context);
      case 402:
        return createAppError(AppErrorType.INSUFFICIENT_CREDITS, context);
      case 413:
        return createAppError(AppErrorType.FILE_TOO_LARGE, context);
      case 415:
        return createAppError(AppErrorType.UNSUPPORTED_FILE_TYPE, context);
      case 429:
        return createAppError(AppErrorType.AI_QUOTA_EXCEEDED, context);
      case 503:
        return createAppError(AppErrorType.SERVER_UNAVAILABLE, context);
      case 408:
        return createAppError(AppErrorType.REQUEST_TIMEOUT, context);
      default:
        if (status >= 500) {
          return createAppError(AppErrorType.INTERNAL_SERVER_ERROR, context);
        }
        return createAppError(AppErrorType.INVALID_INPUT, context);
    }
  }
  
  // Fallback for unknown errors
  return createAppError(AppErrorType.UNKNOWN_ERROR, context, 
    error instanceof Error ? error.message : String(error));
}

/**
 * Determines if an error should trigger a retry
 */
export function shouldRetryError(error: AppError): boolean {
  return error.retryable && ![
    AppErrorType.AUTHENTICATION_FAILED,
    AppErrorType.UNAUTHORIZED_ACCESS,
    AppErrorType.INVALID_SESSION,
    AppErrorType.INSUFFICIENT_CREDITS,
    AppErrorType.INVALID_INPUT,
    AppErrorType.MISSING_REQUIRED_FIELD,
    AppErrorType.COURSE_TITLE_INVALID,
    AppErrorType.UNITS_INVALID
  ].includes(error.type);
}

/**
 * Logs error with proper context
 */
export function logError(error: AppError, additionalContext?: Record<string, unknown>) {
  console.error(`[${error.errorId}] ${error.type}: ${error.message}`, {
    userMessage: error.userMessage,
    statusCode: error.statusCode,
    retryable: error.retryable,
    timestamp: error.timestamp,
    context: error.context,
    ...additionalContext
  });
}
