import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { noteId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { noteId } = await params;

    if (!noteId) {
      return NextResponse.json({ error: "Note ID is required" }, { status: 400 });
    }

    // Get the mindmap for the note
    const mindmap = await prisma.mindMap.findUnique({
      where: { noteId: noteId }
    });

    if (!mindmap) {
      return NextResponse.json({ error: "Mindmap not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: mindmap
    });

  } catch (error) {
    console.error("Error fetching mindmap:", error);
    return NextResponse.json(
      { error: "Failed to fetch mindmap" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { noteId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { noteId } = await params;

    if (!noteId) {
      return NextResponse.json({ error: "Note ID is required" }, { status: 400 });
    }

    // Delete the mindmap for the note
    await prisma.mindMap.delete({
      where: { noteId: noteId }
    });

    return NextResponse.json({
      success: true,
      message: "Mindmap deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting mindmap:", error);
    return NextResponse.json(
      { error: "Failed to delete mindmap" },
      { status: 500 }
    );
  }
}
