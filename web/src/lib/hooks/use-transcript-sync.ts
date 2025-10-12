import { useState, useEffect, useCallback, useRef } from 'react';
import type { 
  TextChunk, 
  TranscriptSyncData, 
  TranscriptSyncState 
} from '@/lib/types/podcast';
import {
  processTranscriptForSync,
  findActiveChunk,
  getHighlightedText,
  calculateTranscriptProgress,
  enhanceTranscriptFormatting,
  extractTranscriptTopics,
  debounce,
  validateTranscriptSyncData
} from '@/lib/utils/transcript-sync';

interface UseTranscriptSyncOptions {
  transcript: string;
  audioDuration?: number;
  syncMode?: 'realtime' | 'simulated';
  autoEnhance?: boolean;
  enableTopicExtraction?: boolean;
}

interface UseTranscriptSyncReturn {
  // State
  syncData: TranscriptSyncData | null;
  syncState: TranscriptSyncState;
  isProcessing: boolean;
  error: string | null;
  
  // Computed values
  highlightedText: string;
  progress: number;
  activeChunk: TextChunk | null;
  topics: Array<{ topic: string; timestamp: number; chunkId: string }>;
  
  // Actions
  updateCurrentTime: (time: number) => void;
  setSyncMode: (mode: 'realtime' | 'simulated') => void;
  jumpToChunk: (chunkId: string) => number | null;
  jumpToTopic: (topicIndex: number) => number | null;
  reprocessTranscript: () => Promise<void>;
  enhanceTranscript: () => Promise<void>;
  
  // Utilities
  getChunkAtTime: (time: number) => TextChunk | null;
  getTimeForChunk: (chunkId: string) => number | null;
}

/**
 * Hook for managing transcript synchronization with audio playback
 * Supports both real-time highlighting and simulated progressive text reveal
 */
export function useTranscriptSync({
  transcript,
  audioDuration,
  syncMode = 'simulated',
  autoEnhance = false,
  enableTopicExtraction = true,
}: UseTranscriptSyncOptions): UseTranscriptSyncReturn {
  // State
  const [syncData, setSyncData] = useState<TranscriptSyncData | null>(null);
  const [syncState, setSyncState] = useState<TranscriptSyncState>({
    highlightedText: '',
    currentPosition: 0,
    syncMode,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topics, setTopics] = useState<Array<{ topic: string; timestamp: number; chunkId: string }>>([]);
  
  // Refs for performance optimization
  const processedTranscriptRef = useRef<string>('');
  const currentTimeRef = useRef<number>(0);
  const activeChunkRef = useRef<TextChunk | null>(null);

  // Debounced update function for performance
  const debouncedUpdateHighlight = useCallback(
    debounce((time: number, chunks: TextChunk[], mode: 'realtime' | 'simulated') => {
      const activeChunk = findActiveChunk(chunks, time, mode);
      const highlightedText = getHighlightedText(chunks, activeChunk, time, mode);
      const progress = calculateTranscriptProgress(chunks, time);
      
      activeChunkRef.current = activeChunk;
      setSyncState(prev => ({
        ...prev,
        highlightedText,
        currentPosition: time,
        syncMode: mode,
      }));
    }, 100),
    []
  );

  // Process transcript when it changes
  useEffect(() => {
    if (!transcript || transcript === processedTranscriptRef.current) {
      return;
    }

    processedTranscriptRef.current = transcript;
    setIsProcessing(true);
    setError(null);

    const processTranscript = async () => {
      try {
        let processedText = transcript;
        
        // Enhance transcript if requested
        if (autoEnhance) {
          processedText = await enhanceTranscriptFormatting(transcript);
        }

        // Process transcript for synchronization
        const syncData = await processTranscriptForSync(processedText, audioDuration);
        
        if (!validateTranscriptSyncData(syncData)) {
          throw new Error('Invalid transcript sync data structure');
        }

        setSyncData(syncData);

        // Extract topics if enabled
        if (enableTopicExtraction && syncData.chunks.length > 0) {
          try {
            const extractedTopics = await extractTranscriptTopics(syncData.chunks);
            setTopics(extractedTopics);
          } catch (topicError) {
            console.warn('Failed to extract topics:', topicError);
            setTopics([]);
          }
        }

        // Initialize with first chunk
        if (syncData.chunks.length > 0) {
          const initialHighlight = getHighlightedText(
            syncData.chunks, 
            null, 
            0, 
            syncMode
          );
          setSyncState(prev => ({
            ...prev,
            highlightedText: initialHighlight,
          }));
        }
      } catch (err) {
        console.error('Error processing transcript:', err);
        setError(err instanceof Error ? err.message : 'Failed to process transcript');
        
        // Fallback to basic sync data
        setSyncData({
          text: transcript,
          chunks: [{
            id: 'fallback_chunk',
            text: transcript,
            speaker: undefined,
          }],
          timestamps: undefined,
        });
      } finally {
        setIsProcessing(false);
      }
    };

    processTranscript();
  }, [transcript, audioDuration, syncMode, autoEnhance, enableTopicExtraction]);

  // Update current time and highlighting
  const updateCurrentTime = useCallback((time: number) => {
    currentTimeRef.current = time;
    
    if (syncData?.chunks) {
      debouncedUpdateHighlight(time, syncData.chunks, syncState.syncMode);
    }
  }, [syncData, syncState.syncMode, debouncedUpdateHighlight]);

  // Change sync mode
  const setSyncMode = useCallback((mode: 'realtime' | 'simulated') => {
    setSyncState(prev => ({ ...prev, syncMode: mode }));
    
    // Re-process highlighting with new mode
    if (syncData?.chunks) {
      const activeChunk = findActiveChunk(syncData.chunks, currentTimeRef.current, mode);
      const highlightedText = getHighlightedText(
        syncData.chunks, 
        activeChunk, 
        currentTimeRef.current, 
        mode
      );
      
      setSyncState(prev => ({
        ...prev,
        highlightedText,
        syncMode: mode,
      }));
    }
  }, [syncData]);

  // Jump to specific chunk
  const jumpToChunk = useCallback((chunkId: string): number | null => {
    if (!syncData?.chunks) return null;
    
    const chunk = syncData.chunks.find(c => c.id === chunkId);
    if (!chunk || chunk.startTime === undefined) return null;
    
    updateCurrentTime(chunk.startTime);
    return chunk.startTime;
  }, [syncData, updateCurrentTime]);

  // Jump to topic
  const jumpToTopic = useCallback((topicIndex: number): number | null => {
    if (topicIndex < 0 || topicIndex >= topics.length) return null;
    
    const topic = topics[topicIndex];
    updateCurrentTime(topic.timestamp);
    return topic.timestamp;
  }, [topics, updateCurrentTime]);

  // Reprocess transcript
  const reprocessTranscript = useCallback(async () => {
    processedTranscriptRef.current = ''; // Force reprocessing
    setIsProcessing(true);
    setError(null);
    
    try {
      const syncData = await processTranscriptForSync(transcript, audioDuration);
      setSyncData(syncData);
      
      if (enableTopicExtraction && syncData.chunks.length > 0) {
        const extractedTopics = await extractTranscriptTopics(syncData.chunks);
        setTopics(extractedTopics);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reprocess transcript');
    } finally {
      setIsProcessing(false);
    }
  }, [transcript, audioDuration, enableTopicExtraction]);

  // Enhance transcript
  const enhanceTranscript = useCallback(async () => {
    if (!transcript) return;
    
    setIsProcessing(true);
    try {
      const enhanced = await enhanceTranscriptFormatting(transcript);
      const syncData = await processTranscriptForSync(enhanced, audioDuration);
      setSyncData(syncData);
      
      if (enableTopicExtraction && syncData.chunks.length > 0) {
        const extractedTopics = await extractTranscriptTopics(syncData.chunks);
        setTopics(extractedTopics);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enhance transcript');
    } finally {
      setIsProcessing(false);
    }
  }, [transcript, audioDuration, enableTopicExtraction]);

  // Utility functions
  const getChunkAtTime = useCallback((time: number): TextChunk | null => {
    if (!syncData?.chunks) return null;
    return findActiveChunk(syncData.chunks, time, syncState.syncMode);
  }, [syncData, syncState.syncMode]);

  const getTimeForChunk = useCallback((chunkId: string): number | null => {
    if (!syncData?.chunks) return null;
    
    const chunk = syncData.chunks.find(c => c.id === chunkId);
    return chunk?.startTime ?? null;
  }, [syncData]);

  // Computed values
  const highlightedText = syncState.highlightedText || transcript;
  const progress = syncData?.chunks ? calculateTranscriptProgress(syncData.chunks, currentTimeRef.current) : 0;
  const activeChunk = activeChunkRef.current;

  return {
    // State
    syncData,
    syncState,
    isProcessing,
    error,
    
    // Computed values
    highlightedText,
    progress,
    activeChunk,
    topics,
    
    // Actions
    updateCurrentTime,
    setSyncMode,
    jumpToChunk,
    jumpToTopic,
    reprocessTranscript,
    enhanceTranscript,
    
    // Utilities
    getChunkAtTime,
    getTimeForChunk,
  };
}

/**
 * Simplified hook for basic transcript highlighting
 */
export function useSimpleTranscriptSync(transcript: string, currentTime: number) {
  const [highlightedText, setHighlightedText] = useState(transcript);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!transcript) return;

    setIsProcessing(true);
    
    const processSimple = async () => {
      try {
        const syncData = await processTranscriptForSync(transcript);
        const activeChunk = findActiveChunk(syncData.chunks, currentTime, 'simulated');
        const highlighted = getHighlightedText(syncData.chunks, activeChunk, currentTime, 'simulated');
        setHighlightedText(highlighted);
      } catch (error) {
        console.error('Error in simple transcript sync:', error);
        setHighlightedText(transcript);
      } finally {
        setIsProcessing(false);
      }
    };

    processSimple();
  }, [transcript, currentTime]);

  return {
    highlightedText,
    isProcessing,
  };
}