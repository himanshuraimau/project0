import { NextRequest, NextResponse } from 'next/server';
import { NoteService } from '@/lib/note-service';
import { auth } from '@clerk/nextjs/server';

const noteService = new NoteService();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    const { transcriptId } = body;

    if (!transcriptId) {
      return NextResponse.json(
        { error: 'Transcript ID is required' },
        { status: 400 }
      );
    }

    // Generate AI note from the transcript
    const note = await noteService.generateAINote(transcriptId, userId || undefined);

    return NextResponse.json({
      success: true,
      data: note,
    });

  } catch (error) {
    console.error('AI note generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate AI note',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
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
