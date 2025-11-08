import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/services/prisma';
import { indexChapterContent } from '@/lib/api/courses/chapter-embedding-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { userId } = await auth();
    const { chapterId } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the chapter with its content
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: {
        id: true,
        name: true,
        notes: true,
        transcript: true,
      }
    });

    if (!chapter) {
      return NextResponse.json(
        { success: false, error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Index the chapter content
    await indexChapterContent(
      chapterId,
      chapter.notes || undefined,
      chapter.transcript || undefined
    );

    return NextResponse.json({
      success: true,
      message: 'Chapter content indexed successfully'
    });

  } catch (error) {
    console.error('Error indexing chapter content:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to index chapter content',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  const { chapterId } = await params;
  
  return NextResponse.json({
    message: `Chapter ${chapterId} indexing endpoint is ready`,
    methods: ['POST']
  });
}