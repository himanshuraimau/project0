import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/services/prisma";

// Helper function to calculate course progress
async function updateCourseProgress(userId: string, courseId: string) {
  // Get all chapters in the course
  const course = await (prisma as any).course.findUnique({
    where: { id: courseId },
    include: {
      units: {
        include: {
          chapters: true,
        },
      },
    },
  });

  if (!course) return;

  const allChapters = course.units.flatMap((unit: any) => unit.chapters);
  const totalChapters = allChapters.length;

  // Get completed chapters count
  const completedChaptersCount = await (prisma as any).userChapterProgress.count({
    where: {
      userId,
      chapterId: { in: allChapters.map((chapter: any) => chapter.id) },
      isCompleted: true,
    },
  });

  const completionPercentage = totalChapters > 0 ? (completedChaptersCount / totalChapters) * 100 : 0;
  const isCompleted = completionPercentage === 100;

  // Update course progress
  await (prisma as any).userCourseProgress.upsert({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
    update: {
      completedChapters: completedChaptersCount,
      totalChapters,
      completionPercentage,
      isCompleted,
      completedAt: isCompleted ? new Date() : null,
    },
    create: {
      userId,
      courseId,
      completedChapters: completedChaptersCount,
      totalChapters,
      completionPercentage,
      isCompleted,
      completedAt: isCompleted ? new Date() : null,
    },
  });

  return {
    completedChapters: completedChaptersCount,
    totalChapters,
    completionPercentage,
    isCompleted,
  };
}

// GET - Get chapter progress for current user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { userId } = await auth();
    const { chapterId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const progress = await (prisma as any).userChapterProgress.findUnique({
      where: {
        userId_chapterId: {
          userId,
          chapterId,
        },
      },
    });

    return NextResponse.json({
      isCompleted: progress?.isCompleted || false,
      completedAt: progress?.completedAt,
    });
  } catch (error) {
    console.error("Error fetching chapter progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch chapter progress" },
      { status: 500 }
    );
  }
}

// POST - Mark chapter as complete
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { userId } = await auth();
    const { chapterId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get chapter and course info
    const chapter = await (prisma as any).chapter.findUnique({
      where: { id: chapterId },
      include: {
        unit: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // Mark chapter as complete
    const chapterProgress = await (prisma as any).userChapterProgress.upsert({
      where: {
        userId_chapterId: {
          userId,
          chapterId,
        },
      },
      update: {
        isCompleted: true,
        completedAt: new Date(),
      },
      create: {
        userId,
        chapterId,
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    // Update course progress
    const courseProgress = await updateCourseProgress(userId, chapter.unit.course.id);

    return NextResponse.json({
      success: true,
      chapter: {
        isCompleted: chapterProgress.isCompleted,
        completedAt: chapterProgress.completedAt,
      },
      course: courseProgress,
    });
  } catch (error) {
    console.error("Error marking chapter as complete:", error);
    return NextResponse.json(
      { error: "Failed to mark chapter as complete" },
      { status: 500 }
    );
  }
}

// DELETE - Mark chapter as incomplete
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { userId } = await auth();
    const { chapterId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get chapter and course info
    const chapter = await (prisma as any).chapter.findUnique({
      where: { id: chapterId },
      include: {
        unit: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // Mark chapter as incomplete
    const chapterProgress = await (prisma as any).userChapterProgress.upsert({
      where: {
        userId_chapterId: {
          userId,
          chapterId,
        },
      },
      update: {
        isCompleted: false,
        completedAt: null,
      },
      create: {
        userId,
        chapterId,
        isCompleted: false,
        completedAt: null,
      },
    });

    // Update course progress
    const courseProgress = await updateCourseProgress(userId, chapter.unit.course.id);

    return NextResponse.json({
      success: true,
      chapter: {
        isCompleted: chapterProgress.isCompleted,
        completedAt: chapterProgress.completedAt,
      },
      course: courseProgress,
    });
  } catch (error) {
    console.error("Error marking chapter as incomplete:", error);
    return NextResponse.json(
      { error: "Failed to mark chapter as incomplete" },
      { status: 500 }
    );
  }
}