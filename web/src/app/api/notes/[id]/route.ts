import { NextRequest, NextResponse } from 'next/server';
import { NoteService } from '@/lib/note-service';
import { auth } from '@clerk/nextjs/server';
import { ApiResponse, ApiSuccessResponse, ApiErrorResponse, UpdateNoteRequest } from '@/lib/types';

const noteService = new NoteService();

interface Params {
  id: string;
}

// GET /api/notes/[id] - Get a specific note by ID
export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Authentication required'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const note = await noteService.getNote(id);

    if (!note) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Note not found'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Check if user has access to this note
    if (note.userId !== userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Access denied'
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    const response: ApiSuccessResponse = {
      success: true,
      data: note,
    };
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error retrieving note:', error);
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to retrieve note',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// PUT /api/notes/[id] - Update a specific note by ID
export async function PUT(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    const body: UpdateNoteRequest = await request.json();
    const { title, content } = body;

    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Authentication required'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // First, check if the note exists and belongs to the user
    const existingNote = await noteService.getNote(id);
    
    if (!existingNote) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Note not found'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    if (existingNote.userId !== userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Access denied'
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    // Update the note
    const updatedNote = await noteService.updateNote(id, { title, content });

    const response: ApiSuccessResponse = {
      success: true,
      data: updatedNote,
    };
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error updating note:', error);
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to update note',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// DELETE /api/notes/[id] - Delete a specific note by ID
export async function DELETE(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Authentication required'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // First, check if the note exists and belongs to the user
    const existingNote = await noteService.getNote(id);
    
    if (!existingNote) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Note not found'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    if (existingNote.userId !== userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Access denied'
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    // Delete the note (this will also clean up associated podcasts and audio files)
    await noteService.deleteNote(id);

    const response: ApiResponse = {
      success: true,
      message: 'Note and associated content deleted successfully',
    };
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error deleting note:', error);
    
    // Provide more specific error messages for different failure scenarios
    let errorMessage = 'Failed to delete note';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        errorMessage = 'Cannot delete note due to existing dependencies';
        statusCode = 409;
      } else if (error.message.includes('Record to delete does not exist')) {
        errorMessage = 'Note not found or already deleted';
        statusCode = 404;
      } else {
        errorMessage = error.message;
      }
    }
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: errorMessage,
      message: error instanceof Error ? error.message : 'Unknown error occurred during note deletion'
    };
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
