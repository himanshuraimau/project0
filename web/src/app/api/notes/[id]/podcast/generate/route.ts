import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { NoteService } from '@/lib/note-service';
import { PodcastService } from '@/lib/podcast-service';
import { prisma } from '@/lib/prisma';
import { 
  GeneratePodcastRequest, 
  GeneratePodcastResponse,
  PodcastGenerationError 
} from '@/lib/types/podcast.types';
import { ApiErrorResponse } from '@/lib/types';
import { PodcastApiErrorHandler } from '@/lib/utils/podcast-api-error-handler';
import { podcastErrorHandler } from '@/lib/utils/podcast-error-handler';

const noteService = new NoteService();
const podcastService = new PodcastService();

interface Params {
  id: string;
}

// POST /api/notes/[id]/podcast/generate - Generate a podcast from note content
export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  return PodcastApiErrorHandler.withErrorHandling(async () => {
    const { userId } = await auth();
    const { id: noteId } = await params;

    if (!userId) {
      return PodcastApiErrorHandler.createAuthErrorResponse();
    }

    // Parse and validate request body
    let requestBody: GeneratePodcastRequest;
    try {
      requestBody = await request.json();
    } catch (error) {
      return PodcastApiErrorHandler.createValidationErrorResponse(
        ['Request body must be valid JSON'],
        'request parsing'
      );
    }

    // Validate and sanitize configuration
    const validation = podcastErrorHandler.validateAndSanitizeConfig(requestBody);
    if (!validation.isValid) {
      return PodcastApiErrorHandler.createValidationErrorResponse(
        validation.errors,
        'configuration validation'
      );
    }

    const config = validation.sanitizedConfig!;
    const { 
      language, 
      durationPreset, 
      host1VoiceId, 
      host1VoiceName, 
      host2VoiceId, 
      host2VoiceName,
      customInstructions 
    } = config;

    // Check if note exists and user has access
    const note = await noteService.getNote(noteId);
    if (!note) {
      return PodcastApiErrorHandler.createNotFoundResponse('Note');
    }

    if (note.userId !== userId) {
      return PodcastApiErrorHandler.createErrorResponse(
        'You do not have permission to access this note',
        'authorization check',
        403
      );
    }

    // Check if note has sufficient content
    if (!note.content || note.content.trim().length < 50) {
      return PodcastApiErrorHandler.createValidationErrorResponse(
        ['Note must have at least 50 characters of content to generate a podcast'],
        'content validation'
      );
    }

    // Check if podcast already exists for this note
    const existingPodcast = await prisma.podcast.findFirst({
      where: {
        noteId: noteId,
        generationStatus: {
          in: ['pending', 'generating', 'completed']
        }
      }
    });

    if (existingPodcast) {
      if (existingPodcast.generationStatus === 'completed') {
        return PodcastApiErrorHandler.createConflictResponse(
          'A podcast has already been generated for this note',
          [
            'Delete the existing podcast first if you want to create a new one',
            'Use the existing podcast or modify your note content',
            'Try generating a podcast for a different note'
          ]
        );
      } else {
        return PodcastApiErrorHandler.createConflictResponse(
          'A podcast is currently being generated for this note',
          [
            'Wait for the current generation to complete',
            'Check the podcast status in a few minutes',
            'Cancel the current generation if possible'
          ]
        );
      }
    }

    // Additional service-level validation
    const serviceValidation = podcastService.validateConfiguration(config);
    if (!serviceValidation.isValid) {
      return PodcastApiErrorHandler.createValidationErrorResponse(
        serviceValidation.errors,
        'service configuration validation'
      );
    }

    // Estimate duration
    const estimatedDuration = podcastService.estimateDuration(note.content, durationPreset);

    // Create podcast record with pending status
    const podcast = await prisma.podcast.create({
      data: {
        noteId: noteId,
        userId: userId,
        title: note.title || 'Untitled Podcast',
        description: `AI-generated podcast from note: ${note.title}`,
        language: language,
        durationPreset: durationPreset,
        estimatedDuration: Math.round(estimatedDuration),
        host1VoiceId: host1VoiceId,
        host1VoiceName: host1VoiceName,
        host2VoiceId: host2VoiceId,
        host2VoiceName: host2VoiceName,
        customInstructions: customInstructions,
        generationStatus: 'pending'
      }
    });

    // Start background podcast generation with enhanced error handling
    generatePodcastInBackground(podcast.id, note.content, config).catch(async (error) => {
      console.error('Background podcast generation failed:', error);
      
      // Enhanced error handling and cleanup
      try {
        await podcastErrorHandler.cleanupFailedGeneration(podcast.id);
        
        const podcastError = error instanceof PodcastGenerationError 
          ? error 
          : podcastErrorHandler.handleError(error, 'background generation');
        
        await prisma.podcast.update({
          where: { id: podcast.id },
          data: {
            generationStatus: 'failed',
            generationError: podcastError.message
          }
        });
        
        // Log detailed error information
        podcastErrorHandler.logError(podcastError, 'Background Generation', {
          podcastId: podcast.id,
          noteId: noteId,
          userId: userId,
          config: config
        });
        
      } catch (cleanupError) {
        console.error('Failed to handle generation failure:', cleanupError);
      }
    });

    const response: GeneratePodcastResponse = {
      success: true,
      data: {
        id: podcast.id,
        status: 'pending',
        estimatedDuration: Math.round(estimatedDuration)
      }
    };

    return NextResponse.json(response, { status: 202 }); // 202 Accepted for async processing
  }, 'podcast generation');
}

/**
 * Background function to handle podcast generation with enhanced error handling
 * This runs asynchronously and updates the podcast status as it progresses
 */
async function generatePodcastInBackground(
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

    // Generate script with retry logic
    currentStage = 'script_generation';
    console.log(`Starting script generation for podcast ${podcastId}`);
    
    const script = await podcastErrorHandler.retryWithBackoff(
      () => podcastService.generateScript(noteContent, config),
      3,
      'script generation'
    );
    
    // Update estimated duration based on actual script
    await prisma.podcast.update({
      where: { id: podcastId },
      data: { 
        estimatedDuration: Math.round(script.totalEstimatedDuration),
        transcriptData: {
          segments: script.segments.map(segment => ({
            speaker: segment.speaker,
            content: segment.content,
            startTime: 0, // Will be updated after audio generation
            endTime: 0,   // Will be updated after audio generation
            sequenceOrder: segment.sequenceOrder
          })),
          totalDuration: script.totalEstimatedDuration,
          speakers: script.metadata.hosts
        }
      }
    });

    // TODO: Continue with audio synthesis when implemented
    // const audioSegments = await podcastService.synthesizeAudio(script, config);
    // const finalAudio = await podcastService.assembleAudio(audioSegments);
    // const savedPodcast = await podcastService.savePodcast(finalAudio, metadata, noteId, userId);

    // Save podcast segments to database for transcript indexing
    const segmentPromises = script.segments.map(async (segment, index) => {
      return prisma.podcastSegment.create({
        data: {
          podcastId: podcastId,
          speaker: segment.speaker,
          content: segment.content,
          startTime: 0, // Will be updated when audio is generated
          endTime: segment.estimatedDuration || 0,
          sequenceOrder: segment.sequenceOrder
        }
      });
    });

    await Promise.all(segmentPromises);

    // Index podcast transcript for chatbot integration
    currentStage = 'transcript_indexing';
    try {
      const noteRecord = await prisma.podcast.findUnique({
        where: { id: podcastId },
        select: { noteId: true }
      });
      
      if (noteRecord) {
        await podcastErrorHandler.retryWithBackoff(
          () => podcastService.indexPodcastTranscript(podcastId, noteRecord.noteId),
          2,
          'transcript indexing'
        );
        console.log(`Podcast transcript indexed successfully for ${podcastId}`);
      }
    } catch (indexError) {
      console.error(`Failed to index podcast transcript for ${podcastId}:`, indexError);
      // Don't fail the entire operation if indexing fails
      podcastErrorHandler.logError(
        indexError as Error,
        'Transcript Indexing',
        { podcastId, stage: currentStage, critical: false }
      );
    }

    // Mark as completed with script generation
    currentStage = 'completion';
    await prisma.podcast.update({
      where: { id: podcastId },
      data: { 
        generationStatus: 'completed',
        actualDuration: Math.round(script.totalEstimatedDuration)
      }
    });

    console.log(`Podcast generation completed for ${podcastId}`);

  } catch (error) {
    console.error(`Podcast generation failed at stage ${currentStage} for ${podcastId}:`, error);
    
    // Enhanced error handling with stage information
    const podcastError = error instanceof PodcastGenerationError 
      ? error 
      : podcastErrorHandler.handleError(error as Error, `background generation - ${currentStage}`);
    
    // Log detailed error with stage information
    podcastErrorHandler.logError(podcastError, 'Background Generation Failed', {
      podcastId,
      stage: currentStage,
      config,
      critical: true
    });
    
    // Update status to failed with detailed error information
    await prisma.podcast.update({
      where: { id: podcastId },
      data: {
        generationStatus: 'failed',
        generationError: `${currentStage}: ${podcastError.message}`
      }
    });

    // Attempt cleanup
    try {
      await podcastErrorHandler.cleanupFailedGeneration(podcastId);
    } catch (cleanupError) {
      console.error(`Cleanup failed for ${podcastId}:`, cleanupError);
    }

    throw podcastError;
  }
}