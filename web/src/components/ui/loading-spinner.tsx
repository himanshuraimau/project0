/**
 * Loading spinner components with different variants
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import React from "react";
import { Loader2, Brain, BookOpen, Save } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "ai" | "book" | "save";
  className?: string;
}

/**
 * Basic loading spinner component
 */
export function LoadingSpinner({
  size = "md",
  variant = "default",
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const IconComponent = {
    default: Loader2,
    ai: Brain,
    book: BookOpen,
    save: Save,
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
  variant?: "default" | "ai" | "book" | "save";
  progress?: number;
  className?: string;
}

/**
 * Loading state with message and optional progress
 */
export function LoadingState({
  message,
  submessage,
  variant = "default",
  progress,
  className = "",
}: LoadingStateProps) {
  return (
    <div className={`min-h-[calc(100vh-64px)] w-full bg-background p-6 ${className}`}>
      <div className="max-w-4xl mx-auto">
        {/* Loading Text with Pulse */}
        <div className="text-center mb-8 space-y-3">
          <h2 className="text-2xl font-bold text-foreground animate-pulse">
            {message}
          </h2>
          {submessage && (
            <p className="text-muted-foreground animate-pulse" style={{ animationDelay: '0.5s' }}>
              {submessage}
            </p>
          )}
        </div>

        {/* Skeleton Card */}
        <div className="rounded-2xl border-2 border-dashed border-accent/30 bg-accent/5 p-8 ">
          <div className="text-center space-y-6">
            {/* Avatar Circle */}
            <div className="mx-auto w-20 h-20 rounded-full bg-muted relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>

            {/* Title Bar */}
            <div className="h-6 w-3/5 bg-muted rounded-xl mx-auto relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>

            {/* Text Lines */}
            <div className="space-y-3 pt-4">
              <div className="h-4 w-full bg-muted rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
              <div className="h-4 w-11/12 bg-muted rounded-lg mx-auto relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
              <div className="h-4 w-9/12 bg-muted rounded-lg mx-auto relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
              <div className="h-4 w-10/12 bg-muted rounded-lg mx-auto relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
              <div className="h-4 w-7/12 bg-muted rounded-lg mx-auto relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
            </div>

            {/* Progress bar */}
            {progress !== undefined && (
              <div className="w-full pt-6">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span className="font-semibold">Progress</span>
                  <span className="font-semibold">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 rounded-full transition-all duration-300 bg-accent"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite ease-in-out;
        }
      `}</style>
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
  className = "",
}: ProgressIndicatorProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div
            key={index}
            className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-300 ${
              isActive
                ? "bg-blue-50 border border-blue-200"
                : isCompleted
                ? "bg-green-50 border border-green-200"
                : "bg-gray-50 border border-gray-200"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                isActive
                  ? "bg-blue-600 text-white"
                  : isCompleted
                  ? "bg-green-600 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              {isCompleted ? (
                "✓"
              ) : isActive ? (
                <LoadingSpinner size="sm" className="text-white" />
              ) : (
                index + 1
              )}
            </div>
            <span
              className={`text-sm font-medium transition-colors duration-300 ${
                isActive
                  ? "text-blue-700"
                  : isCompleted
                  ? "text-green-700"
                  : "text-gray-600"
              }`}
            >
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
  variant = "default",
  className = "",
}: Pick<LoadingStateProps, "message" | "variant" | "className">) {
  const variantStyles = {
    default: "text-blue-600",
    ai: "text-purple-600",
    book: "text-green-600",
    save: "text-orange-600",
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
