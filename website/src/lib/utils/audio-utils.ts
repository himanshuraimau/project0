/**
 * Audio processing and control utilities for podcast playback
 */

export interface AudioMetadata {
  duration: number;
  currentTime: number;
  buffered: TimeRanges | null;
  seekable: TimeRanges | null;
  volume: number;
  playbackRate: number;
  muted: boolean;
  ended: boolean;
  paused: boolean;
  readyState: number;
}

export interface AudioControlOptions {
  volume?: number;
  playbackRate?: number;
  currentTime?: number;
  muted?: boolean;
}

/**
 * Format time in seconds to MM:SS or HH:MM:SS format
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Convert time string (MM:SS or HH:MM:SS) to seconds
 */
export function parseTimeToSeconds(timeString: string): number {
  const parts = timeString.split(':').map(part => parseInt(part, 10));
  
  if (parts.length === 2) {
    // MM:SS format
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  } else if (parts.length === 3) {
    // HH:MM:SS format
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }
  
  return 0;
}

/**
 * Calculate buffered percentage for progress display
 */
export function calculateBufferedPercentage(buffered: TimeRanges | null, duration: number): number {
  if (!buffered || duration === 0) return 0;
  
  let bufferedEnd = 0;
  for (let i = 0; i < buffered.length; i++) {
    if (buffered.end(i) > bufferedEnd) {
      bufferedEnd = buffered.end(i);
    }
  }
  
  return Math.min((bufferedEnd / duration) * 100, 100);
}

/**
 * Calculate progress percentage
 */
export function calculateProgressPercentage(currentTime: number, duration: number): number {
  if (duration === 0) return 0;
  return Math.min((currentTime / duration) * 100, 100);
}

/**
 * Validate playback rate value
 */
export function validatePlaybackRate(rate: number): number {
  // Clamp between 0.25x and 3x speed
  return Math.max(0.25, Math.min(3, rate));
}

/**
 * Validate volume value
 */
export function validateVolume(volume: number): number {
  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, volume));
}

/**
 * Validate seek time
 */
export function validateSeekTime(time: number, duration: number): number {
  return Math.max(0, Math.min(time, duration));
}

/**
 * Get audio element metadata
 */
export function getAudioMetadata(audioElement: HTMLAudioElement): AudioMetadata {
  return {
    duration: audioElement.duration || 0,
    currentTime: audioElement.currentTime || 0,
    buffered: audioElement.buffered,
    seekable: audioElement.seekable,
    volume: audioElement.volume,
    playbackRate: audioElement.playbackRate,
    muted: audioElement.muted,
    ended: audioElement.ended,
    paused: audioElement.paused,
    readyState: audioElement.readyState,
  };
}

/**
 * Apply audio control options to audio element
 */
export function applyAudioControls(
  audioElement: HTMLAudioElement,
  options: AudioControlOptions
): void {
  if (options.volume !== undefined) {
    audioElement.volume = validateVolume(options.volume);
  }
  
  if (options.playbackRate !== undefined) {
    audioElement.playbackRate = validatePlaybackRate(options.playbackRate);
  }
  
  if (options.currentTime !== undefined) {
    audioElement.currentTime = validateSeekTime(options.currentTime, audioElement.duration);
  }
  
  if (options.muted !== undefined) {
    audioElement.muted = options.muted;
  }
}

/**
 * Check if audio element is ready for playback
 */
export function isAudioReady(audioElement: HTMLAudioElement): boolean {
  return audioElement.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA;
}

/**
 * Get human-readable audio ready state
 */
export function getReadyStateDescription(readyState: number): string {
  switch (readyState) {
    case HTMLMediaElement.HAVE_NOTHING:
      return 'No data available';
    case HTMLMediaElement.HAVE_METADATA:
      return 'Metadata loaded';
    case HTMLMediaElement.HAVE_CURRENT_DATA:
      return 'Current frame loaded';
    case HTMLMediaElement.HAVE_FUTURE_DATA:
      return 'Future data available';
    case HTMLMediaElement.HAVE_ENOUGH_DATA:
      return 'Ready to play';
    default:
      return 'Unknown state';
  }
}

/**
 * Create audio element with common settings
 */
export function createAudioElement(src: string): HTMLAudioElement {
  const audio = new Audio(src);
  audio.preload = 'metadata';
  audio.crossOrigin = 'anonymous';
  return audio;
}

/**
 * Common playback rates for audio players
 */
export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

/**
 * Audio player keyboard shortcuts
 */
export const KEYBOARD_SHORTCUTS = {
  PLAY_PAUSE: ' ', // Spacebar
  SEEK_BACKWARD: 'ArrowLeft',
  SEEK_FORWARD: 'ArrowRight',
  VOLUME_UP: 'ArrowUp',
  VOLUME_DOWN: 'ArrowDown',
  MUTE: 'm',
  SPEED_UP: '>',
  SPEED_DOWN: '<',
} as const;

/**
 * Default seek amounts in seconds
 */
export const SEEK_AMOUNTS = {
  SMALL: 5,
  MEDIUM: 15,
  LARGE: 30,
} as const;