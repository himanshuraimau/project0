import { NextRequest, NextResponse } from 'next/server';
import { NoteService } from '@/lib/note-service';
import { auth } from '@clerk/nextjs/server';

const noteService = new NoteService();

interface Params {
  id: string;
}

// GET /api/notes/[id] - Get a specific note by ID
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const note = await noteService.getNote(id);

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this note
    if (note.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: note,
    });

  } catch (error) {
    console.error('Error retrieving note:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve note',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/notes/[id] - Update a specific note by ID
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    const body = await request.json();
    const { title, content } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // First, check if the note exists and belongs to the user
    const existingNote = await noteService.getNote(id);
    
    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    if (existingNote.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Update the note
    const updatedNote = await noteService.updateNote(id, { title, content });

    return NextResponse.json({
      success: true,
      data: updatedNote,
    });

  } catch (error) {
    console.error('Error updating note:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update note',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/notes/[id] - Delete a specific note by ID
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // First, check if the note exists and belongs to the user
    const existingNote = await noteService.getNote(id);
    
    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    if (existingNote.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete the note
    await noteService.deleteNote(id);

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting note:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete note',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
