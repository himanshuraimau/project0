/**
 * Podcast-specific error boundary components
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Mic,
  Settings,
  HelpCircle
} from 'lucide-react';
import {
  PodcastErrorInfo,
  PodcastOperationContext
} from '@/lib/types/podcast-error.types';
import {
  classifyPodcastError,
  displayPodcastError
} from '@/lib/utils/podcast-error-handler';

interface PodcastErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: PodcastErrorInfo, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  onRegenerate?: () => void;
  onChangeSettings?: () => void;
  onGoHome?: () => void;
  context?: PodcastOperationContext;
  showRecoveryOptions?: boolean;
}

interface PodcastErrorBoundaryState {
  hasError: boolean;
  error: PodcastErrorInfo | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

/**
 * Error boundary specifically designed for podcast components
 */
export class PodcastErrorBoundary extends Component<
  PodcastErrorBoundaryProps,
  PodcastErrorBoundaryState
> {
  constructor(props: PodcastErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<PodcastErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const podcastError = classifyPodcastError(error, this.props.context);

    this.setState({
      error: podcastError,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(podcastError, errorInfo);
    }

    // Display error with toast (but suppress console log since we're handling it)
    displayPodcastError(error, this.props.context, {
      showToast: true,
      suppressConsoleLog: true
    });

    // Log error for debugging
    console.error('Podcast Error Boundary caught an error:', {
      error: podcastError,
      errorInfo,
      context: this.props.context
    });
  }

  handleRetry = () => {
    this.setState(prev => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prev.retryCount + 1
    }));

    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleRegenerate = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });

    if (this.props.onRegenerate) {
      this.props.onRegenerate();
    }
  };

  handleChangeSettings = () => {
    if (this.props.onChangeSettings) {
      this.props.onChangeSettings();
    }
  };

  handleGoHome = () => {
    if (this.props.onGoHome) {
      this.props.onGoHome();
    } else {
      window.location.href = '/dashboard';
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const error = this.state.error;
      const recoveryOptions = {
        canRetry: true,
        canRegenerate: false,
        canChangeSettings: false,
        canContactSupport: true,
        suggestedActions: ['Try again', 'Contact support']
      };

      // Default fallback UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg text-red-800 dark:text-red-200">
                    Podcast Error
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="destructive" className="text-xs">
                      {error.type.replace(/_/g, ' ').toLowerCase()}
                    </Badge>
                    {this.state.retryCount > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Attempt {this.state.retryCount + 1}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Message */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {error.userMessage}
                </p>

                {/* Suggested Actions */}
                {recoveryOptions.suggestedActions.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Suggestions: </span>
                    {recoveryOptions.suggestedActions.join(', ')}
                  </div>
                )}
              </div>

              {/* Recovery Actions */}
              {this.props.showRecoveryOptions !== false && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recoveryOptions.canRetry && (
                    <Button
                      onClick={this.handleRetry}
                      variant="default"
                      size="sm"
                      className="w-full"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  )}

                  {recoveryOptions.canRegenerate && (
                    <Button
                      onClick={this.handleRegenerate}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Regenerate
                    </Button>
                  )}

                  {recoveryOptions.canChangeSettings && (
                    <Button
                      onClick={this.handleChangeSettings}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Change Settings
                    </Button>
                  )}

                  <Button
                    onClick={this.handleGoHome}
                    variant="ghost"
                    size="sm"
                    className="w-full"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </Button>
                </div>
              )}

              {/* Contact Support */}
              {recoveryOptions.canContactSupport && (
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <HelpCircle className="w-3 h-3" />
                    <span>
                      If the problem persists, please contact support with error ID: {error.errorId}
                    </span>
                  </div>
                </div>
              )}

              {/* Development Details */}
              {process.env.NODE_ENV === 'development' && (
                <details className="text-left">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 p-3 bg-muted rounded text-xs font-mono overflow-auto max-h-32">
                    <div className="space-y-2">
                      <div>
                        <strong>Type:</strong> {error.type}
                      </div>
                      <div>
                        <strong>Message:</strong> {error.message}
                      </div>
                      <div>
                        <strong>Status:</strong> {error.statusCode}
                      </div>
                      <div>
                        <strong>Retryable:</strong> {error.retryable ? 'Yes' : 'No'}
                      </div>
                      {error.context && (
                        <div>
                          <strong>Context:</strong>
                          <pre className="whitespace-pre-wrap text-xs mt-1">
                            {JSON.stringify(error.context, null, 2)}
                          </pre>
                        </div>
                      )}
                      {this.state.errorInfo && (
                        <div>
                          <strong>Component Stack:</strong>
                          <pre className="whitespace-pre-wrap text-xs mt-1">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Compact error fallback for inline use in podcast components
 */
export function PodcastErrorFallback({
  error,
  resetError,
  onRegenerate,
  onChangeSettings,
  context,
  compact = false
}: {
  error: Error;
  resetError: () => void;
  onRegenerate?: () => void;
  onChangeSettings?: () => void;
  context?: PodcastOperationContext;
  compact?: boolean;
}) {
  const podcastError = classifyPodcastError(error, context);
  const recoveryOptions = {
    canRetry: true,
    canRegenerate: false,
    canChangeSettings: false,
    canContactSupport: true,
    suggestedActions: ['Try again']
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-700 dark:text-red-300">
            {podcastError.userMessage}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {recoveryOptions.canRetry && (
            <Button
              onClick={resetError}
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          )}
          {recoveryOptions.canRegenerate && onRegenerate && (
            <Button
              onClick={onRegenerate}
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-100"
            >
              <Mic className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              Podcast Error
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              {podcastError.userMessage}
            </p>

            <div className="flex flex-wrap gap-2">
              {recoveryOptions.canRetry && (
                <Button
                  onClick={resetError}
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
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
                  Settings
                </Button>
              )}
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="mt-3">
                <summary className="text-xs text-red-600 cursor-pointer">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-100 dark:bg-red-900/20 p-2 rounded overflow-auto">
                  {JSON.stringify({
                    type: podcastError.type,
                    message: podcastError.message,
                    errorId: podcastError.errorId,
                    context: podcastError.context
                  }, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Hook-based error boundary wrapper for functional components
 */
export function withPodcastErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<PodcastErrorBoundaryProps>
) {
  return function WrappedComponent(props: P) {
    return (
      <PodcastErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </PodcastErrorBoundary>
    );
  };
}