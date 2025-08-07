import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const transcriptId = params.id;

    if (!transcriptId) {
      return NextResponse.json(
        { error: 'Transcript ID is required' },
        { status: 400 }
      );
    }

    // Fetch transcript from database
    const transcript = await prisma.transcript.findUnique({
      where: {
        id: transcriptId,
      },
      select: {
        id: true,
        fileName: true,
        originalName: true,
        content: true,
        cleanContent: true,
        pages: true,
        metadata: true,
        type: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this transcript
    if (transcript.userId && transcript.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transcript,
    });

  } catch (error) {
    console.error('Error fetching transcript:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch transcript',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
