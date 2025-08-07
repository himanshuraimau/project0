import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

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

    return NextResponse.json({
      success: true,
      data: flashcard
    });

  } catch (error) {
    console.error('Error fetching flashcards:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch flashcards',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
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

    return NextResponse.json({
      success: true,
      message: `Deleted flashcard record with ${Array.isArray(deletedFlashcard.content) ? (deletedFlashcard.content as any[]).length : 0} flashcards`
    });

  } catch (error) {
    console.error('Error deleting flashcards:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete flashcards',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
