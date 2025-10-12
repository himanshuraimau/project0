/**
 * Podcast retry mechanism hook
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  PodcastErrorInfo, 
  PodcastRetryConfig, 
  PodcastOperationContext,
  PODCAST_RETRY_CONFIGS 
} from '../lib/types/podcast-error.types';
import { 
  classifyPodcastError,
  shouldRetryPodcastError,
  getPodcastRetryConfig,
  calculateRetryDelay,
  displayPodcastError
} from '../lib/utils/podcast-error-handler';

interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  lastError: PodcastErrorInfo | null;
  retryProgress: number;
  nextRetryIn: number;
}

interface UsePodcastRetryOptions {
  operation: string;
  maxRetries?: number;
  autoRetry?: boolean;
  showToast?: boolean;
  onRetryStart?: (retryCount: number) => void;
  onRetrySuccess?: (retryCount: number) => void;
  onRetryFailed?: (error: PodcastErrorInfo, retryCount: number) => void;
  onMaxRetriesReached?: (error: PodcastErrorInfo) => void;
}

export function usePodcastRetry(
  context?: PodcastOperationContext,
  options: UsePodcastRetryOptions = { operation: 'default' }
) {
  const {
    operation,
    maxRetries,
    autoRetry = false,
    showToast = true,
    onRetryStart,
    onRetrySuccess,
    onRetryFailed,
    onMaxRetriesReached
  } = options;

  // Get retry configuration
  const config = getPodcastRetryConfig(operation);
  const effectiveMaxRetries = maxRetries ?? config.maxRetries;

  // State management
  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null,
    retryProgress: 0,
    nextRetryIn: 0
  });

  // Refs for cleanup
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Reset retry state
  const reset = useCallback(() => {
    cleanup();
    setState({
      isRetrying: false,
      retryCount: 0,
      lastError: null,
      retryProgress: 0,
      nextRetryIn: 0
    });
  }, [cleanup]);

  // Execute operation with retry logic
  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationContext?: PodcastOperationContext
  ): Promise<T> => {
    const currentContext = operationContext || context;
    
    const attemptOperation = async (attemptCount: number): Promise<T> => {
      try {
        if (attemptCount > 0) {
          setState(prev => ({ ...prev, isRetrying: true, retryCount: attemptCount }));
          onRetryStart?.(attemptCount);
        }

        const result = await operation();
        
        if (attemptCount > 0) {
          onRetrySuccess?.(attemptCount);
          if (showToast) {
            displayPodcastError(
              'Operation succeeded after retry',
              currentContext,
              { showToast: true }
            );
          }
        }
        
        reset();
        return result;
      } catch (error) {
        const errorInfo = classifyPodcastError(error, currentContext);
        
        setState(prev => ({ ...prev, lastError: errorInfo }));
        
        // Check if we should retry
        const shouldRetry = shouldRetryPodcastError(errorInfo, currentContext?.operation || 'default') && 
                           attemptCount < effectiveMaxRetries;
        
        if (shouldRetry) {
          const delay = calculateRetryDelay(attemptCount, config);
          
          // Update state with retry info
          setState(prev => ({
            ...prev,
            isRetrying: true,
            retryCount: attemptCount + 1,
            retryProgress: 0,
            nextRetryIn: delay
          }));
          
          // Start progress tracking
          const progressStep = 100 / (delay / 100);
          progressIntervalRef.current = setInterval(() => {
            setState(prev => ({
              ...prev,
              retryProgress: Math.min(prev.retryProgress + progressStep, 100)
            }));
          }, 100);
          
          // Start countdown
          countdownIntervalRef.current = setInterval(() => {
            setState(prev => ({
              ...prev,
              nextRetryIn: Math.max(prev.nextRetryIn - 1000, 0)
            }));
          }, 1000);
          
          // Schedule retry
          return new Promise((resolve, reject) => {
            retryTimeoutRef.current = setTimeout(async () => {
              cleanup();
              try {
                const result = await attemptOperation(attemptCount + 1);
                resolve(result);
              } catch (retryError) {
                reject(retryError);
              }
            }, delay);
          });
        } else {
          // No more retries
          setState(prev => ({ ...prev, isRetrying: false }));
          
          if (attemptCount >= effectiveMaxRetries) {
            onMaxRetriesReached?.(errorInfo);
          } else {
            onRetryFailed?.(errorInfo, attemptCount);
          }
          
          if (showToast) {
            displayPodcastError(error, currentContext, {
              showToast: true,
              onRetry: undefined // Don't show retry button in toast if we can't retry
            });
          }
          
          throw errorInfo;
        }
      }
    };

    return attemptOperation(0);
  }, [
    context,
    config,
    effectiveMaxRetries,
    showToast,
    onRetryStart,
    onRetrySuccess,
    onRetryFailed,
    onMaxRetriesReached,
    reset,
    cleanup
  ]);

  // Manual retry function
  const retry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationContext?: PodcastOperationContext
  ): Promise<T> => {
    if (state.retryCount >= effectiveMaxRetries) {
      throw new Error('Maximum retries reached');
    }
    
    return executeWithRetry(operation, operationContext);
  }, [state.retryCount, effectiveMaxRetries, executeWithRetry]);

  // Auto retry function (for use with useEffect)
  const setupAutoRetry = useCallback(<T>(
    operation: () => Promise<T>,
    operationContext?: PodcastOperationContext
  ) => {
    if (!autoRetry || !state.lastError || state.isRetrying) {
      return;
    }

    const shouldRetry = shouldRetryPodcastError(state.lastError, context?.operation || 'default') && 
                       state.retryCount < effectiveMaxRetries;

    if (shouldRetry) {
      const delay = calculateRetryDelay(state.retryCount, config);
      
      retryTimeoutRef.current = setTimeout(() => {
        executeWithRetry(operation, operationContext).catch(() => {
          // Error already handled in executeWithRetry
        });
      }, delay);
    }
  }, [
    autoRetry,
    state.lastError,
    state.isRetrying,
    state.retryCount,
    effectiveMaxRetries,
    config,
    executeWithRetry
  ]);

  // Cancel current retry
  const cancelRetry = useCallback(() => {
    cleanup();
    setState(prev => ({
      ...prev,
      isRetrying: false,
      retryProgress: 0,
      nextRetryIn: 0
    }));
  }, [cleanup]);

  // Check if operation can be retried
  const canRetry = useCallback((error?: PodcastErrorInfo | Error) => {
    const errorToCheck = error || state.lastError;
    if (!errorToCheck) return false;
    
    const errorInfo = errorToCheck instanceof Error 
      ? classifyPodcastError(errorToCheck, context)
      : errorToCheck;
    
    return shouldRetryPodcastError(errorInfo, operation) && 
           state.retryCount < effectiveMaxRetries;
  }, [state.lastError, state.retryCount, effectiveMaxRetries, context, operation]);

  // Get retry status information
  const getRetryStatus = useCallback(() => {
    return {
      canRetry: canRetry(),
      isRetrying: state.isRetrying,
      retryCount: state.retryCount,
      maxRetries: effectiveMaxRetries,
      remainingRetries: Math.max(effectiveMaxRetries - state.retryCount, 0),
      retryProgress: state.retryProgress,
      nextRetryIn: state.nextRetryIn,
      lastError: state.lastError
    };
  }, [canRetry, state, effectiveMaxRetries]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    // State
    ...state,
    
    // Actions
    executeWithRetry,
    retry,
    reset,
    cancelRetry,
    setupAutoRetry,
    
    // Utilities
    canRetry,
    getRetryStatus,
    
    // Configuration
    config,
    maxRetries: effectiveMaxRetries
  };
}

/**
 * Hook for handling specific podcast operations with built-in retry logic
 */
export function usePodcastOperation<T>(
  operationName: string,
  operation: () => Promise<T>,
  context?: PodcastOperationContext,
  options?: Omit<UsePodcastRetryOptions, 'operation'>
) {
  const retryHook = usePodcastRetry(context, { 
    ...options, 
    operation: operationName 
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<PodcastErrorInfo | null>(null);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await retryHook.executeWithRetry(operation, context);
      setData(result);
      return result;
    } catch (err) {
      const errorInfo = err instanceof Error 
        ? classifyPodcastError(err, context)
        : err as PodcastErrorInfo;
      setError(errorInfo);
      throw errorInfo;
    } finally {
      setIsLoading(false);
    }
  }, [operation, context, retryHook]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setData(null);
    setError(null);
    retryHook.reset();
  }, [retryHook]);

  return {
    // Data state
    data,
    error,
    isLoading,
    
    // Retry state
    isRetrying: retryHook.isRetrying,
    retryCount: retryHook.retryCount,
    retryProgress: retryHook.retryProgress,
    nextRetryIn: retryHook.nextRetryIn,
    
    // Actions
    execute,
    reset,
    cancelRetry: retryHook.cancelRetry,
    
    // Utilities
    canRetry: retryHook.canRetry,
    getRetryStatus: retryHook.getRetryStatus
  };
}