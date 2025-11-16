import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromAuth } from '@/lib/auth-helper';
import { ApiResponse, ApiSuccessResponse, ApiErrorResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserFromAuth(request);
    const { id: noteId } = await params;

    // Get quiz record for the note (single record with JSON content)
    const quiz = await prisma.quiz.findUnique({
      where: { 
        noteId: noteId,
      }
    });

    const response: ApiSuccessResponse = {
      success: true,
      data: quiz
    };
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching quiz:', error);
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to fetch quiz',
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
    const userId = await getUserFromAuth(request);
    const { id: noteId } = await params;

    // Delete the quiz record for the note
    const deletedQuiz = await prisma.quiz.delete({
      where: { 
        noteId: noteId,
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Quiz deleted successfully'
    };
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error deleting quiz:', error);
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to delete quiz',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
