import { NextRequest, NextResponse } from 'next/server';
import { TranscriptService } from '@/lib/transcript-service';
import { auth } from '@clerk/nextjs/server';
import { ApiSuccessResponse, ApiErrorResponse } from '@/lib/types';

const transcriptService = new TranscriptService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Authentication required'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const { id: transcriptId } = await params;

    if (!transcriptId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Transcript ID is required'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Fetch transcript from database using service
    const transcript = await transcriptService.getTranscript(transcriptId);

    if (!transcript) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Transcript not found'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Check if user has access to this transcript
    if (transcript.userId && transcript.userId !== userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Access denied'
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    const response: ApiSuccessResponse = {
      success: true,
      data: transcript,
    };
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching transcript:', error);

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to fetch transcript',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
