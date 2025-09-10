import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { NoteService } from '@/lib/note-service';
import { prisma } from '@/lib/prisma';
import { ApiErrorResponse, ApiSuccessResponse } from '@/lib/types';
import { Podcast, PodcastSegment } from '@/lib/types/podcast.types';

const noteService = new NoteService();

interface Params {
  id: string;
}

interface PodcastWithSegments extends Podcast {
  segments: PodcastSegment[];
}

// GET /api/podcasts/[id] - Get detailed podcast data with segments and transcript
export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { userId } = await auth();
    const { id: podcastId } = await params;

    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Authentication required'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Get podcast with segments using efficient join query
    const podcast = await prisma.podcast.findUnique({
      where: {
        id: podcastId
      },
      include: {
        segments: {
          orderBy: {
            sequenceOrder: 'asc'
          }
        }
      }
    });

    if (!podcast) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Podcast not found'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Check if user has access to this podcast
    // First check if podcast belongs to user directly
    if (podcast.userId && podcast.userId !== userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Access denied'
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    // If podcast doesn't have userId, check through the associated note
    if (!podcast.userId) {
      const note = await noteService.getNote(podcast.noteId);
      if (!note || note.userId !== userId) {
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: 'Access denied'
        };
        return NextResponse.json(errorResponse, { status: 403 });
      }
    }

    // Transform database records to match TypeScript interfaces
    const podcastData: Podcast = {
      id: podcast.id,
      noteId: podcast.noteId,
      userId: podcast.userId || undefined,
      title: podcast.title,
      description: podcast.description || undefined,
      language: podcast.language,
      durationPreset: podcast.durationPreset as 'short' | 'medium' | 'long',
      estimatedDuration: podcast.estimatedDuration || undefined,
      actualDuration: podcast.actualDuration || undefined,
      host1VoiceId: podcast.host1VoiceId,
      host1VoiceName: podcast.host1VoiceName,
      host2VoiceId: podcast.host2VoiceId,
      host2VoiceName: podcast.host2VoiceName,
      customInstructions: podcast.customInstructions || undefined,
      audioUrl: podcast.audioUrl || undefined,
      transcriptData: podcast.transcriptData as any || undefined,
      generationStatus: podcast.generationStatus as 'pending' | 'generating' | 'completed' | 'failed',
      generationError: podcast.generationError || undefined,
      createdAt: podcast.createdAt,
      updatedAt: podcast.updatedAt
    };

    const segments: PodcastSegment[] = podcast.segments.map(segment => ({
      id: segment.id,
      podcastId: segment.podcastId,
      speaker: segment.speaker as 'host1' | 'host2',
      content: segment.content,
      startTime: segment.startTime ? Number(segment.startTime) : undefined,
      endTime: segment.endTime ? Number(segment.endTime) : undefined,
      audioUrl: segment.audioUrl || undefined,
      sequenceOrder: segment.sequenceOrder,
      createdAt: segment.createdAt
    }));

    const responseData: PodcastWithSegments = {
      ...podcastData,
      segments
    };

    // Add caching headers for completed podcasts
    const headers: Record<string, string> = {};
    if (podcast.generationStatus === 'completed') {
      // Cache completed podcasts for 1 hour
      headers['Cache-Control'] = 'public, max-age=3600, s-maxage=3600';
      headers['ETag'] = `"${podcast.id}-${podcast.updatedAt.getTime()}"`;
      
      // Check if client has cached version
      const ifNoneMatch = request.headers.get('if-none-match');
      if (ifNoneMatch === headers['ETag']) {
        return new NextResponse(null, { status: 304, headers });
      }
    } else {
      // Don't cache in-progress or failed podcasts
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    }

    const response: ApiSuccessResponse = {
      success: true,
      data: responseData
    };

    return NextResponse.json(response, { headers });

  } catch (error) {
    console.error('Error retrieving podcast details:', error);
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to retrieve podcast details',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// PUT /api/podcasts/[id] - Update podcast metadata (title, description, etc.)
export async function PUT(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { userId } = await auth();
    const { id: podcastId } = await params;

    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Authentication required'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Parse request body
    let updateData: { title?: string; description?: string };
    try {
      updateData = await request.json();
    } catch (error) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Invalid request body',
        message: 'Request body must be valid JSON'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate update data
    if (!updateData.title && !updateData.description) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'No update data provided',
        message: 'At least one of title or description must be provided'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Get existing podcast
    const existingPodcast = await prisma.podcast.findUnique({
      where: { id: podcastId }
    });

    if (!existingPodcast) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Podcast not found'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Check access permissions
    if (existingPodcast.userId && existingPodcast.userId !== userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Access denied'
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    // If podcast doesn't have userId, check through the associated note
    if (!existingPodcast.userId) {
      const note = await noteService.getNote(existingPodcast.noteId);
      if (!note || note.userId !== userId) {
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: 'Access denied'
        };
        return NextResponse.json(errorResponse, { status: 403 });
      }
    }

    // Update podcast
    const updatedPodcast = await prisma.podcast.update({
      where: { id: podcastId },
      data: {
        title: updateData.title || existingPodcast.title,
        description: updateData.description !== undefined ? updateData.description : existingPodcast.description,
        updatedAt: new Date()
      }
    });

    // Transform to match interface
    const podcastData: Podcast = {
      id: updatedPodcast.id,
      noteId: updatedPodcast.noteId,
      userId: updatedPodcast.userId || undefined,
      title: updatedPodcast.title,
      description: updatedPodcast.description || undefined,
      language: updatedPodcast.language,
      durationPreset: updatedPodcast.durationPreset as 'short' | 'medium' | 'long',
      estimatedDuration: updatedPodcast.estimatedDuration || undefined,
      actualDuration: updatedPodcast.actualDuration || undefined,
      host1VoiceId: updatedPodcast.host1VoiceId,
      host1VoiceName: updatedPodcast.host1VoiceName,
      host2VoiceId: updatedPodcast.host2VoiceId,
      host2VoiceName: updatedPodcast.host2VoiceName,
      customInstructions: updatedPodcast.customInstructions || undefined,
      audioUrl: updatedPodcast.audioUrl || undefined,
      transcriptData: updatedPodcast.transcriptData as any || undefined,
      generationStatus: updatedPodcast.generationStatus as 'pending' | 'generating' | 'completed' | 'failed',
      generationError: updatedPodcast.generationError || undefined,
      createdAt: updatedPodcast.createdAt,
      updatedAt: updatedPodcast.updatedAt
    };

    const response: ApiSuccessResponse = {
      success: true,
      data: podcastData
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error updating podcast:', error);
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to update podcast',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// DELETE /api/podcasts/[id] - Delete a specific podcast
export async function DELETE(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { userId } = await auth();
    const { id: podcastId } = await params;

    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Authentication required'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Get existing podcast
    const existingPodcast = await prisma.podcast.findUnique({
      where: { id: podcastId }
    });

    if (!existingPodcast) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Podcast not found'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Check access permissions
    if (existingPodcast.userId && existingPodcast.userId !== userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Access denied'
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    // If podcast doesn't have userId, check through the associated note
    if (!existingPodcast.userId) {
      const note = await noteService.getNote(existingPodcast.noteId);
      if (!note || note.userId !== userId) {
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: 'Access denied'
        };
        return NextResponse.json(errorResponse, { status: 403 });
      }
    }

    // Delete podcast (cascade delete should handle segments)
    await prisma.podcast.delete({
      where: { id: podcastId }
    });

    // Note: UploadThing files are managed in the cloud and don't need explicit deletion
    // from this API route. They can be managed separately through UploadThing dashboard.

    const response: ApiSuccessResponse = {
      success: true,
      message: 'Podcast deleted successfully'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error deleting podcast:', error);
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to delete podcast',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}