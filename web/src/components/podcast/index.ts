/**
 * Podcast Component Library
 * 
 * A comprehensive set of components for AI-generated podcast functionality,
 * including generation, playback, transcript synchronization, and error handling.
 * 
 * Requirements: 5.5 - Visual consistency with Quiz and Mindmap features
 */

import React from 'react';

// =============================================================================
// MAIN COMPONENTS
// =============================================================================

/**
 * Primary podcast generation interface component
 * Handles the complete podcast generation workflow from form to completion
 */
export { PodcastGenerator } from './podcast-generator';

// Note: PodcastGeneratorProps is not exported from the component file
// It's defined as an internal interface. We'll define it here for external use.
export interface PodcastGeneratorProps {
  noteId: string;
  noteTitle?: string;
  noteContent?: string;
  onClose?: () => void;
}

/**
 * Audio player component with synchronized transcript display
 * Provides full audio controls and real-time text highlighting
 */
export { PodcastPlayer } from './podcast-player';

// Note: PodcastPlayerProps is not exported from the component file
export interface PodcastPlayerProps {
  podcast: Podcast;
  transcript?: string;
  noteTitle?: string;
  onRegenerateClick: () => void;
  onDownloadClick: () => void;
  onViewTranscriptClick: () => void;
  onDeleteClick: () => void;
  className?: string;
  compact?: boolean;
  loading?: boolean;
}

/**
 * Two-card layout component for podcast playback and transcript viewing
 * Main interface for consuming completed podcasts
 */
export { PodcastLayout } from './podcast-layout';

/**
 * Podcast history component for managing multiple podcasts per note
 * Displays categorized podcast history with management actions
 */
export { PodcastHistory } from './podcast-history';

// Note: PodcastLayoutProps is not exported from the component file
export interface PodcastLayoutProps {
  podcast: Podcast;
  noteTitle?: string;
  noteContent?: string;
  onRegenerateClick: () => void;
  onDownloadClick: () => void;
  onDeleteClick: () => void;
  className?: string;
}

// Note: PodcastHistoryProps is not exported from the component file
export interface PodcastHistoryProps {
  history: {
    podcasts: Podcast[];
    latest: Podcast | null;
    inProgress: Podcast | null;
    completed: Podcast[];
    failed: Podcast[];
    superseded: Podcast[];
  };
  onPlayPodcast: (podcast: Podcast) => void;
  onDownloadPodcast: (podcast: Podcast) => void;
  onDeletePodcast: (podcast: Podcast) => void;
  onRegeneratePodcast: (podcast: Podcast) => void;
  className?: string;
}

/**
 * Podcast generation form with voice selection and quality settings
 * Handles user input for podcast generation options
 */
export { PodcastForm } from './podcast-form';

// Note: PodcastFormProps is not exported from the component file
export interface PodcastFormProps {
  onSubmit: (data: PodcastGenerationForm) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

// =============================================================================
// UI COMPONENTS
// =============================================================================

/**
 * Audio player controls (play, pause, seek, volume)
 * Reusable component for audio playback functionality
 */
export { PodcastControls } from './podcast-controls';

// Note: PodcastControlsProps is not exported from the component file
export interface PodcastControlsProps {
  state: AudioPlayerState;
  controls: AudioPlayerControls;
  className?: string;
  compact?: boolean;
}

/**
 * Synchronized transcript viewer with text highlighting
 * Displays transcript content with audio synchronization
 */
export { TranscriptViewer } from './transcript-viewer';

// Note: TranscriptViewerProps is not exported from the component file
export interface TranscriptViewerProps {
  transcript: string;
  currentTime: number;
  audioDuration?: number;
  onTimeSeek?: (time: number) => void;
  className?: string;
  compact?: boolean;
  showTopics?: boolean;
  autoEnhance?: boolean;
  loading?: boolean;
}

// =============================================================================
// ACTION COMPONENTS
// =============================================================================

/**
 * Complete set of podcast action buttons (regenerate, download, view transcript, delete)
 * Provides all podcast management functionality in a single component
 */
export { 
  PodcastActions,
  RegenerateButton,
  DownloadButton,
  ViewTranscriptButton,
  DeletePodcastButton
} from './podcast-actions';

// Note: Individual button props are not exported from the component file
export interface PodcastActionsProps {
  podcast: Podcast;
  onRegenerate?: (options: PodcastGenerationOptions) => Promise<void>;
  onDelete?: () => Promise<void>;
  disabled?: boolean;
  showDelete?: boolean;
}

export interface RegenerateButtonProps {
  podcast: Podcast;
  onRegenerate: (options: PodcastGenerationOptions) => Promise<void>;
  disabled?: boolean;
}

export interface DownloadButtonProps {
  podcast: Podcast;
  disabled?: boolean;
}

export interface ViewTranscriptButtonProps {
  podcast: Podcast;
  disabled?: boolean;
}

export interface DeletePodcastButtonProps {
  podcast: Podcast;
  onDelete: () => Promise<void>;
  disabled?: boolean;
}

// =============================================================================
// LOADING STATES
// =============================================================================

/**
 * Comprehensive skeleton loading components for all podcast states
 * Provides consistent loading experiences across the podcast interface
 */
export {
  PodcastSkeleton,
  PodcastGeneratorSkeleton,
  PodcastPlayerSkeleton,
  PodcastLayoutSkeleton,
  PodcastFormSkeleton,
  PodcastCompactSkeleton,
  PodcastGenerationSkeleton,
  TranscriptSyncSkeleton,
  PodcastSidebarSkeleton
} from './podcast-skeleton';

// Note: PodcastSkeletonProps is not exported from the component file
export interface PodcastSkeletonProps {
  variant?: "generator" | "player" | "layout" | "form" | "compact";
  className?: string;
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Error boundary components for podcast-specific error handling
 * Provides graceful error recovery with user-friendly interfaces
 */
export {
  PodcastErrorBoundary,
  PodcastErrorFallback,
  withPodcastErrorBoundary
} from './podcast-error-boundary';

// Note: Error boundary props are not exported from the component file
export interface PodcastErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: PodcastErrorInfo, errorInfo: React.ErrorInfo) => void;
  onRetry?: () => void;
  onRegenerate?: () => void;
  onChangeSettings?: () => void;
  onGoHome?: () => void;
  context?: PodcastOperationContext;
  showRecoveryOptions?: boolean;
}

export interface PodcastErrorFallbackProps {
  error: Error;
  resetError: () => void;
  onRegenerate?: () => void;
  onChangeSettings?: () => void;
  context?: PodcastOperationContext;
  compact?: boolean;
}

/**
 * Specialized error display components for different error scenarios
 * Handles generation errors, playback errors, and network issues
 */
export {
  PodcastErrorDisplay,
  PodcastGenerationError,
  PodcastPlaybackError,
  PodcastNetworkError
} from './podcast-error-components';

// Note: Error component props are not exported from the component file
export interface PodcastErrorDisplayProps {
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

export interface PodcastGenerationErrorProps {
  error: PodcastErrorInfo | Error | string;
  onRetry?: () => Promise<void>;
  onRegenerate?: () => void;
  onChangeSettings?: () => void;
  isRetrying?: boolean;
  retryCount?: number;
  progress?: number;
}

export interface PodcastPlaybackErrorProps {
  error: PodcastErrorInfo | Error | string;
  onRetry?: () => void;
  onDownload?: () => void;
  audioUrl?: string;
}

export interface PodcastNetworkErrorProps {
  onRetry?: () => void;
  isRetrying?: boolean;
}

// =============================================================================
// COMPONENT PATTERNS & INTERFACES
// =============================================================================

/**
 * Common prop patterns used across podcast components
 */
export interface BasePodcastComponentProps {
  /** Optional CSS class name for styling */
  className?: string;
  /** Whether the component is in a loading state */
  loading?: boolean;
  /** Whether the component is disabled */
  disabled?: boolean;
}

export interface PodcastComponentWithActions extends BasePodcastComponentProps {
  /** Callback for regenerating the podcast */
  onRegenerateClick?: () => void;
  /** Callback for downloading the podcast audio */
  onDownloadClick?: () => void;
  /** Callback for viewing the transcript */
  onViewTranscriptClick?: () => void;
  /** Callback for deleting the podcast */
  onDeleteClick?: () => void;
}

export interface CompactPodcastComponentProps extends BasePodcastComponentProps {
  /** Whether to render in compact mode */
  compact?: boolean;
}

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

/**
 * Re-export commonly used types from the podcast types module
 * for convenience when working with podcast components
 */
export type {
  Podcast,
  PodcastMode,
  PodcastStatus,
  QualityPreset,
  DurationScale,
  PodcastGenerationForm,
  PodcastGenerationOptions,
  VoiceSettings,
  TextChunk,
  TranscriptSyncData,
  TimestampData
} from '@/lib/types/podcast';

/**
 * Re-export audio player types for component interfaces
 */
export type {
  AudioPlayerState,
  AudioPlayerControls
} from '@/lib/hooks/use-audio-player';

/**
 * Re-export error types for error handling components
 */
export type {
  PodcastErrorInfo,
  PodcastOperationContext
} from '@/lib/types/podcast-error.types';

// =============================================================================
// COMPONENT COMPOSITION HELPERS
// =============================================================================

/**
 * Default component configurations for consistent usage patterns
 */
export const PODCAST_COMPONENT_DEFAULTS = {
  /** Default skeleton variant for loading states */
  skeletonVariant: 'generator' as const,
  /** Default error display variant */
  errorVariant: 'default' as const,
  /** Default compact mode setting */
  compact: false,
  /** Default loading state */
  loading: false,
  /** Default disabled state */
  disabled: false,
} as const;

/**
 * Component size variants for consistent sizing
 */
export const PODCAST_COMPONENT_SIZES = {
  compact: {
    iconSize: 'h-4 w-4',
    buttonSize: 'sm',
    cardPadding: 'p-3',
  },
  default: {
    iconSize: 'h-5 w-5',
    buttonSize: 'default',
    cardPadding: 'p-4',
  },
  large: {
    iconSize: 'h-6 w-6',
    buttonSize: 'lg',
    cardPadding: 'p-6',
  },
} as const;

// =============================================================================
// ACCESSIBILITY HELPERS
// =============================================================================

/**
 * ARIA labels and accessibility props for podcast components
 */
export const PODCAST_ACCESSIBILITY = {
  labels: {
    playButton: 'Play podcast',
    pauseButton: 'Pause podcast',
    seekBackward: 'Skip backward 15 seconds',
    seekForward: 'Skip forward 15 seconds',
    volumeControl: 'Adjust volume',
    transcriptViewer: 'Podcast transcript',
    regenerateButton: 'Regenerate podcast',
    downloadButton: 'Download podcast audio',
    deleteButton: 'Delete podcast',
  },
  descriptions: {
    audioPlayer: 'Audio player for podcast playback with transcript synchronization',
    transcriptSync: 'Synchronized transcript that highlights text as audio plays',
    generationForm: 'Form to configure podcast generation settings',
    errorDisplay: 'Error message with recovery options',
  },
} as const;

// =============================================================================
// TESTING UTILITIES
// =============================================================================

/**
 * Test IDs for reliable component testing
 */
export const PODCAST_TEST_IDS = {
  generator: 'podcast-generator',
  player: 'podcast-player',
  layout: 'podcast-layout',
  form: 'podcast-form',
  controls: 'podcast-controls',
  transcript: 'transcript-viewer',
  actions: 'podcast-actions',
  errorBoundary: 'podcast-error-boundary',
  skeleton: 'podcast-skeleton',
} as const;

/**
 * Mock data generators for testing podcast components
 */
export const createMockPodcast = (overrides: Partial<Podcast> = {}): Podcast => ({
  id: 'mock-podcast-id',
  noteId: 'mock-note-id',
  userId: 'mock-user-id',
  mode: 'CONVERSATION',
  hostVoiceId: 'mock-host-voice',
  guestVoiceId: 'mock-guest-voice',
  qualityPreset: 'HIGH',
  durationScale: 'DEFAULT',
  status: 'COMPLETED',
  title: 'Mock Podcast',
  audioUrl: 'https://example.com/mock-audio.mp3',
  duration: 600, // 10 minutes
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// =============================================================================
// VERSION & METADATA
// =============================================================================

/**
 * Component library metadata
 */
export const PODCAST_COMPONENTS_VERSION = '1.0.0';
export const PODCAST_COMPONENTS_LAST_UPDATED = '2024-10-11';

/**
 * Feature flags for component functionality
 */
export const PODCAST_FEATURE_FLAGS = {
  /** Enable real-time transcript synchronization */
  enableRealtimeSync: true,
  /** Enable automatic retry for failed operations */
  enableAutoRetry: true,
  /** Enable enhanced error reporting */
  enableEnhancedErrors: true,
  /** Enable accessibility features */
  enableA11y: true,
} as const;