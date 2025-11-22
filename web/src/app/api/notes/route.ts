import { NextRequest, NextResponse } from 'next/server';
import { NoteService } from '@/lib/note-service';
import { getUserFromAuth } from '@/lib/auth-helper';
import { ApiSuccessResponse, ApiErrorResponse, CreateNoteRequest } from '@/lib/types';
import { queueBackgroundTranslation } from '@/lib/translation-service';

const noteService = new NoteService();

// GET /api/notes - Get all notes for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);
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
      notes = await noteService.getNotesByTranscript(transcriptId);
    } else {
      notes = await noteService.getNotesByUser(userId);
    }

    const response: ApiSuccessResponse = {
      success: true,
      data: notes,
    };
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in GET /api/notes:', error);
    
    let errorMessage = 'Failed to retrieve notes';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes('Database table') || error.message.includes('does not exist')) {
        statusCode = 503;
        errorMessage = 'The notes service is currently unavailable. Please contact support if this persists.';
      } else if (error.message.includes('Database connection failed')) {
        statusCode = 503;
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
    const userId = await getUserFromAuth(request);
    const body: CreateNoteRequest = await request.json();
    const { title, content, transcriptId } = body;

    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Authentication required'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    if (!title || !content || !transcriptId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Title, content, and transcriptId are required'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Note: This endpoint is typically called after transcript creation,
    // but we still check the free tier limit for consistency
    // Import at top if not already imported
    const { FeatureGateService } = await import('@/lib/feature-gate-service');
    const accessCheck = await FeatureGateService.checkNoteCreationAccess();
    
    if (!accessCheck.allowed) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: accessCheck.message || 'Unable to create note',
        message: accessCheck.message,
        // @ts-ignore - adding extra fields for client
        notesUsed: accessCheck.notesUsed,
        notesLimit: accessCheck.notesLimit,
        upgradeUrl: accessCheck.upgradeUrl || '/pricing',
      };
      return NextResponse.json(errorResponse, { status: accessCheck.statusCode });
    }

    const note = await noteService.saveNote({
      title,
      content,
      transcriptId,
      userId,
    });

    // Queue background translation to all supported languages
    console.log('🌍 Queueing background translation for note:', note.id);
    queueBackgroundTranslation(note.id, note.title, note.content);

    const response: ApiSuccessResponse = {
      success: true,
      data: note,
    };
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in POST /api/notes:', error);
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to create note',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Handle OPTIONS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}