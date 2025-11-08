import { NextRequest, NextResponse } from 'next/server';
import { NoteService } from '@/lib/services/note-service';
import { auth } from '@clerk/nextjs/server';
import { ApiSuccessResponse, ApiErrorResponse, CreateNoteRequest } from '@/lib/types';

const noteService = new NoteService();

// GET /api/notes - Get all notes for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);
    const transcriptId = searchParams.get('transcriptId');

    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Authentication required'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    let notes;
    if (transcriptId) {
      // Get notes for specific transcript
      notes = await noteService.getNotesByTranscript(transcriptId);
    } else {
      // Get all notes for user
      notes = await noteService.getNotesByUser(userId);
    }

    const response: ApiSuccessResponse = {
      success: true,
      data: notes,
    };
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error retrieving notes:', error);
    
    let errorMessage = 'Failed to retrieve notes';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Provide more specific status codes based on error type
      if (error.message.includes('Database table') || error.message.includes('does not exist')) {
        statusCode = 503; // Service Unavailable
        errorMessage = 'The notes service is currently unavailable. Please contact support if this persists.';
      } else if (error.message.includes('Database connection failed')) {
        statusCode = 503; // Service Unavailable
        errorMessage = 'Unable to connect to the database. Please try again later.';
      } else if (error.message.includes('Authentication') || error.message.includes('unauthorized')) {
        statusCode = 401;
      } else if (error.message.includes('not found')) {
        statusCode = 404;
      }
    }
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to retrieve notes',
      message: errorMessage
    };
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// POST /api/notes - Create a new note
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const body: CreateNoteRequest = await request.json();
    const { title, content, transcriptId } = body;

    if (!title || !content || !transcriptId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Title, content, and transcriptId are required'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const note = await noteService.saveNote({
      title,
      content,
      transcriptId,
      userId: userId || undefined,
    });

    const response: ApiSuccessResponse = {
      success: true,
      data: note,
    };
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error creating note:', error);
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to create note',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
