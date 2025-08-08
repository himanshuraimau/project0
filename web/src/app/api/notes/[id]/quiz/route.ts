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

    // Get quiz record for the note (single record with JSON content)
    const quiz = await prisma.quiz.findUnique({
      where: { 
        noteId: noteId,
      }
    });

    return NextResponse.json({
      success: true,
      data: quiz
    });

  } catch (error) {
    console.error('Error fetching quiz:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch quiz',
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

    // Delete the quiz record for the note
    const deletedQuiz = await prisma.quiz.delete({
      where: { 
        noteId: noteId,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Quiz deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting quiz:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete quiz',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
