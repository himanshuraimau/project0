/**
 * Podcast-specific error display components
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  RefreshCw, 
  Mic, 
  Settings, 
  Download,
  HelpCircle,
  Clock,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { 
  PodcastErrorInfo, 
  PodcastErrorType,
  PodcastOperationContext 
} from '@/lib/types/podcast-error.types';
import { 
  classifyPodcastError,
  shouldRetryPodcastError,
  getPodcastRetryConfig,
  calculateRetryDelay,
  createRetryFunction
} from '@/lib/utils/podcast-error-handler';

interface PodcastErrorDisplayProps {
  error: PodcastErrorInfo | Error | string;
  context?: PodcastOperationContext;
  onRetry?: () => void | Promise<void>;
  onRegenerate?: () => void;
  onChangeSettings?: () => void;
  onDismiss?: () => void;
  isRetrying?: boolean;
  retryCount?: number;
  maxRetries?: number;
  className?: string;
  variant?: 'default' | 'compact' | 'inline' | 'toast';
}

/**
 * Main error display component for podcast errors
 */
export function PodcastErrorDisplay({
  error,
  context,
  onRetry,
  onRegenerate,
  onChangeSettings,
  onDismiss,
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3,
  className = '',
  variant = 'default'
}: PodcastErrorDisplayProps) {
  const errorInfo = typeof error === 'string' 
    ? classifyPodcastError(new Error(error), context)
    : error instanceof Error 
      ? classifyPodcastError(error, context)
      : error;

  const recoveryOptions = {
    canRetry: true,
    canRegenerate: false,
    canChangeSettings: false,
    canContactSupport: true,
    suggestedActions: ['Try again']
  };

  const canRetry = recoveryOptions.canRetry && onRetry && retryCount < maxRetries;

  if (variant === 'compact') {
    return (
      <div className={`flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md ${className}`}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-700 dark:text-red-300">
            {errorInfo.userMessage}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {canRetry && (
            <Button
              onClick={onRetry}
              disabled={isRetrying}
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-100"
            >
              {isRetrying ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
            </Button>
          )}
          {onDismiss && (
            <Button
              onClick={onDismiss}
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-100"
            >
              ×
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center space-x-2 text-sm text-red-600 ${className}`}>
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1">{errorInfo.userMessage}</span>
        {canRetry && (
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

  return (
    <Card className={`border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-base text-red-800 dark:text-red-200">
                Podcast Error
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="destructive" className="text-xs">
                  {errorInfo.type.replace(/_/g, ' ').toLowerCase()}
                </Badge>
                {retryCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Attempt {retryCount + 1}/{maxRetries + 1}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {onDismiss && (
            <Button
              onClick={onDismiss}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
            >
              ×
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Error Message */}
        <p className="text-sm text-red-700 dark:text-red-300">
          {errorInfo.userMessage}
        </p>

        {/* Suggested Actions */}
        {recoveryOptions.suggestedActions.length > 0 && (
          <div className="text-xs text-red-600 dark:text-red-400">
            <span className="font-medium">Suggestions: </span>
            {recoveryOptions.suggestedActions.join(', ')}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {canRetry && (
            <Button
              onClick={onRetry}
              disabled={isRetrying}
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
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
          )}
          
          {recoveryOptions.canRegenerate && onRegenerate && (
            <Button
              onClick={onRegenerate}
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <Mic className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
          )}
          
          {recoveryOptions.canChangeSettings && onChangeSettings && (
            <Button
              onClick={onChangeSettings}
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <Settings className="w-4 h-4 mr-2" />
              Change Settings
            </Button>
          )}
        </div>

        {/* Error ID for Support */}
        {recoveryOptions.canContactSupport && (
          <div className="pt-2 border-t border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
              <HelpCircle className="w-3 h-3" />
              <span>Error ID: {errorInfo.errorId}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Generation-specific error component with progress and retry logic
 */
export function PodcastGenerationError({
  error,
  onRetry,
  onRegenerate,
  onChangeSettings,
  isRetrying = false,
  retryCount = 0,
  progress = 0
}: {
  error: PodcastErrorInfo | Error | string;
  onRetry?: () => Promise<void>;
  onRegenerate?: () => void;
  onChangeSettings?: () => void;
  isRetrying?: boolean;
  retryCount?: number;
  progress?: number;
}) {
  const [autoRetrying, setAutoRetrying] = useState(false);
  const [retryProgress, setRetryProgress] = useState(0);

  const errorInfo = typeof error === 'string' 
    ? classifyPodcastError(new Error(error), { operation: 'generate', timestamp: new Date() })
    : error instanceof Error 
      ? classifyPodcastError(error, { operation: 'generate', timestamp: new Date() })
      : error;

  const config = getPodcastRetryConfig('generation');
  const canAutoRetry = shouldRetryPodcastError(errorInfo, 'generation') && retryCount < config.maxRetries;

  const handleAutoRetry = async () => {
    if (!onRetry || !canAutoRetry) return;

    setAutoRetrying(true);
    setRetryProgress(0);

    const delay = calculateRetryDelay(retryCount, config);
    const interval = setInterval(() => {
      setRetryProgress(prev => Math.min(prev + (100 / (delay / 100)), 100));
    }, 100);

    setTimeout(async () => {
      clearInterval(interval);
      try {
        await onRetry();
      } finally {
        setAutoRetrying(false);
        setRetryProgress(0);
      }
    }, delay);
  };

  return (
    <div className="space-y-6">
      <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20">
              <Mic className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-red-800 dark:text-red-200">
                Generation Failed
              </CardTitle>
              <p className="text-sm text-red-600 dark:text-red-400">
                {errorInfo.userMessage}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Progress indicator if generation was in progress */}
          {progress > 0 && progress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-red-600">
                <span>Generation progress when failed</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Auto-retry progress */}
          {autoRetrying && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-red-700">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Retrying in {Math.ceil((100 - retryProgress) / 10)} seconds...</span>
              </div>
              <Progress value={retryProgress} className="h-2" />
            </div>
          )}

          {/* Manual actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {canAutoRetry && !autoRetrying && (
              <Button
                onClick={handleAutoRetry}
                disabled={isRetrying}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Auto Retry ({config.maxRetries - retryCount} left)
              </Button>
            )}
            
            {onRetry && (
              <Button
                onClick={onRetry}
                disabled={isRetrying || autoRetrying}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Manual Retry
              </Button>
            )}
            
            {onRegenerate && (
              <Button
                onClick={onRegenerate}
                variant="outline"
                className="w-full"
              >
                <Mic className="w-4 h-4 mr-2" />
                New Generation
              </Button>
            )}
            
            {onChangeSettings && (
              <Button
                onClick={onChangeSettings}
                variant="ghost"
                className="w-full"
              >
                <Settings className="w-4 h-4 mr-2" />
                Change Settings
              </Button>
            )}
          </div>

          {/* Error details */}
          <div className="pt-2 border-t border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
            <div className="flex justify-between">
              <span>Error ID: {errorInfo.errorId}</span>
              <span>Attempt: {retryCount + 1}/{config.maxRetries + 1}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Audio playback error component
 */
export function PodcastPlaybackError({
  error,
  onRetry,
  onDownload,
  audioUrl
}: {
  error: PodcastErrorInfo | Error | string;
  onRetry?: () => void;
  onDownload?: () => void;
  audioUrl?: string;
}) {
  const errorInfo = typeof error === 'string' 
    ? classifyPodcastError(new Error(error), { operation: 'play', timestamp: new Date() })
    : error instanceof Error 
      ? classifyPodcastError(error, { operation: 'play', timestamp: new Date() })
      : error;

  const isNetworkError = errorInfo.type === PodcastErrorType.AUDIO_PLAYBACK_FAILED || 
                        errorInfo.message.toLowerCase().includes('network');

  return (
    <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-md">
      <div className="flex items-center gap-2">
        {isNetworkError ? (
          <WifiOff className="w-4 h-4 text-amber-600" />
        ) : (
          <VolumeX className="w-4 h-4 text-amber-600" />
        )}
        <span className="text-sm text-amber-700 dark:text-amber-300">
          {errorInfo.userMessage}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-100"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        )}
        {onDownload && audioUrl && (
          <Button
            onClick={onDownload}
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-100"
          >
            <Download className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Network connectivity error component
 */
export function PodcastNetworkError({
  onRetry,
  isRetrying = false
}: {
  onRetry?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <div className="flex items-center justify-center p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          {isRetrying ? (
            <Wifi className="w-8 h-8 text-blue-600 animate-pulse" />
          ) : (
            <WifiOff className="w-8 h-8 text-blue-600" />
          )}
        </div>
        <div>
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Connection Issue
          </h3>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            {isRetrying ? 'Reconnecting...' : 'Please check your internet connection'}
          </p>
        </div>
        {onRetry && !isRetrying && (
          <Button
            onClick={onRetry}
            size="sm"
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}