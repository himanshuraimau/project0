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

const noteService = new NoteService();
const podcastService = new PodcastService();

interface Params {
  id: string;
}

// POST /api/notes/[id]/podcast/generate - Generate a podcast from note content
export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { userId } = await auth();
    const { id: noteId } = await params;

    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Authentication required'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Parse and validate request body
    let requestBody: GeneratePodcastRequest;
    try {
      requestBody = await request.json();
    } catch (error) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Invalid request body',
        message: 'Request body must be valid JSON'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate required fields
    const { 
      language, 
      durationPreset, 
      host1VoiceId, 
      host1VoiceName, 
      host2VoiceId, 
      host2VoiceName,
      customInstructions 
    } = requestBody;

    if (!language || !durationPreset || !host1VoiceId || !host1VoiceName || !host2VoiceId || !host2VoiceName) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Missing required fields',
        message: 'language, durationPreset, host1VoiceId, host1VoiceName, host2VoiceId, and host2VoiceName are required'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate duration preset
    if (!['short', 'medium', 'long'].includes(durationPreset)) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Invalid duration preset',
        message: 'durationPreset must be one of: short, medium, long'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate voice IDs are different
    if (host1VoiceId === host2VoiceId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Invalid voice configuration',
        message: 'Host voices must be different'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Check if note exists and user has access
    const note = await noteService.getNote(noteId);
    if (!note) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Note not found'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    if (note.userId !== userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Access denied'
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    // Check if note has sufficient content
    if (!note.content || note.content.trim().length < 50) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Insufficient content',
        message: 'Note must have at least 50 characters of content to generate a podcast'
      };
      return NextResponse.json(errorResponse, { status: 400 });
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
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: 'Podcast already exists',
          message: 'A podcast has already been generated for this note'
        };
        return NextResponse.json(errorResponse, { status: 409 });
      } else {
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: 'Podcast generation in progress',
          message: 'A podcast is currently being generated for this note'
        };
        return NextResponse.json(errorResponse, { status: 409 });
      }
    }

    // Validate podcast configuration
    const config = {
      language,
      durationPreset,
      host1VoiceId,
      host1VoiceName,
      host2VoiceId,
      host2VoiceName,
      customInstructions
    };

    const validation = podcastService.validateConfiguration(config);
    if (!validation.isValid) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Invalid configuration',
        message: validation.errors.join(', ')
      };
      return NextResponse.json(errorResponse, { status: 400 });
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

    // Start background podcast generation (fire and forget)
    // This will update the podcast status as it progresses
    generatePodcastInBackground(podcast.id, note.content, config).catch(error => {
      console.error('Background podcast generation failed:', error);
      // Update podcast status to failed
      prisma.podcast.update({
        where: { id: podcast.id },
        data: {
          generationStatus: 'failed',
          generationError: error instanceof Error ? error.message : 'Unknown error'
        }
      }).catch(dbError => {
        console.error('Failed to update podcast status:', dbError);
      });
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

  } catch (error) {
    console.error('Error generating podcast:', error);

    if (error instanceof PodcastGenerationError) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: error.message,
        message: error.details ? JSON.stringify(error.details) : undefined
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to generate podcast',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * Background function to handle podcast generation
 * This runs asynchronously and updates the podcast status as it progresses
 */
async function generatePodcastInBackground(
  podcastId: string, 
  noteContent: string, 
  config: any
): Promise<void> {
  try {
    // Update status to generating
    await prisma.podcast.update({
      where: { id: podcastId },
      data: { generationStatus: 'generating' }
    });

    // Generate script
    console.log(`Starting script generation for podcast ${podcastId}`);
    const script = await podcastService.generateScript(noteContent, config);
    
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
    try {
      const noteRecord = await prisma.podcast.findUnique({
        where: { id: podcastId },
        select: { noteId: true }
      });
      
      if (noteRecord) {
        await podcastService.indexPodcastTranscript(podcastId, noteRecord.noteId);
        console.log(`Podcast transcript indexed successfully for ${podcastId}`);
      }
    } catch (indexError) {
      console.error(`Failed to index podcast transcript for ${podcastId}:`, indexError);
      // Don't fail the entire operation if indexing fails
    }

    // For now, mark as completed with script generation only
    await prisma.podcast.update({
      where: { id: podcastId },
      data: { 
        generationStatus: 'completed',
        actualDuration: Math.round(script.totalEstimatedDuration)
      }
    });

    console.log(`Podcast generation completed for ${podcastId}`);

  } catch (error) {
    console.error(`Podcast generation failed for ${podcastId}:`, error);
    
    // Update status to failed
    await prisma.podcast.update({
      where: { id: podcastId },
      data: {
        generationStatus: 'failed',
        generationError: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    throw error;
  }
}