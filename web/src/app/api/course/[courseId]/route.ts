import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getUserFromAuth } from "@/lib/auth-helper";

// DELETE - Delete a course and all related data
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

    // Verify the course exists and belongs to the user
    const course = await prisma.course.findFirst({
      where: { 
        id: courseId,
        userId: userId
      },
      include: {
        units: {
          include: {
            chapters: {
              include: {
                questions: true,
                chunks: true,
                userProgress: true
              }
            }
          }
        },
        userProgress: true
      }
    });

    if (!course) {
      return NextResponse.json({ 
        error: "Course not found or you don't have permission to delete it" 
      }, { status: 404 });
    }
    await prisma.course.delete({
      where: { id: courseId }
    });

    return NextResponse.json({
      success: true,
      message: "Course deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}