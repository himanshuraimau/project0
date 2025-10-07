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

    // Check if note has sufficient content - be more lenient
    if (!note.content || note.content.trim().length < 10) {
      return PodcastApiErrorHandler.createValidationErrorResponse(
        ['Note must have at least 10 characters of content to generate a podcast'],
        'content validation'
      );
    }

    // Check if podcast already exists for this note
    const existingPodcast = await prisma.podcast.findFirst({
      where: {
        noteId: noteId
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
      } else if (existingPodcast.generationStatus === 'pending' || existingPodcast.generationStatus === 'generating') {
        return PodcastApiErrorHandler.createConflictResponse(
          'A podcast is currently being generated for this note',
          [
            'Wait for the current generation to complete',
            'Check the podcast status in a few minutes',
            'Cancel the current generation if possible'
          ]
        );
      } else if (existingPodcast.generationStatus === 'failed') {
        // For failed podcasts, delete the old record and allow retry
        await prisma.podcast.delete({
          where: { id: existingPodcast.id }
        });
        console.log(`Deleted failed podcast record ${existingPodcast.id} to allow retry for note ${noteId}`);
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

    // Generate actual audio using ElevenLabs TTS
    currentStage = 'audio_generation';
    console.log(`Starting audio generation for podcast ${podcastId}`);
    
    const podcastRecord = await prisma.podcast.findUnique({
      where: { id: podcastId },
      select: { 
        title: true, 
        language: true, 
        durationPreset: true, 
        noteId: true,
        userId: true,
        host1VoiceId: true,
        host2VoiceId: true
      }
    });
    
    if (!podcastRecord) {
      throw new Error('Podcast record not found');
    }

    // Generate audio for ALL script segments
    const audioSegments: Buffer[] = [];
    let totalDuration = 0;
    
    console.log(`🎵 Generating audio for ${script.segments.length} segments...`);
    
    for (let i = 0; i < script.segments.length; i++) {
      const segment = script.segments[i];
      const segmentNumber = i + 1;
      
      try {
        console.log(`� Generating segment ${segmentNumber}/${script.segments.length} (${segment.speaker}): ${segment.content.substring(0, 50)}...`);
        
        // Determine voice ID based on speaker
        const voiceId = segment.speaker === 'host1' ? 
          podcastRecord.host1VoiceId : podcastRecord.host2VoiceId;
          
        if (!voiceId) {
          throw new Error(`Voice ID not configured for ${segment.speaker}`);
        }
        
        // Call ElevenLabs TTS API directly
        const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
        if (!ELEVENLABS_API_KEY) {
          throw new Error('ElevenLabs API key not configured');
        }

        const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: segment.content,
            model_id: 'eleven_flash_v2_5',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.8,
              style: 0.0,
              use_speaker_boost: true
            }
          })
        });

        if (!ttsResponse.ok) {
          const errorText = await ttsResponse.text();
          console.error(`❌ TTS error for segment ${segmentNumber}:`, ttsResponse.status, errorText);
          throw new Error(`TTS API error for segment ${segmentNumber}: ${ttsResponse.status} - ${errorText}`);
        }

        const segmentAudioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
        audioSegments.push(segmentAudioBuffer);
        
        // Estimate duration (rough calculation: MP3 audio is ~16KB per second at 128kbps)
        const segmentDuration = segmentAudioBuffer.length / (16 * 1024);
        totalDuration += segmentDuration;
        
        console.log(`✅ Generated segment ${segmentNumber} (${segmentAudioBuffer.length} bytes, ~${segmentDuration.toFixed(1)}s)`);
        
        // Add silence between segments (except after the last one)
        if (i < script.segments.length - 1) {
          // Generate 1 second of silence (approximate for MP3)
          const silenceBuffer = Buffer.alloc(16 * 1024, 0); // ~1 second of silence
          audioSegments.push(silenceBuffer);
          totalDuration += 1.0; // Add 1 second for silence
          console.log(`🔇 Added 1 second silence buffer`);
        }
        
        // Add a small delay between TTS calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (segmentError) {
        console.error(`❌ Error generating segment ${segmentNumber}:`, segmentError);
        throw new Error(`Audio generation failed for segment ${segmentNumber}: ${segmentError}`);
      }
    }

    // Combine all audio segments into one file
    console.log(`🔗 Combining ${audioSegments.length} audio segments...`);
    const finalAudioBuffer = Buffer.concat(audioSegments);
    
    if (!finalAudioBuffer || finalAudioBuffer.length === 0) {
      throw new Error('No audio content generated');
    }
    
    console.log(`✅ Combined audio: ${finalAudioBuffer.length} bytes, ~${totalDuration.toFixed(1)}s total duration`);

    // Upload the audio using UploadThing
    currentStage = 'audio_upload';
    const { uploadThingAudioStorageService } = await import('@/lib/eleven-labs/uploadthing-audio-storage-service');
    
    try {
      const audioUrl = await uploadThingAudioStorageService.uploadPodcastAudio(finalAudioBuffer, {
        podcastId,
        noteId: podcastRecord.noteId,
        userId: podcastRecord.userId || undefined,
        title: podcastRecord.title,
        language: podcastRecord.language,
        durationPreset: podcastRecord.durationPreset
      });
      
      // Update podcast with audio URL and actual duration
      await prisma.podcast.update({
        where: { id: podcastId },
        data: { 
          audioUrl,
          actualDuration: Math.round(totalDuration)
        }
      });
      
      console.log(`✅ Audio uploaded successfully for podcast ${podcastId}: ${audioUrl}`);
      console.log(`File size: ${finalAudioBuffer.length} bytes, Duration: ${totalDuration.toFixed(1)}s`);
    } catch (uploadError) {
      console.error(`❌ Failed to upload audio for podcast ${podcastId}:`, uploadError);
      throw uploadError;
    }


    // const audioSegments = await podcastService.synthesizeAudio(script, config);
    // const finalAudio = await podcastService.assembleAudio(audioSegments);
    // const savedPodcast = await podcastService.savePodcast(finalAudio, metadata, noteId, userId);

    // Save podcast segments to database for transcript indexing
    // Calculate approximate timings based on word count (150 words per minute average speaking rate)
    let cumulativeTime = 0;
    const segmentPromises = script.segments.map(async (segment, index) => {
      const wordCount = segment.content.split(/\s+/).length;
      const estimatedDuration = (wordCount / 150) * 60; // Convert to seconds
      const startTime = cumulativeTime;
      const endTime = cumulativeTime + estimatedDuration;
      
      // Add 1 second pause between segments (except last one)
      cumulativeTime = endTime + (index < script.segments.length - 1 ? 1 : 0);
      
      return prisma.podcastSegment.create({
        data: {
          podcastId: podcastId,
          speaker: segment.speaker,
          content: segment.content,
          startTime: startTime,
          endTime: endTime,
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