/**
 * Podcast Service
 * Core service layer for podcast management with CRUD operations
 * Requirements: 7.1, 7.2, 4.1
 */

import { prisma } from '@/lib/services/prisma';
import { elevenLabsService } from './elevenlabs-service';
import { Podcast as PrismaPodcast, PodcastMode, PodcastStatus, QualityPreset, DurationScale } from '@prisma/client';
import {
  PodcastGenerationOptions,
  PodcastGenerationResponse,
  ErrorResponse,
} from '../types/podcast';

// Use Prisma-generated types for consistency
type Podcast = PrismaPodcast & {
  note?: {
    id: string;
    title: string;
    content?: string;
    userId?: string | null;
    transcriptId?: string;
  };
};

class PodcastService {
  /**
   * Generate a new podcast from note content
   * Requirements: 7.1, 7.2
   */
  async generatePodcast(
    noteId: string,
    options: PodcastGenerationOptions,
    userId?: string
  ): Promise<PodcastGenerationResponse> {
    try {
      // Validate note exists and get content
      const note = await prisma.note.findUnique({
        where: { id: noteId },
        select: {
          id: true,
          title: true,
          content: true,
          userId: true,
        },
      });

      if (!note) {
        return {
          success: false,
          error: 'Note not found',
          code: 'NOTE_NOT_FOUND',
        };
      }

      // Validate user permissions
      if (userId && note.userId && note.userId !== userId) {
        return {
          success: false,
          error: 'Unauthorized access to note',
          code: 'UNAUTHORIZED',
        };
      }

      // Validate content exists
      if (!note.content || note.content.trim().length === 0) {
        return {
          success: false,
          error: 'Note content is empty',
          code: 'EMPTY_CONTENT',
        };
      }

      // Validate generation options
      const validationResult = this.validateGenerationOptions(options);
      if (!validationResult.valid) {
        return {
          success: false,
          error: validationResult.errors.join(', '),
          code: 'INVALID_OPTIONS',
        };
      }

      // Mark any existing podcasts as superseded
      await this.markExistingPodcastsAsSuperseded(noteId);

      // Create podcast record with generating status
      const podcast = await prisma.podcast.create({
        data: {
          noteId,
          userId: userId || note.userId,
          mode: options.mode,
          hostVoiceId: options.voiceSettings.hostVoiceId,
          guestVoiceId: options.voiceSettings.guestVoiceId,
          qualityPreset: options.qualityPreset,
          durationScale: options.durationScale,
          language: options.language,
          intro: options.intro,
          outro: options.outro,
          status: PodcastStatus.GENERATING,
          progress: 0,
          title: `Podcast: ${note.title}`,
          description: `AI-generated podcast from note: ${note.title}`,
        },
      });

      // Call ElevenLabs API to start generation
      try {
        console.log('Calling ElevenLabs API with options:', {
          mode: options.mode,
          voiceSettings: options.voiceSettings,
          qualityPreset: options.qualityPreset,
          durationScale: options.durationScale,
        });

        const elevenLabs = elevenLabsService.getInstance();
        const elevenLabsResponse = await elevenLabs.generatePodcast({
          text: note.content,
          mode: options.mode === PodcastMode.CONVERSATION ? 'conversation' : 'bulletin',
          voice_settings: {
            host_voice_id: options.voiceSettings.hostVoiceId,
            guest_voice_id: options.voiceSettings.guestVoiceId,
          },
          quality_preset: options.qualityPreset.toLowerCase() as any,
          duration_scale: options.durationScale.toLowerCase() as any,
          language: options.language,
          intro: options.intro,
          outro: options.outro,
        });

        console.log('ElevenLabs API Response:', elevenLabsResponse);

        // Update podcast with ElevenLabs project ID
        await prisma.podcast.update({
          where: { id: podcast.id },
          data: {
            elevenLabsProjectId: elevenLabsResponse.project_id,
            status: PodcastStatus.IN_PROGRESS,
            progress: 10, // Initial progress after successful API call
          },
        });

        const updatedPodcast = await this.getPodcast(podcast.id);
        return {
          success: true,
          podcast: updatedPodcast || undefined,
        };
      } catch (elevenLabsError) {
        console.error('ElevenLabs API Error in podcast service:', elevenLabsError);
        
        // Update podcast status to failed
        await prisma.podcast.update({
          where: { id: podcast.id },
          data: {
            status: PodcastStatus.FAILED,
            errorMessage: elevenLabsError instanceof Error ? elevenLabsError.message : 'ElevenLabs API error',
          },
        });

        return {
          success: false,
          error: elevenLabsError instanceof Error ? elevenLabsError.message : 'Failed to generate podcast',
          code: 'ELEVENLABS_ERROR',
        };
      }
    } catch (error) {
      console.error('Error generating podcast:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Get podcast by ID
   * Requirements: 4.1
   */
  async getPodcast(podcastId: string): Promise<Podcast | null> {
    try {
      const podcast = await prisma.podcast.findUnique({
        where: { id: podcastId },
        include: {
          note: {
            select: {
              id: true,
              title: true,
              content: true,
              userId: true,
            },
          },
        },
      });

      return podcast;
    } catch (error) {
      console.error('Error retrieving podcast:', error);
      throw new Error('Failed to retrieve podcast');
    }
  }

  /**
   * Get podcasts by note ID
   * Requirements: 4.1
   */
  async getPodcastsByNote(noteId: string, userId?: string): Promise<Podcast[]> {
    try {
      const whereClause: any = { noteId };
      
      // Add user filter if provided
      if (userId) {
        whereClause.userId = userId;
      }

      const podcasts = await prisma.podcast.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          note: {
            select: {
              id: true,
              title: true,
              userId: true,
            },
          },
        },
      });

      return podcasts;
    } catch (error) {
      console.error('Error retrieving podcasts for note:', error);
      throw new Error('Failed to retrieve podcasts for note');
    }
  }

  /**
   * Get podcasts by user ID
   * Requirements: 4.1
   */
  async getPodcastsByUser(userId: string): Promise<Podcast[]> {
    try {
      const podcasts = await prisma.podcast.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          note: {
            select: {
              id: true,
              title: true,
              transcriptId: true,
            },
          },
        },
      });

      return podcasts;
    } catch (error) {
      console.error('Error retrieving user podcasts:', error);
      throw new Error('Failed to retrieve user podcasts');
    }
  }

  /**
   * Delete podcast by ID
   * Requirements: 4.1
   */
  async deletePodcast(podcastId: string, userId?: string): Promise<boolean> {
    try {
      // Get podcast to check permissions and get file info
      const podcast = await prisma.podcast.findUnique({
        where: { id: podcastId },
        select: {
          id: true,
          userId: true,
          audioFileKey: true,
          note: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!podcast) {
        throw new Error('Podcast not found');
      }

      // Check permissions
      if (userId && podcast.userId && podcast.userId !== userId) {
        // Also check if user owns the note
        if (!podcast.note?.userId || podcast.note.userId !== userId) {
          throw new Error('Unauthorized to delete podcast');
        }
      }

      // Delete audio file from storage if exists
      if (podcast.audioFileKey) {
        try {
          // Import UploadThing service for file deletion
          const { uploadThingAudioStorageService } = await import('../uploadthing');
          await uploadThingAudioStorageService.deleteAudioFile(podcast.audioFileKey);
        } catch (fileError) {
          console.warn('Failed to delete audio file:', fileError);
          // Continue with database deletion even if file deletion fails
        }
      }

      // Delete podcast from database
      await prisma.podcast.delete({
        where: { id: podcastId },
      });

      return true;
    } catch (error) {
      console.error('Error deleting podcast:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to delete podcast');
    }
  }

  /**
   * Update podcast status and progress
   * Requirements: 7.2
   */
  async updatePodcastStatus(
    podcastId: string,
    status: PodcastStatus,
    progress?: number,
    errorMessage?: string,
    audioUrl?: string,
    audioFileKey?: string,
    duration?: number,
    fileSize?: number
  ): Promise<Podcast | null> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      if (progress !== undefined) {
        updateData.progress = progress;
      }

      if (errorMessage !== undefined) {
        updateData.errorMessage = errorMessage;
      }

      if (audioUrl !== undefined) {
        updateData.audioUrl = audioUrl;
      }

      if (audioFileKey !== undefined) {
        updateData.audioFileKey = audioFileKey;
      }

      if (duration !== undefined) {
        updateData.duration = duration;
      }

      if (fileSize !== undefined) {
        updateData.fileSize = fileSize;
      }

      if (status === PodcastStatus.COMPLETED) {
        updateData.completedAt = new Date();
        updateData.progress = 100;
      }

      const podcast = await prisma.podcast.update({
        where: { id: podcastId },
        data: updateData,
        include: {
          note: {
            select: {
              id: true,
              title: true,
              content: true,
              userId: true,
            },
          },
        },
      });

      return podcast;
    } catch (error) {
      console.error('Error updating podcast status:', error);
      throw new Error('Failed to update podcast status');
    }
  }

  /**
   * Find podcast by ElevenLabs project ID
   * Requirements: 7.2
   */
  async getPodcastByProjectId(projectId: string): Promise<Podcast | null> {
    try {
      const podcast = await prisma.podcast.findUnique({
        where: { elevenLabsProjectId: projectId },
        include: {
          note: {
            select: {
              id: true,
              title: true,
              content: true,
              userId: true,
            },
          },
        },
      });

      return podcast;
    } catch (error) {
      console.error('Error finding podcast by project ID:', error);
      throw new Error('Failed to find podcast by project ID');
    }
  }

  /**
   * Regenerate podcast with new options
   * Requirements: 4.1
   */
  async regeneratePodcast(
    podcastId: string,
    options: PodcastGenerationOptions,
    userId?: string
  ): Promise<PodcastGenerationResponse> {
    try {
      // Get existing podcast
      const existingPodcast = await prisma.podcast.findUnique({
        where: { id: podcastId },
        include: {
          note: {
            select: {
              id: true,
              title: true,
              content: true,
              userId: true,
            },
          },
        },
      });

      if (!existingPodcast) {
        return {
          success: false,
          error: 'Podcast not found',
          code: 'PODCAST_NOT_FOUND',
        };
      }

      // Check permissions
      if (userId && existingPodcast.userId && existingPodcast.userId !== userId) {
        if (!existingPodcast.note?.userId || existingPodcast.note.userId !== userId) {
          return {
            success: false,
            error: 'Unauthorized to regenerate podcast',
            code: 'UNAUTHORIZED',
          };
        }
      }

      // Mark existing podcast as superseded
      await prisma.podcast.update({
        where: { id: podcastId },
        data: { status: PodcastStatus.SUPERSEDED },
      });

      // Generate new podcast
      return await this.generatePodcast(existingPodcast.noteId, options, userId);
    } catch (error) {
      console.error('Error regenerating podcast:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to regenerate podcast',
        code: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Get the most recent successful podcast for a note
   * Requirements: 4.1, 4.5
   */
  async getLatestPodcastForNote(noteId: string, userId?: string): Promise<Podcast | null> {
    try {
      const whereClause: any = {
        noteId,
        status: {
          in: [PodcastStatus.COMPLETED, PodcastStatus.IN_PROGRESS, PodcastStatus.GENERATING],
        },
      };

      if (userId) {
        whereClause.userId = userId;
      }

      const podcast = await prisma.podcast.findFirst({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          note: {
            select: {
              id: true,
              title: true,
              content: true,
              userId: true,
            },
          },
        },
      });

      return podcast;
    } catch (error) {
      console.error('Error getting latest podcast for note:', error);
      throw new Error('Failed to get latest podcast for note');
    }
  }

  /**
   * Get podcast history for a note with proper ordering and status filtering
   * Requirements: 4.5
   */
  async getPodcastHistory(
    noteId: string, 
    userId?: string, 
    includeSuperseded: boolean = false
  ): Promise<{
    podcasts: Podcast[];
    latest: Podcast | null;
    inProgress: Podcast | null;
    completed: Podcast[];
    failed: Podcast[];
    superseded: Podcast[];
  }> {
    try {
      const whereClause: any = { noteId };
      
      if (userId) {
        whereClause.userId = userId;
      }

      // Get all podcasts for the note
      const allPodcasts = await prisma.podcast.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          note: {
            select: {
              id: true,
              title: true,
              content: true,
              userId: true,
            },
          },
        },
      });

      // Categorize podcasts by status
      const completed = allPodcasts.filter(p => p.status === PodcastStatus.COMPLETED);
      const inProgress = allPodcasts.find(p => 
        p.status === PodcastStatus.GENERATING || p.status === PodcastStatus.IN_PROGRESS
      ) || null;
      const failed = allPodcasts.filter(p => p.status === PodcastStatus.FAILED);
      const superseded = allPodcasts.filter(p => p.status === PodcastStatus.SUPERSEDED);

      // Get the latest successful or in-progress podcast
      const latest = inProgress || completed[0] || null;

      // Filter podcasts based on includeSuperseded flag
      const podcasts = includeSuperseded 
        ? allPodcasts 
        : allPodcasts.filter(p => p.status !== PodcastStatus.SUPERSEDED);

      return {
        podcasts,
        latest,
        inProgress,
        completed,
        failed,
        superseded,
      };
    } catch (error) {
      console.error('Error getting podcast history:', error);
      throw new Error('Failed to get podcast history');
    }
  }

  /**
   * Clean up failed or superseded podcasts
   * Requirements: 7.2
   */
  async cleanupOldPodcasts(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // Find podcasts to clean up
      const podcastsToDelete = await prisma.podcast.findMany({
        where: {
          OR: [
            {
              status: PodcastStatus.FAILED,
              createdAt: { lt: cutoffDate },
            },
            {
              status: PodcastStatus.SUPERSEDED,
              createdAt: { lt: cutoffDate },
            },
          ],
        },
        select: {
          id: true,
          audioFileKey: true,
        },
      });

      let deletedCount = 0;

      // Delete each podcast and its associated files
      for (const podcast of podcastsToDelete) {
        try {
          // Delete audio file if exists
          if (podcast.audioFileKey) {
            try {
              const { uploadThingAudioStorageService } = await import('../uploadthing');
              await uploadThingAudioStorageService.deleteAudioFile(podcast.audioFileKey);
            } catch (fileError) {
              console.warn(`Failed to delete audio file for podcast ${podcast.id}:`, fileError);
            }
          }

          // Delete podcast record
          await prisma.podcast.delete({
            where: { id: podcast.id },
          });

          deletedCount++;
        } catch (deleteError) {
          console.error(`Failed to delete podcast ${podcast.id}:`, deleteError);
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old podcasts:', error);
      throw new Error('Failed to clean up old podcasts');
    }
  }

  /**
   * Validate podcast generation options
   * Private helper method
   */
  private validateGenerationOptions(options: PodcastGenerationOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate mode
    if (!Object.values(PodcastMode).includes(options.mode)) {
      errors.push('Invalid podcast mode');
    }

    // Validate voice settings
    if (!options.voiceSettings.hostVoiceId || options.voiceSettings.hostVoiceId.trim().length === 0) {
      errors.push('Host voice ID is required');
    }

    // For conversation mode, guest voice is required
    if (options.mode === PodcastMode.CONVERSATION) {
      if (!options.voiceSettings.guestVoiceId || options.voiceSettings.guestVoiceId.trim().length === 0) {
        errors.push('Guest voice ID is required for conversation mode');
      }
    }

    // Validate quality preset
    if (!Object.values(QualityPreset).includes(options.qualityPreset)) {
      errors.push('Invalid quality preset');
    }

    // Validate duration scale
    if (!Object.values(DurationScale).includes(options.durationScale)) {
      errors.push('Invalid duration scale');
    }

    // Validate optional fields
    if (options.language && options.language.trim().length === 0) {
      errors.push('Language cannot be empty if provided');
    }

    if (options.intro && options.intro.length > 1000) {
      errors.push('Intro text is too long (max 1000 characters)');
    }

    if (options.outro && options.outro.length > 1000) {
      errors.push('Outro text is too long (max 1000 characters)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Mark existing podcasts as superseded
   * Private helper method
   */
  private async markExistingPodcastsAsSuperseded(noteId: string): Promise<void> {
    try {
      await prisma.podcast.updateMany({
        where: {
          noteId,
          status: {
            in: [PodcastStatus.GENERATING, PodcastStatus.IN_PROGRESS, PodcastStatus.COMPLETED],
          },
        },
        data: {
          status: PodcastStatus.SUPERSEDED,
        },
      });
    } catch (error) {
      console.error('Error marking existing podcasts as superseded:', error);
      // Don't throw error here as this is not critical for the main operation
    }
  }

  /**
   * Delete all podcasts for a note and clean up associated audio files
   * Requirements: 7.4 - Used during note deletion workflow
   */
  async deletePodcastsByNote(noteId: string, userId?: string): Promise<{
    deletedCount: number;
    cleanedFileCount: number;
    errors: string[];
  }> {
    try {
      // Get all podcasts for the note
      const whereClause: any = { noteId };
      if (userId) {
        whereClause.userId = userId;
      }

      const podcasts = await prisma.podcast.findMany({
        where: whereClause,
        select: {
          id: true,
          audioFileKey: true,
          status: true,
        },
      });

      const errors: string[] = [];
      let cleanedFileCount = 0;

      // Clean up audio files
      const audioFileKeys = podcasts
        .filter(podcast => podcast.audioFileKey)
        .map(podcast => podcast.audioFileKey!);

      if (audioFileKeys.length > 0) {
        try {
          const { uploadThingAudioStorageService } = await import('../uploadthing');
          await uploadThingAudioStorageService.deleteAudioFiles(audioFileKeys);
          cleanedFileCount = audioFileKeys.length;
        } catch (fileError) {
          const errorMsg = `Failed to delete audio files: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.warn(errorMsg);
        }
      }

      // Delete podcast records
      const deleteResult = await prisma.podcast.deleteMany({
        where: whereClause,
      });

      return {
        deletedCount: deleteResult.count,
        cleanedFileCount,
        errors,
      };
    } catch (error) {
      console.error('Error deleting podcasts by note:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to delete podcasts by note');
    }
  }

  /**
   * Get podcast statistics for a user
   * Requirements: 4.1
   */
  async getPodcastStats(userId: string): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    failed: number;
    totalDuration: number;
  }> {
    try {
      const stats = await prisma.podcast.groupBy({
        by: ['status'],
        where: { userId },
        _count: {
          id: true,
        },
        _sum: {
          duration: true,
        },
      });

      const result = {
        total: 0,
        completed: 0,
        inProgress: 0,
        failed: 0,
        totalDuration: 0,
      };

      stats.forEach((stat) => {
        result.total += stat._count.id;
        result.totalDuration += stat._sum.duration || 0;

        switch (stat.status) {
          case PodcastStatus.COMPLETED:
            result.completed = stat._count.id;
            break;
          case PodcastStatus.IN_PROGRESS:
          case PodcastStatus.GENERATING:
            result.inProgress += stat._count.id;
            break;
          case PodcastStatus.FAILED:
            result.failed = stat._count.id;
            break;
        }
      });

      return result;
    } catch (error) {
      console.error('Error getting podcast stats:', error);
      throw new Error('Failed to get podcast statistics');
    }
  }
}

// Export singleton instance
let _podcastService: PodcastService | null = null;

export const podcastService = {
  getInstance(): PodcastService {
    if (!_podcastService) {
      _podcastService = new PodcastService();
    }
    return _podcastService;
  },
};

// Export the service class for direct instantiation if needed
export { PodcastService };