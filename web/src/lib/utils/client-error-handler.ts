/**
 * Client-side error handling utilities for React components
 * Provides consistent error UI and user feedback
 */

import { toast } from 'sonner';
import { AppError, AppErrorType, classifyError } from './enhanced-error-handler';

/**
 * Error display options for UI components
 */
export interface ErrorDisplayOptions {
  showToast?: boolean;
  toastDuration?: number;
  retryAction?: () => void;
  onRetry?: () => void;
  suppressConsoleLog?: boolean;
}

/**
 * Client error response format from API
 */
export interface ClientApiError {
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
 * Checks if response is an error response
 */
export function isApiErrorResponse(response: unknown): response is ClientApiError {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === false &&
    'error' in response
  );
}

/**
 * Extracts error information from API response or raw error
 */
export function extractErrorInfo(error: unknown): AppError {
  // Handle API error responses
  if (isApiErrorResponse(error)) {
    return {
      type: error.error.type,
      message: error.error.message,
      userMessage: error.error.userMessage,
      statusCode: 400, // Default for client errors
      retryable: error.error.retryable,
      context: error.error.context,
      timestamp: new Date(error.error.timestamp),
      errorId: error.error.errorId
    };
  }
  
  // Handle fetch/network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: AppErrorType.NETWORK_ERROR,
      message: 'Network request failed',
      userMessage: 'Please check your internet connection and try again.',
      statusCode: 0,
      retryable: true,
      timestamp: new Date(),
      errorId: Math.random().toString(36).substring(2, 15)
    };
  }
  
  // Use existing classification
  return classifyError(error);
}

/**
 * Displays error to user with appropriate UI feedback
 */
export function displayError(
  error: unknown,
  options: ErrorDisplayOptions = {}
): AppError {
  const {
    showToast = true,
    toastDuration = 5000,
    retryAction,
    suppressConsoleLog = false
  } = options;
  
  const errorInfo = extractErrorInfo(error);
  
  // Log error for debugging (unless suppressed)
  if (!suppressConsoleLog) {
    console.error(`[${errorInfo.errorId}] ${errorInfo.type}:`, {
      message: errorInfo.message,
      userMessage: errorInfo.userMessage,
      context: errorInfo.context,
      retryable: errorInfo.retryable
    });
  }
  
  // Show toast notification
  if (showToast) {
    const toastOptions: Parameters<typeof toast.error>[1] = {
      duration: toastDuration,
      id: errorInfo.errorId
    };
    
    // Add retry action if error is retryable and action provided
    if (errorInfo.retryable && retryAction) {
      toastOptions.action = {
        label: 'Retry',
        onClick: retryAction
      };
    }
    
    // Show different toast types based on error severity
    switch (errorInfo.type) {
      case AppErrorType.INSUFFICIENT_CREDITS:
      case AppErrorType.PAYMENT_FAILED:
        toast.warning(errorInfo.userMessage, toastOptions);
        break;
        
      case AppErrorType.AUTHENTICATION_FAILED:
      case AppErrorType.UNAUTHORIZED_ACCESS:
      case AppErrorType.INVALID_SESSION:
        toast.error(errorInfo.userMessage, {
          ...toastOptions,
          action: {
            label: 'Sign In',
            onClick: () => window.location.href = '/sign-in'
          }
        });
        break;
        
      case AppErrorType.NETWORK_ERROR:
      case AppErrorType.SERVER_UNAVAILABLE:
      case AppErrorType.AI_SERVICE_UNAVAILABLE:
        toast.error(errorInfo.userMessage, toastOptions);
        break;
        
      default:
        if (errorInfo.statusCode >= 500) {
          toast.error(errorInfo.userMessage, toastOptions);
        } else {
          toast.warning(errorInfo.userMessage, toastOptions);
        }
    }
  }
  
  return errorInfo;
}

/**
 * React hook for handling async operations with error handling
 */
export function useErrorHandler() {
  const handleError = (error: unknown, options?: ErrorDisplayOptions) => {
    return displayError(error, options);
  };
  
  const handleAsyncError = async <T>(
    operation: () => Promise<T>,
    options?: ErrorDisplayOptions
  ): Promise<T | null> => {
    try {
      return await operation();
    } catch (error) {
      handleError(error, options);
      return null;
    }
  };
  
  return { handleError, handleAsyncError };
}

/**
 * Wrapper for fetch requests with automatic error handling
 */
export async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit,
  errorOptions?: ErrorDisplayOptions
): Promise<T | null> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      // Try to parse error response
      try {
        const errorData = await response.json();
        if (isApiErrorResponse(errorData)) {
          displayError(errorData, errorOptions);
          return null;
        }
      } catch {
        // If parsing fails, create generic error
      }
      
      // Create error based on status code
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      (error as unknown as { status: number }).status = response.status;
      displayError(error, errorOptions);
      return null;
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    displayError(error, errorOptions);
    return null;
  }
}

/**
 * Error boundary fallback component props
 */
export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorInfo?: React.ErrorInfo;
}

/**
 * Loading state error helpers
 */
export const LoadingStates = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
} as const;

export type LoadingState = typeof LoadingStates[keyof typeof LoadingStates];

/**
 * Hook for managing loading states with error handling
 * Note: This requires React to be available in the consuming component
 */
export interface AsyncOperationState<T> {
  state: LoadingState;
  data: T | null;
  error: AppError | null;
  execute: (operation: () => Promise<T>, options?: ErrorDisplayOptions) => Promise<T | null>;
  reset: () => void;
  retry: (operation: () => Promise<T>, options?: ErrorDisplayOptions) => Promise<T | null>;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
}

/**
 * Creates an async operation handler (to be used with React hooks)
 */
export function createAsyncOperationHandler<T>(): {
  initialState: { state: LoadingState; data: T | null; error: AppError | null };
  reducer: (
    state: { state: LoadingState; data: T | null; error: AppError | null },
    action: { type: string; payload?: unknown }
  ) => { state: LoadingState; data: T | null; error: AppError | null };
  actions: {
    setLoading: () => { type: string };
    setSuccess: (data: T) => { type: string; payload: T };
    setError: (error: AppError) => { type: string; payload: AppError };
    reset: () => { type: string };
  };
} {
  const initialState = {
    state: LoadingStates.IDLE as LoadingState,
    data: null as T | null,
    error: null as AppError | null
  };

  const reducer = (
    state: typeof initialState,
    action: { type: string; payload?: unknown }
  ) => {
    switch (action.type) {
      case 'SET_LOADING':
        return { ...state, state: LoadingStates.LOADING, error: null };
      case 'SET_SUCCESS':
        return { 
          ...state, 
          state: LoadingStates.SUCCESS, 
          data: action.payload as T,
          error: null 
        };
      case 'SET_ERROR':
        return { 
          ...state, 
          state: LoadingStates.ERROR, 
          error: action.payload as AppError 
        };
      case 'RESET':
        return initialState;
      default:
        return state;
    }
  };

  const actions = {
    setLoading: () => ({ type: 'SET_LOADING' }),
    setSuccess: (data: T) => ({ type: 'SET_SUCCESS', payload: data }),
    setError: (error: AppError) => ({ type: 'SET_ERROR', payload: error }),
    reset: () => ({ type: 'RESET' })
  };

  return { initialState, reducer, actions };
}
