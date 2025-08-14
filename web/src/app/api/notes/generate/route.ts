import { NextRequest, NextResponse } from 'next/server';
import { NoteService } from '@/lib/note-service';
import { auth } from '@clerk/nextjs/server';
import { ApiSuccessResponse, ApiErrorResponse, GenerateNoteRequest } from '@/lib/types';

const noteService = new NoteService();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const body: GenerateNoteRequest = await request.json();
    const { transcriptId } = body;

    if (!transcriptId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Transcript ID is required'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Generate AI note from the transcript
    const note = await noteService.generateAINote(transcriptId, userId || undefined);

    const response: ApiSuccessResponse = {
      success: true,
      data: note,
    };
    return NextResponse.json(response);

  } catch (error) {
    console.error('AI note generation error:', error);
    
    // Check if error is related to insufficient credits
    if (error instanceof Error && error.message.includes('Insufficient credits')) {
      const creditErrorResponse: ApiErrorResponse = {
        success: false,
        error: 'Insufficient credits',
        message: error.message,
        redirectToPricing: true,
        redirectUrl: '/pricing'
      };
      return NextResponse.json(creditErrorResponse, { status: 403 });
    }
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to generate AI note',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Note Generation API',
    endpoints: {
      POST: '/api/notes/generate - Generate AI notes from transcript',
    },
    parameters: {
      transcriptId: 'Transcript ID to generate notes from (required)',
    },
  });
}
