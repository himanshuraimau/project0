import { Voice, PodcastGenerationError } from '../types/podcast.types';

/**
 * Caching service for podcast-related data to improve performance
 * Implements in-memory caching with TTL and size limits
 */
export class PodcastCacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly maxCacheSize = 1000; // Maximum number of entries
  private readonly defaultTTL = 30 * 60 * 1000; // 30 minutes in milliseconds
  
  // Cache key prefixes for different data types
  private readonly prefixes = {
    voices: 'voices:',
    voicePreview: 'voice_preview:',
    audioMetadata: 'audio_metadata:',
    scriptGeneration: 'script_gen:',
    podcastData: 'podcast:',
    usageStats: 'usage_stats:'
  };

  /**
   * Cache voices data by language
   */
  async cacheVoices(language: string, voices: Voice[], ttl?: number): Promise<void> {
    const key = `${this.prefixes.voices}${language}`;
    this.set(key, voices, ttl);
  }

  /**
   * Get cached voices for a language
   */
  getCachedVoices(language: string): Voice[] | null {
    const key = `${this.prefixes.voices}${language}`;
    return this.get(key);
  }

  /**
   * Cache voice preview audio buffer
   */
  async cacheVoicePreview(voiceId: string, audioBuffer: Buffer, ttl?: number): Promise<void> {
    const key = `${this.prefixes.voicePreview}${voiceId}`;
    // Store as base64 to avoid buffer serialization issues
    const base64Audio = audioBuffer.toString('base64');
    this.set(key, base64Audio, ttl || 60 * 60 * 1000); // 1 hour for audio previews
  }

  /**
   * Get cached voice preview
   */
  getCachedVoicePreview(voiceId: string): Buffer | null {
    const key = `${this.prefixes.voicePreview}${voiceId}`;
    const base64Audio = this.get<string>(key);
    return base64Audio ? Buffer.from(base64Audio, 'base64') : null;
  }

  /**
   * Cache audio metadata for performance optimization
   */
  async cacheAudioMetadata(audioId: string, metadata: AudioMetadata, ttl?: number): Promise<void> {
    const key = `${this.prefixes.audioMetadata}${audioId}`;
    this.set(key, metadata, ttl);
  }

  /**
   * Get cached audio metadata
   */
  getCachedAudioMetadata(audioId: string): AudioMetadata | null {
    const key = `${this.prefixes.audioMetadata}${audioId}`;
    return this.get(key);
  }

  /**
   * Cache script generation results to avoid regeneration
   */
  async cacheScriptGeneration(contentHash: string, config: any, script: any, ttl?: number): Promise<void> {
    const key = `${this.prefixes.scriptGeneration}${contentHash}:${this.hashConfig(config)}`;
    this.set(key, script, ttl || 24 * 60 * 60 * 1000); // 24 hours for scripts
  }

  /**
   * Get cached script generation result
   */
  getCachedScriptGeneration(contentHash: string, config: any): any | null {
    const key = `${this.prefixes.scriptGeneration}${contentHash}:${this.hashConfig(config)}`;
    return this.get(key);
  }

  /**
   * Cache podcast data for quick retrieval
   */
  async cachePodcastData(podcastId: string, podcastData: any, ttl?: number): Promise<void> {
    const key = `${this.prefixes.podcastData}${podcastId}`;
    this.set(key, podcastData, ttl || 60 * 60 * 1000); // 1 hour for podcast data
  }

  /**
   * Get cached podcast data
   */
  getCachedPodcastData(podcastId: string): any | null {
    const key = `${this.prefixes.podcastData}${podcastId}`;
    return this.get(key);
  }

  /**
   * Cache usage statistics
   */
  async cacheUsageStats(userId: string, stats: any, ttl?: number): Promise<void> {
    const key = `${this.prefixes.usageStats}${userId}`;
    this.set(key, stats, ttl || 5 * 60 * 1000); // 5 minutes for usage stats
  }

  /**
   * Get cached usage statistics
   */
  getCachedUsageStats(userId: string): any | null {
    const key = `${this.prefixes.usageStats}${userId}`;
    return this.get(key);
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidateByPattern(pattern: string): number {
    let invalidatedCount = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }
    
    return invalidatedCount;
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const now = Date.now();
    let expiredCount = 0;
    let totalSize = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        expiredCount++;
      }
      totalSize += this.estimateEntrySize(entry);
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries: expiredCount,
      estimatedSizeBytes: totalSize,
      hitRate: this.calculateHitRate(),
      maxSize: this.maxCacheSize
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Preload frequently accessed data
   */
  async preloadCommonData(): Promise<void> {
    try {
      // Preload common voices for supported languages
      const { elevenLabsService } = await import('../elevenlabs-service');
      const languages = ['en', 'es', 'fr', 'de'];
      
      const preloadPromises = languages.map(async (language) => {
        try {
          const voices = await elevenLabsService.getVoices(language);
          await this.cacheVoices(language, voices);
        } catch (error) {
          console.warn(`Failed to preload voices for ${language}:`, error);
        }
      });

      await Promise.all(preloadPromises);
    } catch (error) {
      console.error('Failed to preload common data:', error);
    }
  }

  /**
   * Generic cache get method
   */
  private get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.recordCacheMiss();
      return null;
    }

    // Check if entry has expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.recordCacheMiss();
      return null;
    }

    // Update access time and hit count
    entry.lastAccessed = Date.now();
    entry.hitCount++;
    this.recordCacheHit();
    
    return entry.data as T;
  }

  /**
   * Generic cache set method
   */
  private set<T>(key: string, data: T, ttl?: number): void {
    // Enforce cache size limit
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLeastRecentlyUsed();
    }

    const expiresAt = ttl ? Date.now() + ttl : Date.now() + this.defaultTTL;
    
    this.cache.set(key, {
      data,
      expiresAt,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      hitCount: 0
    });
  }

  /**
   * Evict least recently used entries when cache is full
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Create a hash of configuration for cache key
   */
  private hashConfig(config: any): string {
    const configString = JSON.stringify(config, Object.keys(config).sort());
    return this.simpleHash(configString);
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Estimate memory size of cache entry
   */
  private estimateEntrySize(entry: CacheEntry): number {
    try {
      const dataSize = JSON.stringify(entry.data).length * 2; // Rough estimate
      return dataSize + 100; // Add overhead for metadata
    } catch {
      return 1000; // Default estimate for non-serializable data
    }
  }

  // Cache hit/miss tracking for statistics
  private hits = 0;
  private misses = 0;

  private recordCacheHit(): void {
    this.hits++;
  }

  private recordCacheMiss(): void {
    this.misses++;
  }

  private calculateHitRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? this.hits / total : 0;
  }
}

/**
 * Cache entry interface
 */
interface CacheEntry {
  data: any;
  expiresAt: number;
  createdAt: number;
  lastAccessed: number;
  hitCount: number;
}

/**
 * Cache statistics interface
 */
export interface CacheStats {
  totalEntries: number;
  expiredEntries: number;
  estimatedSizeBytes: number;
  hitRate: number;
  maxSize: number;
}

/**
 * Audio metadata interface for caching
 */
export interface AudioMetadata {
  duration: number;
  sizeBytes: number;
  format: string;
  sampleRate?: number;
  bitRate?: number;
  channels?: number;
}

// Export singleton instance
export const podcastCacheService = new PodcastCacheService();

// Initialize preloading on module load
if (typeof window === 'undefined') {
  // Only preload on server side
  podcastCacheService.preloadCommonData().catch(console.error);
}