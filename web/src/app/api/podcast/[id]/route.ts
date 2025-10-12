import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { podcastService } from '@/lib/services/podcast-service';
import { ApiSuccessResponse, ApiErrorResponse } from '@/lib/types/api.types';

/**
 * GET /api/podcast/[id]
 * Retrieve a specific podcast by ID
 * Requirements: 4.1, 7.5, 6.1
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Validate podcast ID parameter
    const resolvedParams = await params;
    const podcastId = resolvedParams.id;
    if (!podcastId || typeof podcastId !== 'string' || podcastId.trim().length === 0) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Invalid podcast ID',
        message: 'Podcast ID is required and must be a valid string',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Get podcast using service
    const service = podcastService.getInstance();
    const podcast = await service.getPodcast(podcastId);

    if (!podcast) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Podcast not found',
        message: `No podcast found with ID: ${podcastId}`,
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Check authorization - user must own the podcast or the associated note
    const hasAccess = 
      (podcast.userId && podcast.userId === userId) ||
      (podcast.note?.userId && podcast.note.userId === userId);

    if (!hasAccess) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Unauthorized access',
        message: 'You do not have permission to access this podcast',
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    // Return success response
    const successResponse: ApiSuccessResponse = {
      success: true,
      data: {
        podcast,
      },
    };
    return NextResponse.json(successResponse);

  } catch (error) {
    console.error('Error retrieving podcast:', error);
    
    // Handle different types of errors
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for specific error types
      if (error.message.includes('Database')) {
        statusCode = 503; // Service Unavailable
        errorMessage = 'Database service is currently unavailable';
      } else if (error.message.includes('Failed to retrieve podcast')) {
        statusCode = 500;
        errorMessage = 'Failed to retrieve podcast data';
      }
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to retrieve podcast',
      message: errorMessage,
    };
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * DELETE /api/podcast/[id]
 * Delete a specific podcast by ID
 * Requirements: 4.1, 7.5, 6.1
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Validate podcast ID parameter
    const podcastId = params.id;
    if (!podcastId || typeof podcastId !== 'string' || podcastId.trim().length === 0) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Invalid podcast ID',
        message: 'Podcast ID is required and must be a valid string',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Delete podcast using service (includes authorization checks)
    const service = podcastService.getInstance();
    
    try {
      const deleted = await service.deletePodcast(podcastId, userId);
      
      if (!deleted) {
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: 'Failed to delete podcast',
          message: 'Podcast deletion was not successful',
        };
        return NextResponse.json(errorResponse, { status: 500 });
      }

      // Return success response
      const successResponse: ApiSuccessResponse = {
        success: true,
        data: {
          message: 'Podcast deleted successfully',
          podcastId,
        },
      };
      return NextResponse.json(successResponse);

    } catch (serviceError) {
      // Handle service-specific errors
      let statusCode = 500;
      let errorMessage = 'Failed to delete podcast';

      if (serviceError instanceof Error) {
        if (serviceError.message.includes('not found')) {
          statusCode = 404;
          errorMessage = 'Podcast not found';
        } else if (serviceError.message.includes('Unauthorized')) {
          statusCode = 403;
          errorMessage = 'You do not have permission to delete this podcast';
        } else if (serviceError.message.includes('Database')) {
          statusCode = 503;
          errorMessage = 'Database service is currently unavailable';
        }
      }

      const errorResponse: ApiErrorResponse = {
        success: false,
        error: errorMessage,
        message: serviceError instanceof Error ? serviceError.message : 'Unknown error occurred',
      };
      return NextResponse.json(errorResponse, { status: statusCode });
    }

  } catch (error) {
    console.error('Error deleting podcast:', error);
    
    // Handle unexpected errors
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for specific error types
      if (error.message.includes('Database')) {
        statusCode = 503; // Service Unavailable
        errorMessage = 'Database service is currently unavailable';
      } else if (error.message.includes('Authentication')) {
        statusCode = 401;
      } else if (error.message.includes('Authorization') || error.message.includes('permission')) {
        statusCode = 403;
      }
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to delete podcast',
      message: errorMessage,
    };
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}