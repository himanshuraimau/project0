/**
 * API Error Response Utilities
 * Provides standardized error responses for API routes
 */

import { NextResponse } from 'next/server';
import { AppError, AppErrorType, createAppError, classifyError, logError } from './enhanced-error-handler';

/**
 * Standardized API error response format
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    type: AppErrorType;
    message: string;
    userMessage: string;
    errorId: string;
    timestamp: string;
    retryable: boolean;
    context?: Record<string, unknown>;
  };
}

/**
 * Standardized API success response format
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
}

/**
 * Creates a standardized error response for API routes
 */
export function createErrorResponse(error: AppError): NextResponse<ApiErrorResponse> {
  logError(error);
  
  const response: ApiErrorResponse = {
    success: false,
    error: {
      type: error.type,
      message: error.message,
      userMessage: error.userMessage,
      errorId: error.errorId || 'unknown',
      timestamp: error.timestamp.toISOString(),
      retryable: error.retryable,
      context: error.context
    }
  };

  return NextResponse.json(response, { status: error.statusCode });
}

/**
 * Creates a standardized success response for API routes
 */
export function createSuccessResponse<T>(data: T): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(response);
}

/**
 * Handles unknown errors and converts them to standardized API error responses
 */
export function handleApiError(error: unknown, context?: Record<string, unknown>): NextResponse<ApiErrorResponse> {
  const appError = classifyError(error, context);
  return createErrorResponse(appError);
}

/**
 * Wrapper for API route handlers with automatic error handling
 */
export function withErrorHandling<T extends unknown[], R>(
  handler: (...args: T) => Promise<NextResponse<ApiSuccessResponse<R>>>
) {
  return async (...args: T): Promise<NextResponse<ApiSuccessResponse<R> | ApiErrorResponse>> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, { 
        handler: handler.name,
        args: args.length
      });
    }
  };
}

/**
 * Validates request body and returns typed data or throws validation error
 */
export function validateRequestBody<T>(
  body: unknown,
  validator: (data: unknown) => data is T,
  errorMessage?: string
): T {
  if (!validator(body)) {
    throw createAppError(
      AppErrorType.INVALID_INPUT,
      { body },
      errorMessage || 'Invalid request body format'
    );
  }
  return body;
}

/**
 * Validates required fields in request body
 */
export function validateRequiredFields(
  data: Record<string, unknown>,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(field => 
    data[field] === undefined || data[field] === null || data[field] === ''
  );

  if (missingFields.length > 0) {
    throw createAppError(
      AppErrorType.MISSING_REQUIRED_FIELD,
      { missingFields },
      `Missing required fields: ${missingFields.join(', ')}`
    );
  }
}

/**
 * Validates string length
 */
export function validateStringLength(
  value: string,
  fieldName: string,
  min: number,
  max: number
): void {
  if (value.length < min) {
    throw createAppError(
      AppErrorType.INPUT_TOO_SHORT,
      { fieldName, value: value.length, min },
      `${fieldName} must be at least ${min} characters long`
    );
  }
  
  if (value.length > max) {
    throw createAppError(
      AppErrorType.INPUT_TOO_LONG,
      { fieldName, value: value.length, max },
      `${fieldName} must be no more than ${max} characters long`
    );
  }
}

/**
 * Course-specific validation helpers
 */
export const CourseValidation = {
  title: (title: string) => {
    validateStringLength(title, 'Course title', 2, 100);
  },
  
  units: (units: string[]) => {
    if (!Array.isArray(units) || units.length === 0) {
      throw createAppError(
        AppErrorType.UNITS_INVALID,
        { units },
        'At least one unit is required'
      );
    }
    
    units.forEach((unit, index) => {
      if (typeof unit !== 'string') {
        throw createAppError(
          AppErrorType.UNITS_INVALID,
          { unit, index },
          `Unit ${index + 1} must be a string`
        );
      }
      
      validateStringLength(unit, `Unit ${index + 1}`, 2, 100);
    });
  }
};

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+/,
  youtubeUrl: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/
};
