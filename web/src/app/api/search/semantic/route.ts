import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { querySimilarChunks } from '../../../../lib/embedding-service';
import { prisma } from '../../../../lib/prisma';
import { ApiErrorResponse, SemanticSearchRequest, SemanticSearchResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Get the user session to authorize the request
    const { userId } = await auth();
    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Unauthorized'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }
    
    // User is authenticated via Clerk, we don't need to check the database
    
    // Parse the request body
    const { query, noteId, limit = 5 }: SemanticSearchRequest = await req.json();
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Query is required and must be a non-empty string'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
    
    // If noteId is provided, make sure the user has access to that note
    if (noteId) {
      const note = await prisma.note.findFirst({
        where: { 
          id: noteId,
          userId: userId
        },
      });
      
      if (!note) {
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: 'Note not found or unauthorized'
        };
        return NextResponse.json(errorResponse, { status: 404 });
      }
    }
    
    // Query for similar chunks
    const similarChunks = await querySimilarChunks(
      query,
      noteId,
      Math.min(Math.max(1, Number(limit)), 10) // Limit between 1 and 10
    );
    
    // Get the unique note IDs from the chunks
    const noteIds = Array.from(new Set(similarChunks.map(chunk => chunk.note_id)));
    
    // Fetch the full notes for these IDs, but only for the current user
    const notes = await prisma.note.findMany({
      where: { 
        id: { in: noteIds },
        userId: userId // Only return notes that belong to the current user
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    // Format the response to include both chunks and their parent notes
    const response: SemanticSearchResponse = {
      chunks: similarChunks.map(chunk => ({
        id: chunk.id,
        noteId: chunk.note_id,
        text: chunk.chunk_text,
        distance: chunk.distance,
      })),
      notes: notes.reduce((obj, note) => {
        obj[note.id] = {
          id: note.id,
          title: note.title,
          content: note.content || '',
          createdAt: note.createdAt.toISOString(),
          updatedAt: note.updatedAt.toISOString(),
        };
        return obj;
      }, {} as Record<string, any>),
    };
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in semantic search API:', error);
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to perform search',
      message: error.message
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
