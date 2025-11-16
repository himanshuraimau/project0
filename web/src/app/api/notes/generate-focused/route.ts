import { NextRequest, NextResponse } from 'next/server';
import { NoteService } from '@/lib/note-service';
import { UserService } from '@/lib/user-service';
import { getUserFromAuth } from '@/lib/auth-helper';
import { ApiSuccessResponse, ApiErrorResponse, NoteType } from '@/lib/types';

const noteService = new NoteService();

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);
    const body: { transcriptId: string; noteType?: NoteType } = await request.json();
    const { transcriptId, noteType = 'summary' } = body;

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

    const validNoteTypes: NoteType[] = ['summary', 'detailed', 'action-items', 'technical', 'executive'];
    if (!validNoteTypes.includes(noteType)) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: `Invalid note type. Must be one of: ${validNoteTypes.join(', ')}`
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Focused notes from existing transcripts are now free - no credit check needed

    // Generate focused AI note from the transcript
    const note = await noteService.generateFocusedNote(transcriptId, noteType, userId || undefined);

    // No credit deduction - focused notes from existing content are free

    const response: ApiSuccessResponse = {
      success: true,
      data: note,
    };
    return NextResponse.json(response);

  } catch (error) {
    console.error('Focused AI note generation error:', error);

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to generate focused AI note',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Focused AI Note Generation API',
    endpoints: {
      POST: '/api/notes/generate-focused - Generate focused AI notes from transcript',
    },
    parameters: {
      transcriptId: 'Transcript ID to generate notes from (required)',
      noteType: 'Type of notes to generate: summary, detailed, action-items, technical, executive (default: summary)',
    },
    noteTypes: {
      summary: 'Concise executive summary focusing on key points',
      detailed: 'Comprehensive analysis with detailed explanations',
      'action-items': 'Focus on actionable items and recommendations',
      technical: 'Emphasize technical details and methodologies',
      executive: 'Executive briefing for decision-makers'
    }
  });
}
