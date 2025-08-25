import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { getTranscript } from '@/lib/course/youtube';

export async function GET(
  request: NextRequest,
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

    if (!chapterId) {
      return NextResponse.json(
        { success: false, error: 'Chapter ID is required' },
        { status: 400 }
      );
    }

    // Get the chapter with its video ID
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        unit: {
          include: {
            course: true
          }
        }
      }
    });

    if (!chapter) {
      return NextResponse.json(
        { success: false, error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Verify that the user owns this course
    if (chapter.unit.course.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if chapter has a video ID
    if (!chapter.videoId) {
      return NextResponse.json(
        { success: false, error: 'No video available for this chapter' },
        { status: 400 }
      );
    }

    // Get the transcript
    const transcriptText = await getTranscript(chapter.videoId);

    if (!transcriptText || transcriptText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'No transcript available for this video' },
        { status: 404 }
      );
    }

    // Parse transcript into segments (simple approach - split by sentences)
    const segments = transcriptText
      .split(/[.!?]+/)
      .filter(segment => segment.trim().length > 0)
      .map((segment, index) => ({
        id: index,
        text: segment.trim() + '.',
        startTime: `${Math.floor(index * 10 / 60)}:${String(Math.floor(index * 10) % 60).padStart(2, '0')}`,
        startMs: index * 10000, // Approximate timing
        endMs: (index + 1) * 10000
      }));

    return NextResponse.json({
      success: true,
      data: {
        videoId: chapter.videoId,
        chapterName: chapter.name,
        transcript: transcriptText,
        segments: segments,
        totalSegments: segments.length
      },
      message: 'Transcript retrieved successfully'
    });

  } catch (error) {
    console.error('Chapter transcript fetch error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch transcript',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}