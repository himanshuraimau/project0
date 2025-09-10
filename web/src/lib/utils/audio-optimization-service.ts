/**
 * Audio optimization service for podcast playback performance
 * Handles preloading, compression, and streaming optimizations
 */
export class AudioOptimizationService {
  private audioCache = new Map<string, AudioBuffer>();
  private preloadQueue = new Set<string>();
  private readonly maxCacheSize = 50 * 1024 * 1024; // 50MB cache limit
  private currentCacheSize = 0;

  /**
   * Preload audio for better playback performance
   */
  async preloadAudio(audioUrl: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    if (this.audioCache.has(audioUrl) || this.preloadQueue.has(audioUrl)) {
      return; // Already cached or being loaded
    }

    this.preloadQueue.add(audioUrl);

    try {
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      
      // Check cache size limit
      if (this.currentCacheSize + arrayBuffer.byteLength > this.maxCacheSize) {
        this.evictLeastRecentlyUsed(arrayBuffer.byteLength);
      }

      // Store in cache with metadata
      const audioBuffer: AudioBuffer = {
        data: arrayBuffer,
        url: audioUrl,
        size: arrayBuffer.byteLength,
        lastAccessed: Date.now(),
        priority
      };

      this.audioCache.set(audioUrl, audioBuffer);
      this.currentCacheSize += arrayBuffer.byteLength;
    } catch (error) {
      console.error(`Failed to preload audio ${audioUrl}:`, error);
    } finally {
      this.preloadQueue.delete(audioUrl);
    }
  }

  /**
   * Get cached audio buffer
   */
  getCachedAudio(audioUrl: string): ArrayBuffer | null {
    const cached = this.audioCache.get(audioUrl);
    if (cached) {
      cached.lastAccessed = Date.now();
      return cached.data;
    }
    return null;
  }

  /**
   * Preload podcast segments for seamless playback
   */
  async preloadPodcastSegments(segments: PodcastSegment[], currentIndex: number = 0): Promise<void> {
    const preloadPromises: Promise<void>[] = [];

    // Preload current segment with high priority
    if (segments[currentIndex]?.audioUrl) {
      preloadPromises.push(
        this.preloadAudio(segments[currentIndex].audioUrl!, 'high')
      );
    }

    // Preload next 2 segments with medium priority
    for (let i = 1; i <= 2; i++) {
      const nextIndex = currentIndex + i;
      if (segments[nextIndex]?.audioUrl) {
        preloadPromises.push(
          this.preloadAudio(segments[nextIndex].audioUrl!, 'medium')
        );
      }
    }

    // Preload previous segment with low priority
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0 && segments[prevIndex]?.audioUrl) {
      preloadPromises.push(
        this.preloadAudio(segments[prevIndex].audioUrl!, 'low')
      );
    }

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Generate optimized waveform data for visualization
   */
  async generateWaveformData(audioUrl: string, samples: number = 1000): Promise<WaveformData> {
    try {
      // Check if we have cached waveform data
      const cacheKey = `waveform:${audioUrl}:${samples}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached as WaveformData;
      }

      // Get audio buffer
      let audioBuffer = this.getCachedAudio(audioUrl);
      if (!audioBuffer) {
        const response = await fetch(audioUrl);
        audioBuffer = await response.arrayBuffer();
      }

      // Create audio context for processing
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decodedAudio = await audioContext.decodeAudioData(audioBuffer.slice(0));

      // Extract audio data
      const channelData = decodedAudio.getChannelData(0);
      const samplesPerPixel = Math.floor(channelData.length / samples);
      
      const waveformData: number[] = [];
      
      for (let i = 0; i < samples; i++) {
        const start = i * samplesPerPixel;
        const end = Math.min(start + samplesPerPixel, channelData.length);
        
        let max = 0;
        for (let j = start; j < end; j++) {
          max = Math.max(max, Math.abs(channelData[j]));
        }
        
        waveformData.push(max);
      }

      const result: WaveformData = {
        data: waveformData,
        duration: decodedAudio.duration,
        sampleRate: decodedAudio.sampleRate,
        samples
      };

      // Cache the result
      this.setInCache(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Failed to generate waveform data:', error);
      // Return empty waveform as fallback
      return {
        data: new Array(samples).fill(0),
        duration: 0,
        sampleRate: 44100,
        samples
      };
    }
  }

  /**
   * Optimize audio loading with progressive enhancement
   */
  async optimizeAudioLoading(audioElement: HTMLAudioElement, audioUrl: string): Promise<void> {
    try {
      // Check if audio is cached
      const cachedBuffer = this.getCachedAudio(audioUrl);
      if (cachedBuffer) {
        // Create blob URL from cached buffer for faster loading
        const blob = new Blob([cachedBuffer], { type: 'audio/mpeg' });
        const blobUrl = URL.createObjectURL(blob);
        audioElement.src = blobUrl;
        
        // Clean up blob URL when audio is loaded
        audioElement.addEventListener('loadeddata', () => {
          URL.revokeObjectURL(blobUrl);
        }, { once: true });
      } else {
        // Use original URL and preload in background
        audioElement.src = audioUrl;
        this.preloadAudio(audioUrl, 'medium');
      }

      // Set optimal loading attributes
      audioElement.preload = 'metadata';
      audioElement.crossOrigin = 'anonymous';
    } catch (error) {
      console.error('Failed to optimize audio loading:', error);
      // Fallback to standard loading
      audioElement.src = audioUrl;
    }
  }

  /**
   * Implement audio streaming for large files
   */
  async createAudioStream(audioUrl: string): Promise<ReadableStream<Uint8Array> | null> {
    try {
      const response = await fetch(audioUrl);
      if (!response.ok || !response.body) {
        throw new Error('Failed to create audio stream');
      }

      return response.body;
    } catch (error) {
      console.error('Failed to create audio stream:', error);
      return null;
    }
  }

  /**
   * Optimize audio for different connection speeds
   */
  async getOptimizedAudioUrl(baseUrl: string, connectionSpeed: 'slow' | 'medium' | 'fast'): Promise<string> {
    // In a real implementation, you might have different quality versions
    // For now, return the base URL but this could be extended to serve
    // different bitrates based on connection speed
    
    const qualityParams = {
      slow: '?quality=low&bitrate=64',
      medium: '?quality=medium&bitrate=128',
      fast: '?quality=high&bitrate=192'
    };

    // Check if the URL already has parameters
    const separator = baseUrl.includes('?') ? '&' : '';
    return `${baseUrl}${separator}${qualityParams[connectionSpeed]}`;
  }

  /**
   * Detect user's connection speed
   */
  detectConnectionSpeed(): 'slow' | 'medium' | 'fast' {
    // Use Network Information API if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const effectiveType = connection.effectiveType;
      
      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          return 'slow';
        case '3g':
          return 'medium';
        case '4g':
        default:
          return 'fast';
      }
    }

    // Fallback to medium quality
    return 'medium';
  }

  /**
   * Prefetch next audio segments based on playback position
   */
  async prefetchNextSegments(
    segments: PodcastSegment[],
    currentTime: number,
    lookAheadSeconds: number = 30
  ): Promise<void> {
    const prefetchPromises: Promise<void>[] = [];

    for (const segment of segments) {
      if (segment.startTime && segment.audioUrl) {
        const timeUntilSegment = segment.startTime - currentTime;
        
        // Prefetch segments that will play within the look-ahead window
        if (timeUntilSegment > 0 && timeUntilSegment <= lookAheadSeconds) {
          prefetchPromises.push(this.preloadAudio(segment.audioUrl, 'medium'));
        }
      }
    }

    await Promise.allSettled(prefetchPromises);
  }

  /**
   * Clean up cached audio data
   */
  clearCache(): void {
    this.audioCache.clear();
    this.currentCacheSize = 0;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): AudioCacheStats {
    return {
      totalEntries: this.audioCache.size,
      totalSizeBytes: this.currentCacheSize,
      maxSizeBytes: this.maxCacheSize,
      utilizationPercentage: (this.currentCacheSize / this.maxCacheSize) * 100,
      entries: Array.from(this.audioCache.entries()).map(([url, buffer]) => ({
        url,
        sizeBytes: buffer.size,
        lastAccessed: buffer.lastAccessed,
        priority: buffer.priority
      }))
    };
  }

  /**
   * Evict least recently used items to make space
   */
  private evictLeastRecentlyUsed(requiredSpace: number): void {
    const entries = Array.from(this.audioCache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    let freedSpace = 0;
    for (const [url, buffer] of entries) {
      this.audioCache.delete(url);
      this.currentCacheSize -= buffer.size;
      freedSpace += buffer.size;

      if (freedSpace >= requiredSpace) {
        break;
      }
    }
  }

  /**
   * Generic cache methods for other data types
   */
  private getFromCache(key: string): any {
    // This would integrate with the main cache service
    // For now, return null to indicate no cache hit
    return null;
  }

  private setInCache(key: string, data: any): void {
    // This would integrate with the main cache service
    // For now, do nothing
  }
}

/**
 * Interfaces for type safety
 */
interface AudioBuffer {
  data: ArrayBuffer;
  url: string;
  size: number;
  lastAccessed: number;
  priority: 'high' | 'medium' | 'low';
}

export interface WaveformData {
  data: number[];
  duration: number;
  sampleRate: number;
  samples: number;
}

interface PodcastSegment {
  audioUrl?: string;
  startTime?: number;
  endTime?: number;
}

export interface AudioCacheStats {
  totalEntries: number;
  totalSizeBytes: number;
  maxSizeBytes: number;
  utilizationPercentage: number;
  entries: Array<{
    url: string;
    sizeBytes: number;
    lastAccessed: number;
    priority: 'high' | 'medium' | 'low';
  }>;
}

// Export singleton instance
export const audioOptimizationService = new AudioOptimizationService();