/**
 * Error message component for displaying user-friendly error messages
 * Requirements: 8.1, 8.3, 8.5
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { CourseCreationErrorInfo, CourseCreationError } from '@/lib/types/error.types';

interface ErrorMessageProps {
  error: CourseCreationErrorInfo;
  onRetry?: () => void;
  onDismiss?: () => void;
  isRetrying?: boolean;
  retryCount?: number;
  maxRetries?: number;
  className?: string;
}

/**
 * Displays error messages with appropriate styling and actions
 */
export function ErrorMessage({
  error,
  onRetry,
  onDismiss,
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3,
  className = ''
}: ErrorMessageProps) {
  const getErrorSeverity = (errorType: CourseCreationError) => {
    switch (errorType) {
      case CourseCreationError.TITLE_VALIDATION:
      case CourseCreationError.UNITS_VALIDATION:
      case CourseCreationError.CHAPTERS_VALIDATION:
        return 'warning';
      case CourseCreationError.AUTHENTICATION_ERROR:
      case CourseCreationError.UNAUTHORIZED:
        return 'error';
      default:
        return 'error';
    }
  };

  const severity = getErrorSeverity(error.type);
  const canRetry = error.retryable && onRetry && retryCount < maxRetries;

  const baseClasses = "rounded-lg border p-4 flex items-start space-x-3";
  const severityClasses = {
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    error: "bg-red-50 border-red-200 text-red-800"
  };

  return (
    <div className={`${baseClasses} ${severityClasses[severity]} ${className}`}>
      <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${
        severity === 'warning' ? 'text-amber-600' : 'text-red-600'
      }`} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-medium text-sm">
              {error.userMessage}
            </p>
            
            {retryCount > 0 && (
              <p className="text-xs mt-1 opacity-75">
                Attempt {retryCount + 1} of {maxRetries + 1}
              </p>
            )}
            
            {error.type === CourseCreationError.AI_QUOTA_EXCEEDED && (
              <p className="text-xs mt-2 opacity-75">
                Tip: Try again in a few minutes when the AI service limit resets.
              </p>
            )}
            
            {error.type === CourseCreationError.AI_TIMEOUT && (
              <p className="text-xs mt-2 opacity-75">
                Tip: Try using a shorter, more specific course title.
              </p>
            )}
            
            {error.type === CourseCreationError.NETWORK_ERROR && (
              <p className="text-xs mt-2 opacity-75">
                Tip: Check your internet connection and try again.
              </p>
            )}
          </div>
          
          {onDismiss && (
            <Button
              onClick={onDismiss}
              variant="ghost"
              size="sm"
              className={`ml-2 h-6 w-6 p-0 ${
                severity === 'warning' 
                  ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-100' 
                  : 'text-red-600 hover:text-red-700 hover:bg-red-100'
              }`}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {canRetry && (
          <div className="mt-3">
            <Button
              onClick={onRetry}
              disabled={isRetrying}
              variant="outline"
              size="sm"
              className={`${
                severity === 'warning'
                  ? 'border-amber-300 text-amber-700 hover:bg-amber-100'
                  : 'border-red-300 text-red-700 hover:bg-red-100'
              }`}
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact error message for inline display
 */
export function InlineErrorMessage({
  error,
  onRetry,
  isRetrying = false,
  className = ''
}: Pick<ErrorMessageProps, 'error' | 'onRetry' | 'isRetrying' | 'className'>) {
  return (
    <div className={`flex items-center space-x-2 text-sm text-red-600 ${className}`}>
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span className="flex-1">{error.userMessage}</span>
      {error.retryable && onRetry && (
        <Button
          onClick={onRetry}
          disabled={isRetrying}
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          {isRetrying ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
        </Button>
      )}
    </div>
  );
}