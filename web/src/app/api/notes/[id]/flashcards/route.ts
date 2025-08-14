import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { ApiResponse, ApiSuccessResponse, ApiErrorResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id: noteId } = await params;

    // Get flashcard record for the note (single record with JSON content)
    const flashcard = await prisma.flashcard.findUnique({
      where: { 
        noteId: noteId,
      }
    });

    const response: ApiSuccessResponse = {
      success: true,
      data: flashcard
    };
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching flashcards:', error);
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to fetch flashcards',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id: noteId } = await params;

    // Delete flashcard record for the note
    const deletedFlashcard = await prisma.flashcard.delete({
      where: { 
        noteId: noteId,
      }
    });

    const response: ApiResponse = {
      success: true,
      message: `Deleted flashcard record with ${Array.isArray(deletedFlashcard.content) ? (deletedFlashcard.content as any[]).length : 0} flashcards`
    };
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error deleting flashcards:', error);
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to delete flashcards',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
