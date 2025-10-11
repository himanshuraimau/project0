import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { podcastService } from '@/lib/services/podcast-service';
import { ApiSuccessResponse, ApiErrorResponse } from '@/lib/types/api.types';

/**
 * GET /api/podcast/note/[noteId]
 * Retrieve all podcasts for a specific note
 * Requirements: 4.1, 7.5, 6.1
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { noteId: string } }
) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Authentication required',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Validate note ID parameter
    const noteId = params.noteId;
    if (!noteId || typeof noteId !== 'string' || noteId.trim().length === 0) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Invalid note ID',
        message: 'Note ID is required and must be a valid string',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const includeSuperseded = url.searchParams.get('includeSuperseded') === 'true';
    const latest = url.searchParams.get('latest') === 'true';

    // Get podcasts using service
    const service = podcastService.getInstance();
    
    let podcasts;
    let podcastHistory = null;
    
    if (latest) {
      // Get only the latest podcast for the note
      const latestPodcast = await service.getLatestPodcastForNote(noteId, userId);
      podcasts = latestPodcast ? [latestPodcast] : [];
    } else {
      // Get all podcasts for the note
      podcasts = await service.getPodcastsByNote(noteId, userId);
      
      // Get podcast history if there are multiple podcasts
      if (podcasts.length > 1) {
        try {
          podcastHistory = await service.getPodcastHistory(noteId, userId, includeSuperseded);
        } catch (error) {
          console.warn('Failed to get podcast history:', error);
          // Continue without history data
        }
      }
    }

    // Filter out superseded podcasts unless explicitly requested
    if (!includeSuperseded && !latest) {
      podcasts = podcasts.filter(podcast => podcast.status !== 'SUPERSEDED');
    }

    // Check if any podcasts were found and verify access
    if (podcasts.length > 0) {
      // Verify user has access to at least one podcast (which means they have access to the note)
      const hasAccess = podcasts.some(podcast => 
        (podcast.userId && podcast.userId === userId) ||
        (podcast.note?.userId && podcast.note.userId === userId)
      );

      if (!hasAccess) {
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: 'Unauthorized access',
          message: 'You do not have permission to access podcasts for this note',
        };
        return NextResponse.json(errorResponse, { status: 403 });
      }
    }

    // Sort podcasts by creation date (newest first)
    podcasts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Prepare response data
    const responseData: {
      podcasts: typeof podcasts;
      count: number;
      noteId: string;
      filters: {
        includeSuperseded: boolean;
        latest: boolean;
      };
      latest?: {
        completed: typeof podcasts[0] | null;
        inProgress: typeof podcasts[0] | null;
      };
      history?: typeof podcastHistory;
    } = {
      podcasts,
      count: podcasts.length,
      noteId,
      filters: {
        includeSuperseded,
        latest,
      },
    };

    // Add latest podcast information if multiple podcasts exist
    if (podcasts.length > 1 && !latest) {
      const latestCompleted = podcasts.find(p => p.status === 'COMPLETED');
      const latestInProgress = podcasts.find(p => 
        p.status === 'GENERATING' || p.status === 'IN_PROGRESS'
      );
      
      responseData.latest = {
        completed: latestCompleted || null,
        inProgress: latestInProgress || null,
      };
    }

    // Add history data if available
    if (podcastHistory) {
      responseData.history = podcastHistory;
    }

    // Return success response
    const successResponse: ApiSuccessResponse = {
      success: true,
      data: responseData,
    };
    return NextResponse.json(successResponse);

  } catch (error) {
    console.error('Error retrieving podcasts for note:', error);
    
    // Handle different types of errors
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for specific error types
      if (error.message.includes('Database')) {
        statusCode = 503; // Service Unavailable
        errorMessage = 'Database service is currently unavailable';
      } else if (error.message.includes('Failed to retrieve podcasts')) {
        statusCode = 500;
        errorMessage = 'Failed to retrieve podcast data';
      } else if (error.message.includes('Note not found')) {
        statusCode = 404;
        errorMessage = 'Note not found';
      }
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to retrieve podcasts',
      message: errorMessage,
    };
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}