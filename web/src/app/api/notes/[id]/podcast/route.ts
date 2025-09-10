import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { NoteService } from '@/lib/note-service';
import { prisma } from '@/lib/prisma';
import { ApiErrorResponse, ApiSuccessResponse } from '@/lib/types';
import { Podcast } from '@/lib/types/podcast.types';

const noteService = new NoteService();

interface Params {
  id: string;
}

// GET /api/notes/[id]/podcast - Get podcast data associated with a note
export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
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

    // Get podcast data for this note
    const podcast = await prisma.podcast.findFirst({
      where: {
        noteId: noteId
      },
      orderBy: {
        createdAt: 'desc' // Get the most recent podcast if multiple exist
      }
    });

    if (!podcast) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'No podcast found for this note'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Transform database record to match Podcast interface
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
      data: podcastData
    };

    return NextResponse.json(response, { headers });

  } catch (error) {
    console.error('Error retrieving podcast:', error);
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to retrieve podcast',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// DELETE /api/notes/[id]/podcast - Delete podcast associated with a note
export async function DELETE(request: NextRequest, { params }: { params: Promise<Params> }) {
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

    // Find podcast for this note
    const podcast = await prisma.podcast.findFirst({
      where: {
        noteId: noteId
      }
    });

    if (!podcast) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'No podcast found for this note'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Delete podcast and related segments (cascade delete should handle segments)
    await prisma.podcast.delete({
      where: {
        id: podcast.id
      }
    });

    // TODO: Also delete audio files from Vercel Blob storage when implemented
    // if (podcast.audioUrl) {
    //   await deleteFromBlobStorage(podcast.audioUrl);
    // }

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