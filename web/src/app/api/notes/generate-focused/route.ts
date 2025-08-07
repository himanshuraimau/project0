import { NextRequest, NextResponse } from 'next/server';
import { NoteService } from '@/lib/note-service';
import { auth } from '@clerk/nextjs/server';

const noteService = new NoteService();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    const { transcriptId, noteType = 'summary' } = body;

    if (!transcriptId) {
      return NextResponse.json(
        { error: 'Transcript ID is required' },
        { status: 400 }
      );
    }

    const validNoteTypes = ['summary', 'detailed', 'action-items', 'technical', 'executive'];
    if (!validNoteTypes.includes(noteType)) {
      return NextResponse.json(
        { error: `Invalid note type. Must be one of: ${validNoteTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate focused AI note from the transcript
    const note = await noteService.generateFocusedNote(transcriptId, noteType, userId || undefined);

    return NextResponse.json({
      success: true,
      data: note,
    });

  } catch (error) {
    console.error('Focused AI note generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate focused AI note',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
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
