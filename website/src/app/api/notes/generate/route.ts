import { NextRequest, NextResponse } from 'next/server';
import { NoteService } from '@/lib/services/note-service';
import { auth } from '@clerk/nextjs/server';
import { ApiSuccessResponse, ApiErrorResponse, GenerateNoteRequest } from '@/lib/types';

const noteService = new NoteService();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const body: GenerateNoteRequest = await request.json();
    const { transcriptId } = body;

    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Unauthorized'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    if (!transcriptId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Transcript ID is required'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Notes from existing transcripts are now free - no credit check needed
    // Only YouTube video processing (transcription + notes) costs 1 credit

    // Generate AI note from the transcript
    const note = await noteService.generateAINote(transcriptId, userId || undefined);

    // No credit deduction - notes from existing content are free

    const response: ApiSuccessResponse = {
      success: true,
      data: note,
    };
    return NextResponse.json(response);

  } catch (error) {
    console.error('AI note generation error:', error);
    
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
