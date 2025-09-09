// Podcast-related TypeScript interfaces and types

export interface Podcast {
  id: string;
  noteId: string;
  userId?: string;
  title: string;
  description?: string;
  language: string;
  durationPreset: 'short' | 'medium' | 'long';
  estimatedDuration?: number;
  actualDuration?: number;
  host1VoiceId: string;
  host1VoiceName: string;
  host2VoiceId: string;
  host2VoiceName: string;
  customInstructions?: string;
  audioUrl?: string;
  transcriptData?: TranscriptData;
  generationStatus: 'pending' | 'generating' | 'completed' | 'failed';
  generationError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PodcastSegment {
  id: number;
  podcastId: string;
  speaker: 'host1' | 'host2';
  content: string;
  startTime?: number;
  endTime?: number;
  audioUrl?: string;
  sequenceOrder: number;
  createdAt: Date;
}

export interface PodcastConfig {
  language: string;
  durationPreset: 'short' | 'medium' | 'long';
  host1VoiceId: string;
  host1VoiceName: string;
  host2VoiceId: string;
  host2VoiceName: string;
  customInstructions?: string;
}

export interface Voice {
  id: string;
  name: string;
  gender: 'male' | 'female';
  age: 'young' | 'middle_aged' | 'old';
  accent: string;
  description: string;
  previewUrl?: string;
}

export interface VoiceSettings {
  stability: number; // 0-1
  similarityBoost: number; // 0-1
  style: number; // 0-1
  useSpeakerBoost: boolean;
}

export interface PodcastScript {
  segments: ScriptSegment[];
  totalEstimatedDuration: number;
  metadata: {
    language: string;
    style: string;
    hosts: {
      host1: string;
      host2: string;
    };
  };
}

export interface ScriptSegment {
  speaker: 'host1' | 'host2';
  content: string;
  sequenceOrder: number;
  estimatedDuration?: number;
}

export interface AudioSegment {
  speaker: 'host1' | 'host2';
  audioBuffer: Buffer;
  duration: number;
  sequenceOrder: number;
}

export interface TranscriptData {
  segments: TranscriptSegment[];
  totalDuration: number;
  speakers: {
    host1: string;
    host2: string;
  };
}

export interface TranscriptSegment {
  speaker: 'host1' | 'host2';
  content: string;
  startTime: number;
  endTime: number;
  sequenceOrder: number;
}

export interface PodcastMetadata {
  title: string;
  description?: string;
  language: string;
  duration: number;
  hosts: {
    host1: { voiceId: string; voiceName: string };
    host2: { voiceId: string; voiceName: string };
  };
  customInstructions?: string;
}

export interface AudioMetadata {
  duration: number;
  sampleRate: number;
  channels: number;
  bitRate: number;
  format: string;
}

export interface WaveformData {
  peaks: number[];
  duration: number;
  sampleRate: number;
}

// API Request/Response types
export interface GeneratePodcastRequest {
  language: string;
  durationPreset: 'short' | 'medium' | 'long';
  host1VoiceId: string;
  host1VoiceName: string;
  host2VoiceId: string;
  host2VoiceName: string;
  customInstructions?: string;
}

export interface GeneratePodcastResponse {
  success: boolean;
  data?: {
    id: string;
    status: 'pending' | 'generating';
    estimatedDuration: number;
  };
  error?: string;
}

export interface ChatResponse {
  message: string;
  timestampReferences?: number[];
  relatedSegments?: TranscriptSegment[];
}

// Configuration validation types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Error class for podcast generation failures
export class PodcastGenerationError extends Error {
  public readonly code: 'SCRIPT_GENERATION_FAILED' | 'VOICE_SYNTHESIS_FAILED' | 'AUDIO_PROCESSING_FAILED' | 'STORAGE_FAILED' | 'CONFIGURATION_INVALID';
  public readonly details?: any;

  constructor(
    message: string,
    options: {
      name?: string;
      code: 'SCRIPT_GENERATION_FAILED' | 'VOICE_SYNTHESIS_FAILED' | 'AUDIO_PROCESSING_FAILED' | 'STORAGE_FAILED' | 'CONFIGURATION_INVALID';
      details?: any;
    }
  ) {
    super(message);
    this.name = options.name || 'PodcastGenerationError';
    this.code = options.code;
    this.details = options.details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PodcastGenerationError);
    }
  }
}