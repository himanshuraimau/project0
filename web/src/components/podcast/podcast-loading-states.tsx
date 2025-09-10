/**
 * Loading state components for podcast generation and playback
 * Provides visual feedback during long-running operations
 * Requirements: 2.8, 4.1, 4.2, 4.3
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, Mic, Volume2, Upload, Search, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { PodcastGenerationProgress } from '@/lib/utils/podcast-progress-tracker';

/**
 * Main loading component for podcast generation
 */
interface PodcastGenerationLoadingProps {
  progress: PodcastGenerationProgress;
  onCancel?: () => void;
  onRetry?: () => void;
}

export function PodcastGenerationLoading({ 
  progress, 
  onCancel, 
  onRetry 
}: PodcastGenerationLoadingProps) {
  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'pending':
        return <Loader2 className="w-5 h-5 animate-spin" />;
      case 'script_generation':
        return <Mic className="w-5 h-5" />;
      case 'voice_synthesis':
        return <Volume2 className="w-5 h-5" />;
      case 'audio_processing':
        return <Loader2 className="w-5 h-5 animate-spin" />;
      case 'storage':
        return <Upload className="w-5 h-5" />;
      case 'indexing':
        return <Search className="w-5 h-5" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Loader2 className="w-5 h-5 animate-spin" />;
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const isCompleted = progress.stage === 'completed';
  const isFailed = progress.stage === 'failed';
  const isActive = !isCompleted && !isFailed;

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
          {getStageIcon(progress.stage)}
        </div>
        <CardTitle className={`text-lg ${isFailed ? 'text-red-600' : isCompleted ? 'text-green-600' : 'text-gray-900'}`}>
          {isFailed ? 'Generation Failed' : isCompleted ? 'Podcast Ready!' : 'Generating Podcast'}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {isActive && (
          <div className="space-y-2">
            <Progress value={progress.progress} className="w-full" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>{progress.progress}% complete</span>
              {progress.estimatedTimeRemaining && progress.estimatedTimeRemaining > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(progress.estimatedTimeRemaining)} remaining
                </span>
              )}
            </div>
          </div>
        )}

        {/* Status Message */}
        <div className="text-center">
          <p className={`text-sm ${isFailed ? 'text-red-700' : 'text-gray-600'}`}>
            {progress.message}
          </p>
          {progress.error && (
            <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded">
              {progress.error}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-center">
          {isActive && onCancel && (
            <Button
              onClick={onCancel}
              variant="outline"
              size="sm"
              className="text-gray-600"
            >
              Cancel
            </Button>
          )}
          
          {isFailed && onRetry && (
            <Button
              onClick={onRetry}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          
          {isCompleted && (
            <Button
              onClick={() => window.location.reload()}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              View Podcast
            </Button>
          )}
        </div>

        {/* Stage Indicators */}
        {isActive && (
          <div className="mt-6">
            <div className="text-xs text-gray-500 mb-2">Generation Stages</div>
            <PodcastStageIndicators currentStage={progress.stage} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Stage indicators showing progress through generation phases
 */
interface PodcastStageIndicatorsProps {
  currentStage: string;
}

function PodcastStageIndicators({ currentStage }: PodcastStageIndicatorsProps) {
  const stages = [
    { key: 'pending', label: 'Init', icon: Loader2 },
    { key: 'script_generation', label: 'Script', icon: Mic },
    { key: 'voice_synthesis', label: 'Voice', icon: Volume2 },
    { key: 'audio_processing', label: 'Audio', icon: Loader2 },
    { key: 'storage', label: 'Save', icon: Upload },
    { key: 'indexing', label: 'Index', icon: Search }
  ];

  const currentIndex = stages.findIndex(stage => stage.key === currentStage);

  return (
    <div className="flex items-center justify-between">
      {stages.map((stage, index) => {
        const Icon = stage.icon;
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;

        return (
          <div key={stage.key} className="flex flex-col items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-xs
              ${isCompleted ? 'bg-green-100 text-green-600' : 
                isCurrent ? 'bg-blue-100 text-blue-600' : 
                'bg-gray-100 text-gray-400'}
            `}>
              <Icon className={`w-3 h-3 ${isCurrent ? 'animate-spin' : ''}`} />
            </div>
            <span className={`
              text-xs mt-1
              ${isCompleted ? 'text-green-600' : 
                isCurrent ? 'text-blue-600' : 
                'text-gray-400'}
            `}>
              {stage.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Compact loading indicator for inline use
 */
interface PodcastInlineLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  progress?: number;
}

export function PodcastInlineLoading({ 
  message = 'Loading...', 
  size = 'md',
  showProgress = false,
  progress = 0
}: PodcastInlineLoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <div className="flex items-center gap-2">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
      <span className="text-sm text-gray-600">{message}</span>
      {showProgress && (
        <div className="flex items-center gap-2 ml-2">
          <Progress value={progress} className="w-20 h-2" />
          <span className="text-xs text-gray-500">{progress}%</span>
        </div>
      )}
    </div>
  );
}

/**
 * Loading skeleton for podcast player
 */
export function PodcastPlayerSkeleton() {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Waveform skeleton */}
          <div className="h-20 bg-gray-200 rounded animate-pulse" />
          
          {/* Controls skeleton */}
          <div className="flex items-center justify-center gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
          </div>
          
          {/* Progress bar skeleton */}
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 rounded animate-pulse" />
            <div className="flex justify-between">
              <div className="w-12 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="w-12 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          
          {/* Speaker info skeleton */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for transcript viewer
 */
export function TranscriptViewerSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search bar skeleton */}
      <div className="h-10 bg-gray-200 rounded animate-pulse" />
      
      {/* Transcript segments skeleton */}
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="space-y-1 ml-8">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            {index % 2 === 0 && (
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Loading skeleton for voice selection
 */
export function VoiceSelectionSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
              <div className="space-y-1">
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="w-full h-8 bg-gray-200 rounded animate-pulse" />
          </div>
        </Card>
      ))}
    </div>
  );
}

/**
 * Loading overlay for configuration modal
 */
interface ConfigurationLoadingOverlayProps {
  message: string;
  onCancel?: () => void;
}

export function ConfigurationLoadingOverlay({ 
  message, 
  onCancel 
}: ConfigurationLoadingOverlayProps) {
  return (
    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm text-gray-600">{message}</p>
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="outline"
            size="sm"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}