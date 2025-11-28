import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getUserFromAuth } from "@/lib/auth-helper";

// GET - Get course progress for current user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const userId = await getUserFromAuth(request);
    const { courseId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if detailed progress is requested
    const url = new URL(request.url);
    const detailed = url.searchParams.get('detailed') === 'true';

    if (detailed) {
      // Fetch detailed progress including all chapters
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          units: {
            include: {
              chapters: true,
            },
          },
        },
      });

      if (!course || course.userId !== userId) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
      }

      // Fetch all chapter progress for this user and course
      const allChapterIds = course.units.flatMap(unit => 
        unit.chapters.map(chapter => chapter.id)
      );

      const chapterProgressRecords = await (prisma as any).userChapterProgress.findMany({
        where: {
          userId,
          chapterId: {
            in: allChapterIds,
          },
        },
      });

      // Build chapter progress map
      const chapterProgress: Record<string, { isCompleted: boolean; completedAt: string | null }> = {};
      for (const chapterId of allChapterIds) {
        const progress = chapterProgressRecords.find((p: any) => p.chapterId === chapterId);
        chapterProgress[chapterId] = {
          isCompleted: progress?.isCompleted || false,
          completedAt: progress?.completedAt || null,
        };
      }

      // Calculate unit progress
      const unitProgress: Record<string, { completedChapters: number; totalChapters: number; progressPercentage: number }> = {};
      for (const unit of course.units) {
        const totalChapters = unit.chapters.length;
        const completedChapters = unit.chapters.filter(
          chapter => chapterProgress[chapter.id]?.isCompleted
        ).length;
        const progressPercentage = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

        unitProgress[unit.id] = {
          completedChapters,
          totalChapters,
          progressPercentage,
        };
      }

      return NextResponse.json({
        chapters: chapterProgress,
        units: unitProgress,
      });
    }

    // Return summary progress
    const progress = await (prisma as any).userCourseProgress.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    return NextResponse.json({
      isCompleted: progress?.isCompleted || false,
      completedAt: progress?.completedAt,
      completedChapters: progress?.completedChapters || 0,
      totalChapters: progress?.totalChapters || 0,
      completionPercentage: progress?.completionPercentage || 0,
    });
  } catch (error) {
    console.error("Error fetching course progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch course progress" },
      { status: 500 }
    );
  }
}

// POST - Mark course as complete
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const userId = await getUserFromAuth(request);
    const { courseId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Manual course completion - mark all chapters as complete
    // Get all chapters in the course
    const courseWithChapters = await (prisma as any).course.findUnique({
      where: { id: courseId },
      include: {
        units: {
          include: {
            chapters: true,
          },
        },
      },
    });

    if (!courseWithChapters) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const allChapters = courseWithChapters.units.flatMap((unit: any) => unit.chapters);
    const totalChapters = allChapters.length;

    // Mark all chapters as complete
    for (const chapter of allChapters) {
      await (prisma as any).userChapterProgress.upsert({
        where: {
          userId_chapterId: {
            userId,
            chapterId: chapter.id,
          },
        },
        update: {
          isCompleted: true,
          completedAt: new Date(),
        },
        create: {
          userId,
          chapterId: chapter.id,
          isCompleted: true,
          completedAt: new Date(),
        },
      });
    }

    // Create or update course progress
    const progress = await (prisma as any).userCourseProgress.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      update: {
        completedChapters: totalChapters,
        totalChapters,
        completionPercentage: 100,
        isCompleted: true,
        completedAt: new Date(),
      },
      create: {
        userId,
        courseId,
        completedChapters: totalChapters,
        totalChapters,
        completionPercentage: 100,
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      isCompleted: progress.isCompleted,
      completedAt: progress.completedAt,
      completedChapters: progress.completedChapters,
      totalChapters: progress.totalChapters,
      completionPercentage: progress.completionPercentage,
    });
  } catch (error) {
    console.error("Error marking course as complete:", error);
    return NextResponse.json(
      { error: "Failed to mark course as complete" },
      { status: 500 }
    );
  }
}

// DELETE - Mark course as incomplete (undo completion)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const userId = await getUserFromAuth(request);
    const { courseId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Manual course incompletion - mark all chapters as incomplete
    // Get all chapters in the course
    const courseWithChapters = await (prisma as any).course.findUnique({
      where: { id: courseId },
      include: {
        units: {
          include: {
            chapters: true,
          },
        },
      },
    });

    if (!courseWithChapters) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const allChapters = courseWithChapters.units.flatMap((unit: any) => unit.chapters);

    // Mark all chapters as incomplete
    for (const chapter of allChapters) {
      await (prisma as any).userChapterProgress.upsert({
        where: {
          userId_chapterId: {
            userId,
            chapterId: chapter.id,
          },
        },
        update: {
          isCompleted: false,
          completedAt: null,
        },
        create: {
          userId,
          chapterId: chapter.id,
          isCompleted: false,
          completedAt: null,
        },
      });
    }

    // Update course progress to incomplete
    const progress = await (prisma as any).userCourseProgress.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      update: {
        completedChapters: 0,
        totalChapters: allChapters.length,
        completionPercentage: 0,
        isCompleted: false,
        completedAt: null,
      },
      create: {
        userId,
        courseId,
        completedChapters: 0,
        totalChapters: allChapters.length,
        completionPercentage: 0,
        isCompleted: false,
        completedAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      isCompleted: progress.isCompleted,
      completedAt: progress.completedAt,
      completedChapters: progress.completedChapters,
      totalChapters: progress.totalChapters,
      completionPercentage: progress.completionPercentage,
    });
  } catch (error) {
    console.error("Error marking course as incomplete:", error);
    return NextResponse.json(
      { error: "Failed to mark course as incomplete" },
      { status: 500 }
    );
  }
}