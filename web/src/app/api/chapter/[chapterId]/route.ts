import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { chapterId } = await params;

    if (!chapterId) {
      return NextResponse.json(
        { error: "Chapter ID is required" },
        { status: 400 }
      );
    }

    // Fetch the chapter with its unit and course to verify ownership
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
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    // Verify that the user owns this course
    if (chapter.unit.course.userId !== userId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Return the chapter data without the nested relations
    const chapterData = {
      id: chapter.id,
      name: chapter.name,
      youtubeSearchQuery: chapter.youtubeSearchQuery,
      videoId: chapter.videoId,
      notes: chapter.notes,
      unitId: chapter.unitId,
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt,
    };

    return NextResponse.json(chapterData);

  } catch (error) {
    console.error("Error fetching chapter:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}