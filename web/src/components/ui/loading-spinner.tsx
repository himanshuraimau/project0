/**
 * Loading spinner components with different variants
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import React from 'react';
import { Loader2, Brain, BookOpen, Save } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ai' | 'book' | 'save';
  className?: string;
}

/**
 * Basic loading spinner component
 */
export function LoadingSpinner({ 
  size = 'md', 
  variant = 'default',
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const IconComponent = {
    default: Loader2,
    ai: Brain,
    book: BookOpen,
    save: Save
  }[variant];

  return (
    <IconComponent 
      className={`animate-spin ${sizeClasses[size]} ${className}`}
    />
  );
}

interface LoadingStateProps {
  message: string;
  submessage?: string;
  variant?: 'default' | 'ai' | 'book' | 'save';
  progress?: number;
  className?: string;
}

/**
 * Loading state with message and optional progress
 */
export function LoadingState({ 
  message, 
  submessage,
  variant = 'default',
  progress,
  className = '' 
}: LoadingStateProps) {
  const variantStyles = {
    default: 'text-blue-600',
    ai: 'text-purple-600',
    book: 'text-green-600',
    save: 'text-orange-600'
  };

  return (
    <div className={`flex flex-col items-center space-y-4 p-6 ${className}`}>
      <div className="flex items-center space-x-3">
        <LoadingSpinner 
          variant={variant} 
          size="lg" 
          className={variantStyles[variant]}
        />
        <div className="text-center">
          <p className={`font-medium ${variantStyles[variant]}`}>
            {message}
          </p>
          {submessage && (
            <p className="text-sm text-gray-600 mt-1">
              {submessage}
            </p>
          )}
        </div>
      </div>
      
      {progress !== undefined && (
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                variant === 'ai' ? 'bg-purple-600' :
                variant === 'book' ? 'bg-green-600' :
                variant === 'save' ? 'bg-orange-600' :
                'bg-blue-600'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface ProgressIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

/**
 * Multi-step progress indicator
 */
export function ProgressIndicator({ 
  steps, 
  currentStep, 
  className = '' 
}: ProgressIndicatorProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const isPending = index > currentStep;

        return (
          <div 
            key={index}
            className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-300 ${
              isActive ? 'bg-blue-50 border border-blue-200' :
              isCompleted ? 'bg-green-50 border border-green-200' :
              'bg-gray-50 border border-gray-200'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
              isActive ? 'bg-blue-600 text-white' :
              isCompleted ? 'bg-green-600 text-white' :
              'bg-gray-300 text-gray-600'
            }`}>
              {isCompleted ? '✓' : 
               isActive ? <LoadingSpinner size="sm" className="text-white" /> :
               index + 1}
            </div>
            <span className={`text-sm font-medium transition-colors duration-300 ${
              isActive ? 'text-blue-700' :
              isCompleted ? 'text-green-700' :
              'text-gray-600'
            }`}>
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Inline loading indicator for buttons and small spaces
 */
export function InlineLoading({ 
  message, 
  variant = 'default',
  className = '' 
}: Pick<LoadingStateProps, 'message' | 'variant' | 'className'>) {
  const variantStyles = {
    default: 'text-blue-600',
    ai: 'text-purple-600',
    book: 'text-green-600',
    save: 'text-orange-600'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <LoadingSpinner 
        variant={variant} 
        size="sm" 
        className={variantStyles[variant]}
      />
      <span className={`text-sm font-medium ${variantStyles[variant]}`}>
        {message}
      </span>
    </div>
  );
}