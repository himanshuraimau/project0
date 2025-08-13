import { NextRequest, NextResponse } from 'next/server';
import { NoteService } from '@/lib/note-service';
import { auth } from '@clerk/nextjs/server';

const noteService = new NoteService();

// GET /api/notes - Get all notes for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);
    const transcriptId = searchParams.get('transcriptId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let notes;
    if (transcriptId) {
      // Get notes for specific transcript
      notes = await noteService.getNotesByTranscript(transcriptId);
    } else {
      // Get all notes for user
      notes = await noteService.getNotesByUser(userId);
    }

    return NextResponse.json({
      success: true,
      data: notes,
    });

  } catch (error) {
    console.error('Error retrieving notes:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve notes',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/notes - Create a new note
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    const { title, content, transcriptId } = body;

    if (!title || !content || !transcriptId) {
      return NextResponse.json(
        { error: 'Title, content, and transcriptId are required' },
        { status: 400 }
      );
    }

    const note = await noteService.saveNote({
      title,
      content,
      transcriptId,
      userId: userId || undefined,
    });

    return NextResponse.json({
      success: true,
      data: note,
    });

  } catch (error) {
    console.error('Error creating note:', error);
    
    // If insufficient credits, return the appropriate response
    if (error instanceof Error && (error as any).redirectToPricing) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient credits',
        message: error.message,
        redirectToPricing: true,
        redirectUrl: '/pricing'
      }, { status: 403 });
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create note',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
