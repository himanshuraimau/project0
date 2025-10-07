import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react';
import { PodcastGenerationError } from '@/lib/types/podcast.types';
import { podcastErrorHandler } from '@/lib/utils/podcast-error-handler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  context?: 'generation' | 'playback' | 'configuration' | 'transcript';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

/**
 * Specialized error boundary for podcast components
 */
export class PodcastErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error with podcast context
    podcastErrorHandler.logError(error, `Podcast ${this.props.context || 'component'}`, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      retryCount: this.state.retryCount
    });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState({ 
        hasError: false, 
        error: null, 
        errorInfo: null,
        retryCount: this.state.retryCount + 1
      });
    }
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  handleContactSupport = () => {
    // Open support chat or email
    window.open('mailto:support@example.com?subject=Podcast Error Report', '_blank');
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const podcastError = this.state.error instanceof PodcastGenerationError 
        ? this.state.error 
        : podcastErrorHandler.handleError(this.state.error, this.props.context || 'component');

      const userMessage = podcastErrorHandler.getUserFriendlyMessage(podcastError);
      const canRetry = this.state.retryCount < this.maxRetries && 
                      podcastErrorHandler.isRetryableError(this.state.error);

      return (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-lg text-gray-900">
              {this.getContextTitle()}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              {userMessage}
            </p>
            
            {this.state.retryCount > 0 && (
              <p className="text-xs text-gray-500 text-center">
                Retry attempt {this.state.retryCount} of {this.maxRetries}
              </p>
            )}
            
            <div className="space-y-2">
              {canRetry && (
                <Button
                  onClick={this.handleRetry}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
              
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
              
              <Button
                onClick={this.handleContactSupport}
                variant="ghost"
                className="w-full text-gray-600"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto max-h-32">
                  <div className="mb-2">
                    <strong>Error Type:</strong> {podcastError.code}
                  </div>
                  <div className="mb-2">
                    <strong>Message:</strong> {this.state.error.message}
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs mt-1">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }

  private getContextTitle(): string {
    switch (this.props.context) {
      case 'generation':
        return 'Podcast Generation Error';
      case 'playback':
        return 'Podcast Playback Error';
      case 'configuration':
        return 'Configuration Error';
      case 'transcript':
        return 'Transcript Error';
      default:
        return 'Podcast Error';
    }
  }
}

/**
 * Hook-based error fallback for functional components
 */
interface PodcastErrorFallbackProps {
  error: Error;
  resetError: () => void;
  context?: string;
}

export function PodcastErrorFallback({ 
  error, 
  resetError, 
  context = 'component' 
}: PodcastErrorFallbackProps) {
  const podcastError = error instanceof PodcastGenerationError 
    ? error 
    : podcastErrorHandler.handleError(error, context);

  const userMessage = podcastErrorHandler.getUserFriendlyMessage(podcastError);
  const canRetry = podcastErrorHandler.isRetryableError(error);

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 mb-2">
            Podcast {context.charAt(0).toUpperCase() + context.slice(1)} Error
          </h3>
          <p className="text-sm text-red-700 mb-3">
            {userMessage}
          </p>
          
          <div className="flex gap-2">
            {canRetry && (
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
            
            <Button
              onClick={() => window.location.href = '/dashboard'}
              size="sm"
              variant="ghost"
              className="text-red-700 hover:bg-red-100"
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-3">
              <summary className="text-xs text-red-600 cursor-pointer">
                Error Details
              </summary>
              <pre className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto">
                {error.message}
                {error.stack && (
                  <>
                    {'\n\nStack:\n'}
                    {error.stack}
                  </>
                )}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Inline error display for podcast operations
 */
export function PodcastInlineError({ 
  error, 
  onRetry,
  context = 'operation',
  className = ""
}: { 
  error: Error | string; 
  onRetry?: () => void;
  context?: string;
  className?: string;
}) {
  const errorMessage = typeof error === 'string' 
    ? error 
    : podcastErrorHandler.getUserFriendlyMessage(
        error instanceof PodcastGenerationError 
          ? error 
          : podcastErrorHandler.handleError(error, context)
      );
  
  const canRetry = typeof error !== 'string' && podcastErrorHandler.isRetryableError(error);

  return (
    <div className={`flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md text-sm ${className}`}>
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-600" />
        <span className="text-red-700">{errorMessage}</span>
      </div>
      {canRetry && onRetry && (
        <Button 
          onClick={onRetry}
          size="sm"
          variant="ghost"
          className="text-red-600 hover:text-red-800 hover:bg-red-100"
        >
          Retry
        </Button>
      )}
    </div>
  );
}