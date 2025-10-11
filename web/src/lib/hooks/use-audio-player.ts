import { useState, useEffect, useRef, useCallback } from 'react';
import {
  AudioMetadata,
  AudioControlOptions,
  getAudioMetadata,
  applyAudioControls,
  validateVolume,
  validatePlaybackRate,
  validateSeekTime,
  createAudioElement,
  SEEK_AMOUNTS,
} from '../utils/audio-utils';

export interface AudioPlayerState {
  // Playback state
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  isEnded: boolean;
  
  // Time and progress
  currentTime: number;
  duration: number;
  bufferedPercentage: number;
  progressPercentage: number;
  
  // Audio settings
  volume: number;
  playbackRate: number;
  isMuted: boolean;
  
  // Ready state
  isReady: boolean;
  readyState: number;
  
  // Error state
  error: string | null;
}

export interface AudioPlayerControls {
  // Playback controls
  play: () => Promise<void>;
  pause: () => void;
  toggle: () => Promise<void>;
  stop: () => void;
  
  // Seeking controls
  seek: (time: number) => void;
  seekBy: (seconds: number) => void;
  seekToPercentage: (percentage: number) => void;
  
  // Volume controls
  setVolume: (volume: number) => void;
  mute: () => void;
  unmute: () => void;
  toggleMute: () => void;
  
  // Playback rate controls
  setPlaybackRate: (rate: number) => void;
  increaseSpeed: () => void;
  decreaseSpeed: () => void;
  
  // Utility controls
  restart: () => void;
  skipToEnd: () => void;
}

export interface UseAudioPlayerOptions {
  autoPlay?: boolean;
  loop?: boolean;
  volume?: number;
  playbackRate?: number;
  preload?: 'none' | 'metadata' | 'auto';
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onLoadStart?: () => void;
  onLoadedData?: () => void;
  onError?: (error: string) => void;
}

const initialState: AudioPlayerState = {
  isPlaying: false,
  isPaused: true,
  isLoading: false,
  isEnded: false,
  currentTime: 0,
  duration: 0,
  bufferedPercentage: 0,
  progressPercentage: 0,
  volume: 1,
  playbackRate: 1,
  isMuted: false,
  isReady: false,
  readyState: 0,
  error: null,
};

export function useAudioPlayer(
  src: string | null,
  options: UseAudioPlayerOptions = {}
) {
  const [state, setState] = useState<AudioPlayerState>(initialState);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousVolumeRef = useRef<number>(1);
  
  const {
    autoPlay = false,
    loop = false,
    volume = 1,
    playbackRate = 1,
    preload = 'metadata',
    onPlay,
    onPause,
    onEnded,
    onTimeUpdate,
    onLoadStart,
    onLoadedData,
    onError,
  } = options;

  // Update state from audio element
  const updateState = useCallback(() => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    const metadata = getAudioMetadata(audio);
    
    setState(prevState => ({
      ...prevState,
      currentTime: metadata.currentTime,
      duration: metadata.duration,
      volume: metadata.volume,
      playbackRate: metadata.playbackRate,
      isMuted: metadata.muted,
      isPlaying: !metadata.paused && !metadata.ended,
      isPaused: metadata.paused,
      isEnded: metadata.ended,
      readyState: metadata.readyState,
      isReady: metadata.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA,
      progressPercentage: metadata.duration > 0 ? (metadata.currentTime / metadata.duration) * 100 : 0,
      bufferedPercentage: metadata.buffered && metadata.duration > 0 
        ? (metadata.buffered.length > 0 ? (metadata.buffered.end(metadata.buffered.length - 1) / metadata.duration) * 100 : 0)
        : 0,
    }));
  }, []);

  // Initialize audio element
  useEffect(() => {
    if (!src) {
      audioRef.current = null;
      setState(initialState);
      return;
    }

    const audio = createAudioElement(src);
    audio.loop = loop;
    audio.preload = preload;
    audioRef.current = audio;

    // Set initial volume and playback rate
    applyAudioControls(audio, { volume, playbackRate });

    // Event listeners
    const handleLoadStart = () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      onLoadStart?.();
    };

    const handleLoadedData = () => {
      setState(prev => ({ ...prev, isLoading: false }));
      updateState();
      onLoadedData?.();
      
      if (autoPlay) {
        audio.play().catch(error => {
          setState(prev => ({ ...prev, error: error.message }));
          onError?.(error.message);
        });
      }
    };

    const handlePlay = () => {
      updateState();
      onPlay?.();
    };

    const handlePause = () => {
      updateState();
      onPause?.();
    };

    const handleTimeUpdate = () => {
      updateState();
      onTimeUpdate?.(audio.currentTime);
    };

    const handleEnded = () => {
      updateState();
      onEnded?.();
    };

    const handleError = () => {
      const errorMessage = audio.error?.message || 'Audio playback error';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      onError?.(errorMessage);
    };

    const handleProgress = () => {
      updateState();
    };

    // Attach event listeners
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('progress', handleProgress);

    return () => {
      // Cleanup event listeners
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('progress', handleProgress);
      
      // Pause and cleanup
      audio.pause();
      audio.src = '';
    };
  }, [src, loop, preload, volume, playbackRate, autoPlay, updateState, onPlay, onPause, onEnded, onTimeUpdate, onLoadStart, onLoadedData, onError]);

  // Control functions
  const play = useCallback(async () => {
    if (!audioRef.current) return;
    
    try {
      await audioRef.current.play();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to play audio';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [onError]);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
  }, []);

  const toggle = useCallback(async () => {
    if (state.isPlaying) {
      pause();
    } else {
      await play();
    }
  }, [state.isPlaying, play, pause]);

  const stop = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }, []);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    const validTime = validateSeekTime(time, audioRef.current.duration);
    audioRef.current.currentTime = validTime;
  }, []);

  const seekBy = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    const newTime = audioRef.current.currentTime + seconds;
    seek(newTime);
  }, [seek]);

  const seekToPercentage = useCallback((percentage: number) => {
    if (!audioRef.current) return;
    const time = (percentage / 100) * audioRef.current.duration;
    seek(time);
  }, [seek]);

  const setVolume = useCallback((newVolume: number) => {
    if (!audioRef.current) return;
    const validVolume = validateVolume(newVolume);
    audioRef.current.volume = validVolume;
    if (validVolume > 0) {
      previousVolumeRef.current = validVolume;
    }
  }, []);

  const mute = useCallback(() => {
    if (!audioRef.current) return;
    previousVolumeRef.current = audioRef.current.volume;
    audioRef.current.muted = true;
  }, []);

  const unmute = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = false;
    if (audioRef.current.volume === 0) {
      audioRef.current.volume = previousVolumeRef.current;
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (state.isMuted) {
      unmute();
    } else {
      mute();
    }
  }, [state.isMuted, mute, unmute]);

  const setPlaybackRate = useCallback((rate: number) => {
    if (!audioRef.current) return;
    const validRate = validatePlaybackRate(rate);
    audioRef.current.playbackRate = validRate;
  }, []);

  const increaseSpeed = useCallback(() => {
    const newRate = Math.min(state.playbackRate + 0.25, 3);
    setPlaybackRate(newRate);
  }, [state.playbackRate, setPlaybackRate]);

  const decreaseSpeed = useCallback(() => {
    const newRate = Math.max(state.playbackRate - 0.25, 0.25);
    setPlaybackRate(newRate);
  }, [state.playbackRate, setPlaybackRate]);

  const restart = useCallback(() => {
    seek(0);
  }, [seek]);

  const skipToEnd = useCallback(() => {
    if (!audioRef.current) return;
    seek(audioRef.current.duration);
  }, [seek]);

  const controls: AudioPlayerControls = {
    play,
    pause,
    toggle,
    stop,
    seek,
    seekBy,
    seekToPercentage,
    setVolume,
    mute,
    unmute,
    toggleMute,
    setPlaybackRate,
    increaseSpeed,
    decreaseSpeed,
    restart,
    skipToEnd,
  };

  return {
    state,
    controls,
    audioRef,
  };
}