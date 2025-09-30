import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { podcastCacheService } from './podcast-cache-service';

/**
 * Optimized database query service for podcast operations
 * Implements efficient queries, caching, and performance monitoring
 */
export class PodcastQueryOptimizer {
  private queryMetrics = new Map<string, QueryMetric>();

  /**
   * Get podcast with segments using optimized query and caching
   */
  async getPodcastWithSegments(podcastId: string, useCache = true): Promise<PodcastWithSegments | null> {
    const startTime = Date.now();
    const queryName = 'getPodcastWithSegments';

    try {
      // Check cache first
      if (useCache) {
        const cached = podcastCacheService.getCachedPodcastData(podcastId);
        if (cached) {
          this.recordQueryMetric(queryName, Date.now() - startTime, true);
          return cached;
        }
      }

      // Optimized query with proper includes and ordering
      const podcast = await prisma.podcast.findUnique({
        where: { id: podcastId },
        include: {
          segments: {
            orderBy: { sequenceOrder: 'asc' },
            select: {
              id: true,
              speaker: true,
              content: true,
              startTime: true,
              endTime: true,
              audioUrl: true,
              sequenceOrder: true
            }
          },
          note: {
            select: {
              id: true,
              title: true,
              userId: true
            }
          }
        }
      });

      if (!podcast) {
        this.recordQueryMetric(queryName, Date.now() - startTime, false);
        return null;
      }

      // Transform and cache result
      const { note, ...podcastData } = podcast;
      
      const result: PodcastWithSegments = {
        ...podcastData,
        userId: podcast.userId ?? undefined,
        description: podcast.description ?? undefined,
        estimatedDuration: podcast.estimatedDuration ?? undefined,
        actualDuration: podcast.actualDuration ?? undefined,
        customInstructions: podcast.customInstructions ?? undefined,
        audioUrl: podcast.audioUrl ?? undefined,
        generationError: podcast.generationError ?? undefined,
        durationPreset: podcast.durationPreset as 'short' | 'medium' | 'long',
        generationStatus: podcast.generationStatus as 'pending' | 'generating' | 'completed' | 'failed',
        transcriptData: podcast.transcriptData ? podcast.transcriptData as any : undefined,
        segments: podcast.segments.map(segment => ({
          ...segment,
          startTime: segment.startTime ? Number(segment.startTime) : undefined,
          endTime: segment.endTime ? Number(segment.endTime) : undefined,
          audioUrl: segment.audioUrl ?? undefined
        }))
      };

      // Cache the result
      if (useCache) {
        await podcastCacheService.cachePodcastData(podcastId, result);
      }

      this.recordQueryMetric(queryName, Date.now() - startTime, false);
      return result;
    } catch (error) {
      this.recordQueryMetric(queryName, Date.now() - startTime, false, error as Error);
      throw error;
    }
  }

  /**
   * Get podcasts for a user with pagination and filtering
   */
  async getUserPodcasts(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      language?: string;
      sortBy?: 'createdAt' | 'updatedAt' | 'title';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<PaginatedPodcasts> {
    const startTime = Date.now();
    const queryName = 'getUserPodcasts';

    try {
      const {
        page = 1,
        limit = 20,
        status,
        language,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.PodcastWhereInput = {
        userId,
        ...(status && { generationStatus: status }),
        ...(language && { language })
      };

      // Execute count and data queries in parallel
      const [total, podcasts] = await Promise.all([
        prisma.podcast.count({ where }),
        prisma.podcast.findMany({
          where,
          select: {
            id: true,
            title: true,
            description: true,
            language: true,
            durationPreset: true,
            estimatedDuration: true,
            actualDuration: true,
            audioUrl: true,
            generationStatus: true,
            createdAt: true,
            updatedAt: true,
            note: {
              select: {
                id: true,
                title: true
              }
            },
            _count: {
              select: {
                segments: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit
        })
      ]);

      const result: PaginatedPodcasts = {
        podcasts: podcasts.map(podcast => ({
          ...podcast,
          description: podcast.description ?? undefined,
          estimatedDuration: podcast.estimatedDuration ?? undefined,
          actualDuration: podcast.actualDuration ?? undefined,
          audioUrl: podcast.audioUrl ?? undefined,
          durationPreset: podcast.durationPreset as 'short' | 'medium' | 'long',
          generationStatus: podcast.generationStatus as 'pending' | 'generating' | 'completed' | 'failed',
          segmentCount: podcast._count.segments
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };

      this.recordQueryMetric(queryName, Date.now() - startTime, false);
      return result;
    } catch (error) {
      this.recordQueryMetric(queryName, Date.now() - startTime, false, error as Error);
      throw error;
    }
  }

  /**
   * Get podcast by note ID with caching
   */
  async getPodcastByNoteId(noteId: string, useCache = true): Promise<PodcastWithSegments | null> {
    const startTime = Date.now();
    const queryName = 'getPodcastByNoteId';

    try {
      // Check cache first
      const cacheKey = `note:${noteId}`;
      if (useCache) {
        const cached = podcastCacheService.getCachedPodcastData(cacheKey);
        if (cached) {
          this.recordQueryMetric(queryName, Date.now() - startTime, true);
          return cached;
        }
      }

      const podcast = await prisma.podcast.findUnique({
        where: { noteId },
        include: {
          segments: {
            orderBy: { sequenceOrder: 'asc' },
            select: {
              id: true,
              speaker: true,
              content: true,
              startTime: true,
              endTime: true,
              audioUrl: true,
              sequenceOrder: true
            }
          },
          note: {
            select: {
              id: true,
              title: true,
              userId: true
            }
          }
        }
      });

      if (!podcast) {
        this.recordQueryMetric(queryName, Date.now() - startTime, false);
        return null;
      }

      const { note, ...podcastData } = podcast;
      
      const result: PodcastWithSegments = {
        ...podcastData,
        userId: podcast.userId ?? undefined,
        description: podcast.description ?? undefined,
        estimatedDuration: podcast.estimatedDuration ?? undefined,
        actualDuration: podcast.actualDuration ?? undefined,
        customInstructions: podcast.customInstructions ?? undefined,
        audioUrl: podcast.audioUrl ?? undefined,
        generationError: podcast.generationError ?? undefined,
        durationPreset: podcast.durationPreset as 'short' | 'medium' | 'long',
        generationStatus: podcast.generationStatus as 'pending' | 'generating' | 'completed' | 'failed',
        transcriptData: podcast.transcriptData ? podcast.transcriptData as any : undefined,
        segments: podcast.segments.map(segment => ({
          ...segment,
          startTime: segment.startTime ? Number(segment.startTime) : undefined,
          endTime: segment.endTime ? Number(segment.endTime) : undefined,
          audioUrl: segment.audioUrl ?? undefined
        }))
      };

      // Cache the result
      if (useCache) {
        await podcastCacheService.cachePodcastData(cacheKey, result);
      }

      this.recordQueryMetric(queryName, Date.now() - startTime, false);
      return result;
    } catch (error) {
      this.recordQueryMetric(queryName, Date.now() - startTime, false, error as Error);
      throw error;
    }
  }

  /**
   * Batch update podcast segments for better performance
   */
  async batchUpdateSegments(
    podcastId: string,
    segments: Array<{
      id?: number;
      speaker: string;
      content: string;
      startTime?: number;
      endTime?: number;
      audioUrl?: string;
      sequenceOrder: number;
    }>
  ): Promise<void> {
    const startTime = Date.now();
    const queryName = 'batchUpdateSegments';

    try {
      await prisma.$transaction(async (tx) => {
        // Delete existing segments
        await tx.podcastSegment.deleteMany({
          where: { podcastId }
        });

        // Insert new segments in batch
        if (segments.length > 0) {
          await tx.podcastSegment.createMany({
            data: segments.map(segment => ({
              podcastId,
              speaker: segment.speaker,
              content: segment.content,
              startTime: segment.startTime,
              endTime: segment.endTime,
              audioUrl: segment.audioUrl,
              sequenceOrder: segment.sequenceOrder
            }))
          });
        }
      });

      // Invalidate cache
      podcastCacheService.invalidateByPattern(`.*${podcastId}.*`);

      this.recordQueryMetric(queryName, Date.now() - startTime, false);
    } catch (error) {
      this.recordQueryMetric(queryName, Date.now() - startTime, false, error as Error);
      throw error;
    }
  }

  /**
   * Get podcast generation statistics for monitoring
   */
  async getPodcastStats(userId?: string): Promise<PodcastStats> {
    const startTime = Date.now();
    const queryName = 'getPodcastStats';

    try {
      // Check cache first
      const cacheKey = userId ? `stats:${userId}` : 'stats:global';
      const cached = podcastCacheService.getCachedUsageStats(cacheKey);
      if (cached) {
        this.recordQueryMetric(queryName, Date.now() - startTime, true);
        return cached;
      }

      const where = userId ? { userId } : {};

      const [
        totalPodcasts,
        completedPodcasts,
        failedPodcasts,
        totalDuration,
        languageStats,
        durationPresetStats
      ] = await Promise.all([
        prisma.podcast.count({ where }),
        prisma.podcast.count({ where: { ...where, generationStatus: 'completed' } }),
        prisma.podcast.count({ where: { ...where, generationStatus: 'failed' } }),
        prisma.podcast.aggregate({
          where: { ...where, actualDuration: { not: null } },
          _sum: { actualDuration: true }
        }),
        prisma.podcast.groupBy({
          by: ['language'],
          where,
          _count: { id: true }
        }),
        prisma.podcast.groupBy({
          by: ['durationPreset'],
          where,
          _count: { id: true }
        })
      ]);

      const stats: PodcastStats = {
        totalPodcasts,
        completedPodcasts,
        failedPodcasts,
        pendingPodcasts: totalPodcasts - completedPodcasts - failedPodcasts,
        successRate: totalPodcasts > 0 ? completedPodcasts / totalPodcasts : 0,
        totalDurationSeconds: totalDuration._sum.actualDuration || 0,
        averageDurationSeconds: completedPodcasts > 0 ? (totalDuration._sum.actualDuration || 0) / completedPodcasts : 0,
        languageDistribution: Object.fromEntries(
          languageStats.map(stat => [stat.language, stat._count.id])
        ),
        durationPresetDistribution: Object.fromEntries(
          durationPresetStats.map(stat => [stat.durationPreset, stat._count.id])
        )
      };

      // Cache the result
      await podcastCacheService.cacheUsageStats(cacheKey, stats);

      this.recordQueryMetric(queryName, Date.now() - startTime, false);
      return stats;
    } catch (error) {
      this.recordQueryMetric(queryName, Date.now() - startTime, false, error as Error);
      throw error;
    }
  }

  /**
   * Search podcasts with full-text search optimization
   */
  async searchPodcasts(
    query: string,
    userId?: string,
    options: {
      page?: number;
      limit?: number;
      language?: string;
    } = {}
  ): Promise<PaginatedPodcasts> {
    const startTime = Date.now();
    const queryName = 'searchPodcasts';

    try {
      const { page = 1, limit = 20, language } = options;
      const skip = (page - 1) * limit;

      // Build search conditions
      const searchConditions: Prisma.PodcastWhereInput = {
        ...(userId && { userId }),
        ...(language && { language }),
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          {
            segments: {
              some: {
                content: { contains: query, mode: 'insensitive' }
              }
            }
          }
        ]
      };

      const [total, podcasts] = await Promise.all([
        prisma.podcast.count({ where: searchConditions }),
        prisma.podcast.findMany({
          where: searchConditions,
          select: {
            id: true,
            title: true,
            description: true,
            language: true,
            durationPreset: true,
            estimatedDuration: true,
            actualDuration: true,
            audioUrl: true,
            generationStatus: true,
            createdAt: true,
            updatedAt: true,
            note: {
              select: {
                id: true,
                title: true
              }
            },
            _count: {
              select: {
                segments: true
              }
            }
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: limit
        })
      ]);

      const result: PaginatedPodcasts = {
        podcasts: podcasts.map(podcast => ({
          ...podcast,
          description: podcast.description ?? undefined,
          estimatedDuration: podcast.estimatedDuration ?? undefined,
          actualDuration: podcast.actualDuration ?? undefined,
          audioUrl: podcast.audioUrl ?? undefined,
          durationPreset: podcast.durationPreset as 'short' | 'medium' | 'long',
          generationStatus: podcast.generationStatus as 'pending' | 'generating' | 'completed' | 'failed',
          segmentCount: podcast._count.segments
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };

      this.recordQueryMetric(queryName, Date.now() - startTime, false);
      return result;
    } catch (error) {
      this.recordQueryMetric(queryName, Date.now() - startTime, false, error as Error);
      throw error;
    }
  }

  /**
   * Get query performance metrics
   */
  getQueryMetrics(): Record<string, QueryMetricSummary> {
    const metrics: Record<string, QueryMetricSummary> = {};

    for (const [queryName, metric] of this.queryMetrics.entries()) {
      metrics[queryName] = {
        totalExecutions: metric.executionCount,
        averageExecutionTime: metric.totalTime / metric.executionCount,
        cacheHitRate: metric.cacheHits / metric.executionCount,
        errorRate: metric.errors / metric.executionCount,
        lastExecuted: metric.lastExecuted
      };
    }

    return metrics;
  }

  /**
   * Reset query metrics
   */
  resetMetrics(): void {
    this.queryMetrics.clear();
  }

  /**
   * Record query execution metrics
   */
  private recordQueryMetric(
    queryName: string,
    executionTime: number,
    cacheHit: boolean,
    error?: Error
  ): void {
    const existing = this.queryMetrics.get(queryName) || {
      executionCount: 0,
      totalTime: 0,
      cacheHits: 0,
      errors: 0,
      lastExecuted: Date.now()
    };

    existing.executionCount++;
    existing.totalTime += executionTime;
    existing.lastExecuted = Date.now();

    if (cacheHit) {
      existing.cacheHits++;
    }

    if (error) {
      existing.errors++;
    }

    this.queryMetrics.set(queryName, existing);
  }
}

/**
 * Interfaces for type safety
 */
export interface PodcastWithSegments {
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
  transcriptData?: any;
  generationStatus: 'pending' | 'generating' | 'completed' | 'failed';
  generationError?: string;
  createdAt: Date;
  updatedAt: Date;
  segments: Array<{
    id: number;
    speaker: string;
    content: string;
    startTime?: number;
    endTime?: number;
    audioUrl?: string;
    sequenceOrder: number;
  }>;
  note?: {
    id: string;
    title: string;
    userId?: string;
  };
}

export interface PaginatedPodcasts {
  podcasts: Array<{
    id: string;
    title: string;
    description?: string;
    language: string;
    durationPreset: 'short' | 'medium' | 'long';
    estimatedDuration?: number;
    actualDuration?: number;
    audioUrl?: string;
    generationStatus: 'pending' | 'generating' | 'completed' | 'failed';
    createdAt: Date;
    updatedAt: Date;
    note: {
      id: string;
      title: string;
    };
    segmentCount: number;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PodcastStats {
  totalPodcasts: number;
  completedPodcasts: number;
  failedPodcasts: number;
  pendingPodcasts: number;
  successRate: number;
  totalDurationSeconds: number;
  averageDurationSeconds: number;
  languageDistribution: Record<string, number>;
  durationPresetDistribution: Record<string, number>;
}

interface QueryMetric {
  executionCount: number;
  totalTime: number;
  cacheHits: number;
  errors: number;
  lastExecuted: number;
}

interface QueryMetricSummary {
  totalExecutions: number;
  averageExecutionTime: number;
  cacheHitRate: number;
  errorRate: number;
  lastExecuted: number;
}

// Export singleton instance
export const podcastQueryOptimizer = new PodcastQueryOptimizer();