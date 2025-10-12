// Podcast-related TypeScript interfaces and types
// Re-export Prisma enums and types for consistency
export { PodcastMode, PodcastStatus, QualityPreset, DurationScale } from '@prisma/client';
export type { Podcast, Note } from '@prisma/client';

// Import types for use in interfaces below
import { PodcastMode, PodcastStatus, QualityPreset, DurationScale, Podcast, Note } from '@prisma/client';

// Extended Podcast type with related note data
export type PodcastWithNote = Podcast & {
  note?: Note | null;
};

// Podcast generation options for API requests
export interface PodcastGenerationOptions {
  mode: PodcastMode;
  voiceSettings: VoiceSettings;
  qualityPreset: QualityPreset;
  durationScale: DurationScale;
  language?: string;
  intro?: string;
  outro?: string;
}

// Voice settings for podcast generation
export interface VoiceSettings {
  hostVoiceId: string;
  guestVoiceId?: string; // Only for conversation mode
}

// Podcast generation form data
export interface PodcastGenerationForm {
  mode: 'conversation' | 'bulletin';
  hostVoiceId: string;
  guestVoiceId?: string;
  qualityPreset: 'standard' | 'high' | 'highest' | 'ultra' | 'ultra_lossless';
  durationScale: 'short' | 'default' | 'long';
  language?: string;
  intro?: string;
  outro?: string;
}

// API response types
export interface PodcastGenerationResponse {
  success: boolean;
  podcast?: Podcast;
  error?: string;
  code?: string;
}

// ElevenLabs webhook payload types
export interface ElevenLabsWebhookPayload {
  event_type: 'generation_started' | 'generation_completed' | 'generation_failed';
  project_id: string;
  data: any;
  timestamp: string;
}

export interface GenerationStartedPayload {
  project_id: string;
  status: string;
}

export interface GenerationCompletedPayload {
  project_id: string;
  audio_url: string;
  duration?: number;
  file_size?: number;
  metadata?: any;
}

export interface GenerationFailedPayload {
  project_id: string;
  error_message: string;
  error_code?: string;
}

// Audio player state interfaces
export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
}

// Transcript synchronization interfaces
export interface TranscriptSyncState {
  highlightedText: string;
  currentPosition: number;
  syncMode: 'realtime' | 'simulated';
}

export interface TranscriptSyncData {
  text: string;
  timestamps?: TimestampData[];
  chunks: TextChunk[];
}

export interface TimestampData {
  start: number;
  end: number;
  text: string;
}

export interface TextChunk {
  id: string;
  text: string;
  startTime?: number;
  endTime?: number;
  speaker?: string;
}

// Audio metadata for storage
export interface AudioMetadata {
  podcastId: string;
  noteId: string;
  userId: string;
  title: string;
  duration?: number;
}

// Error handling interfaces
export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  retryable: boolean;
  retryAfter?: number;
}