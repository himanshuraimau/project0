/**
 * React Error Boundary Components
 * Provides reusable error UI components for the application
 */

import React from 'react';
import { extractErrorInfo, ErrorFallbackProps } from '@/lib/utils/client-error-handler';

/**
 * Default error fallback component for React Error Boundaries
 */
export function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const errorInfo = extractErrorInfo(error);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
      <div className="text-red-600 dark:text-red-400 text-center">
        <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
        <p className="text-sm mb-4">{errorInfo.userMessage}</p>
        
        {errorInfo.retryable && (
          <button
            onClick={resetError}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        )}
        
        <details className="mt-4 text-xs text-gray-600 dark:text-gray-400">
          <summary className="cursor-pointer">Technical Details</summary>
          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-left overflow-auto">
            {JSON.stringify({
              type: errorInfo.type,
              message: errorInfo.message,
              errorId: errorInfo.errorId,
              timestamp: errorInfo.timestamp
            }, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

/**
 * Compact error display for inline use
 */
export function InlineErrorDisplay({ 
  error, 
  onRetry,
  className = ""
}: { 
  error: Error | string; 
  onRetry?: () => void;
  className?: string;
}) {
  const errorInfo = typeof error === 'string' 
    ? { userMessage: error, retryable: true }
    : extractErrorInfo(error);
  
  return (
    <div className={`flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md text-sm ${className}`}>
      <span className="text-red-700 dark:text-red-300">{errorInfo.userMessage}</span>
      {errorInfo.retryable && onRetry && (
        <button 
          onClick={onRetry}
          className="text-red-600 hover:text-red-800 underline ml-3"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Loading state with error handling component
 */
export function LoadingStateDisplay({ 
  isLoading, 
  error, 
  onRetry,
  loadingText = "Loading...",
  children
}: {
  isLoading: boolean;
  error?: Error | string | null;
  onRetry?: () => void;
  loadingText?: string;
  children: React.ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 dark:text-gray-400">{loadingText}</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return <InlineErrorDisplay error={error} onRetry={onRetry} />;
  }
  
  return <>{children}</>;
}

/**
 * Form field error display
 */
export function FieldErrorDisplay({ 
  error,
  className = ""
}: { 
  error?: string;
  className?: string;
}) {
  if (!error) return null;
  
  return (
    <p className={`text-red-600 dark:text-red-400 text-sm mt-1 ${className}`}>
      {error}
    </p>
  );
}

/**
 * Toast-style error notification (for custom implementations)
 */
export function ErrorToast({ 
  error, 
  onDismiss,
  onRetry
}: {
  error: Error | string;
  onDismiss: () => void;
  onRetry?: () => void;
}) {
  const errorInfo = typeof error === 'string' 
    ? { userMessage: error, retryable: false }
    : extractErrorInfo(error);
  
  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-red-600 text-white p-4 rounded-lg shadow-lg z-50">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm font-medium">Error</p>
          <p className="text-sm opacity-90 mt-1">{errorInfo.userMessage}</p>
        </div>
        <button 
          onClick={onDismiss}
          className="text-white/80 hover:text-white ml-2"
        >
          ✕
        </button>
      </div>
      
      {errorInfo.retryable && onRetry && (
        <button 
          onClick={onRetry}
          className="mt-3 text-sm underline hover:no-underline"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
