/**
 * API endpoint for retrying failed podcast generation
 * Allows users to retry failed podcast generations with recovery
 * Requirements: 4.6, 6.8, 8.8
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { PodcastService } from '@/lib/podcast-service';
import { NoteService } from '@/lib/note-service';
import { PodcastApiErrorHandler } from '@/lib/utils/podcast-api-error-handler';
import { podcastErrorHandler } from '@/lib/utils/podcast-error-handler';
import { podcastProgressTracker } from '@/lib/utils/podcast-progress-tracker';

const podcastService = new PodcastService();
const noteService = new NoteService();

interface Params {
  id: string;
}

interface RetryResponse {
  success: boolean;
  data?: {
    id: string;
    status: string;
    message: string;
  };
  error?: string;
}

// POST /api/podcasts/[id]/retry - Retry failed podcast generation
export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  return PodcastApiErrorHandler.withErrorHandling(async () => {
    const { userId } = await auth();
    const { id: podcastId } = await params;

    if (!userId) {
      return PodcastApiErrorHandler.createAuthErrorResponse();
    }

    // Get podcast and verify access
    const podcast = await prisma.podcast.findUnique({
      where: { id: podcastId },
      include: {
        note: {
          select: {
            id: true,
            content: true,
            userId: true
          }
        }
      }
    });

    if (!podcast) {
      return PodcastApiErrorHandler.createNotFoundResponse('Podcast');
    }

    if (podcast.userId !== userId || podcast.note?.userId !== userId) {
      return PodcastApiErrorHandler.createErrorResponse(
        'You do not have permission to access this podcast',
        'authorization check',
        403
      );
    }

    // Check if podcast is in a retryable state
    if (podcast.generationStatus !== 'failed') {
      return PodcastApiErrorHandler.createConflictResponse(
        'Podcast is not in a failed state and cannot be retried',
        [
          'Only failed podcast generations can be retried',
          'Wait for current generation to complete if in progress',
          'Create a new podcast if the current one is completed'
        ]
      );
    }

    if (!podcast.note?.content) {
      return PodcastApiErrorHandler.createValidationErrorResponse(
        ['Associated note content is missing or empty'],
        'note validation'
      );
    }

    // Clean up any existing failed generation artifacts
    try {
      await podcastErrorHandler.cleanupFailedGeneration(podcastId);
    } catch (cleanupError) {
      console.warn('Cleanup warning during retry:', cleanupError);
      // Don't fail the retry if cleanup has issues
    }

    // Reset podcast status and clear error
    await prisma.podcast.update({
      where: { id: podcastId },
      data: {
        generationStatus: 'pending',
        generationError: null,
        updatedAt: new Date()
      }
    });

    // Reconstruct configuration from stored data
    const config = {
      language: podcast.language,
      durationPreset: podcast.durationPreset,
      host1VoiceId: podcast.host1VoiceId,
      host1VoiceName: podcast.host1VoiceName,
      host2VoiceId: podcast.host2VoiceId,
      host2VoiceName: podcast.host2VoiceName,
      customInstructions: podcast.customInstructions
    };

    // Validate configuration before retrying
    const validation = podcastErrorHandler.validateAndSanitizeConfig(config);
    if (!validation.isValid) {
      return PodcastApiErrorHandler.createValidationErrorResponse(
        validation.errors,
        'retry configuration validation'
      );
    }

    // Initialize progress tracking for retry
    podcastProgressTracker.initializeProgress(podcastId);

    // Start retry generation in background
    retryPodcastGeneration(podcastId, podcast.note.content, validation.sanitizedConfig!).catch(async (error) => {
      console.error('Retry generation failed:', error);
      
      try {
        await podcastErrorHandler.cleanupFailedGeneration(podcastId);
        
        const podcastError = error instanceof Error 
          ? podcastErrorHandler.handleError(error, 'retry generation')
          : new Error('Unknown retry error');
        
        await prisma.podcast.update({
          where: { id: podcastId },
          data: {
            generationStatus: 'failed',
            generationError: `Retry failed: ${podcastError.message}`
          }
        });
        
        podcastProgressTracker.failProgress(podcastId, podcastError.message);
        
        podcastErrorHandler.logError(podcastError, 'Retry Generation Failed', {
          podcastId,
          userId,
          retryAttempt: true
        });
        
      } catch (failureHandlingError) {
        console.error('Failed to handle retry failure:', failureHandlingError);
      }
    });

    const response: RetryResponse = {
      success: true,
      data: {
        id: podcastId,
        status: 'pending',
        message: 'Podcast generation retry started'
      }
    };

    return NextResponse.json(response, { status: 202 });
  }, 'podcast retry');
}

/**
 * Background function to handle podcast generation retry
 */
async function retryPodcastGeneration(
  podcastId: string,
  noteContent: string,
  config: any
): Promise<void> {
  let currentStage = 'initialization';
  
  try {
    // Update status to generating
    await prisma.podcast.update({
      where: { id: podcastId },
      data: { generationStatus: 'generating' }
    });

    // Generate script with enhanced retry logic for retry attempts
    currentStage = 'script_generation';
    console.log(`Starting retry script generation for podcast ${podcastId}`);
    
    podcastProgressTracker.updateProgress(podcastId, 'script_generation', 0, 'Retrying script generation...');
    
    const script = await podcastErrorHandler.retryWithBackoff(
      () => podcastService.generateScript(noteContent, config),
      5, // More retries for retry attempts
      'retry script generation'
    );
    
    podcastProgressTracker.updateProgress(podcastId, 'script_generation', 100, 'Script generation completed');

    // Update database with script data
    currentStage = 'database_update';
    await prisma.podcast.update({
      where: { id: podcastId },
      data: { 
        estimatedDuration: Math.round(script.totalEstimatedDuration),
        transcriptData: {
          segments: script.segments.map(segment => ({
            speaker: segment.speaker,
            content: segment.content,
            startTime: 0,
            endTime: 0,
            sequenceOrder: segment.sequenceOrder
          })),
          totalDuration: script.totalEstimatedDuration,
          speakers: script.metadata.hosts
        }
      }
    });

    // Save podcast segments
    currentStage = 'segments_creation';
    podcastProgressTracker.updateProgress(podcastId, 'storage', 0, 'Saving podcast segments...');
    
    const segmentPromises = script.segments.map(async (segment) => {
      return prisma.podcastSegment.create({
        data: {
          podcastId: podcastId,
          speaker: segment.speaker,
          content: segment.content,
          startTime: 0,
          endTime: segment.estimatedDuration || 0,
          sequenceOrder: segment.sequenceOrder
        }
      });
    });

    await Promise.all(segmentPromises);
    podcastProgressTracker.updateProgress(podcastId, 'storage', 50, 'Segments saved successfully');

    // Index transcript for chatbot integration
    currentStage = 'transcript_indexing';
    podcastProgressTracker.updateProgress(podcastId, 'indexing', 0, 'Indexing transcript for AI chat...');
    
    try {
      const noteRecord = await prisma.podcast.findUnique({
        where: { id: podcastId },
        select: { noteId: true }
      });
      
      if (noteRecord) {
        await podcastErrorHandler.retryWithBackoff(
          () => podcastService.indexPodcastTranscript(podcastId, noteRecord.noteId),
          3,
          'retry transcript indexing'
        );
        console.log(`Retry: Podcast transcript indexed successfully for ${podcastId}`);
      }
    } catch (indexError) {
      console.error(`Retry: Failed to index podcast transcript for ${podcastId}:`, indexError);
      // Don't fail the entire retry if indexing fails
      podcastErrorHandler.logError(
        indexError as Error,
        'Retry Transcript Indexing',
        { podcastId, stage: currentStage, critical: false, retryAttempt: true }
      );
    }

    podcastProgressTracker.updateProgress(podcastId, 'indexing', 100, 'Transcript indexed successfully');

    // Mark as completed
    currentStage = 'completion';
    await prisma.podcast.update({
      where: { id: podcastId },
      data: { 
        generationStatus: 'completed',
        actualDuration: Math.round(script.totalEstimatedDuration)
      }
    });

    podcastProgressTracker.completeProgress(podcastId);
    console.log(`Retry: Podcast generation completed successfully for ${podcastId}`);

  } catch (error) {
    console.error(`Retry: Podcast generation failed at stage ${currentStage} for ${podcastId}:`, error);
    
    const podcastError = podcastErrorHandler.handleError(error as Error, `retry generation - ${currentStage}`);
    
    // Log detailed error with retry context
    podcastErrorHandler.logError(podcastError, 'Retry Generation Failed', {
      podcastId,
      stage: currentStage,
      config,
      critical: true,
      retryAttempt: true
    });
    
    // Update status to failed
    await prisma.podcast.update({
      where: { id: podcastId },
      data: {
        generationStatus: 'failed',
        generationError: `Retry ${currentStage}: ${podcastError.message}`
      }
    });

    podcastProgressTracker.failProgress(podcastId, `Retry failed at ${currentStage}: ${podcastError.message}`);

    // Attempt cleanup
    try {
      await podcastErrorHandler.cleanupFailedGeneration(podcastId);
    } catch (cleanupError) {
      console.error(`Retry cleanup failed for ${podcastId}:`, cleanupError);
    }

    throw podcastError;
  }
}