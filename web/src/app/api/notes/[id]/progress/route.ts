import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id: noteId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the note exists and belongs to the user
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note || note.userId !== userId) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Check if progress record exists
    const progress = await prisma.noteProgress.findUnique({
      where: { noteId },
    });

    return NextResponse.json({
      isCompleted: progress?.isCompleted || false,
      completedAt: progress?.completedAt || null,
    });
  } catch (error) {
    console.error("Error fetching note progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id: noteId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the note exists and belongs to the user
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note || note.userId !== userId) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Create or update progress record
    const progress = await prisma.noteProgress.upsert({
      where: { noteId },
      update: {
        isCompleted: true,
        completedAt: new Date(),
      },
      create: {
        noteId,
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      isCompleted: progress.isCompleted,
      completedAt: progress.completedAt,
    });
  } catch (error) {
    console.error("Error marking note as complete:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the note exists and belongs to the user
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note || note.userId !== userId) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Update or create progress record to mark as incomplete
    const progress = await prisma.noteProgress.upsert({
      where: { noteId },
      update: {
        isCompleted: false,
        completedAt: null,
      },
      create: {
        noteId,
        isCompleted: false,
        completedAt: null,
      },
    });

    return NextResponse.json({
      isCompleted: progress.isCompleted,
      completedAt: progress.completedAt,
    });
  } catch (error) {
    console.error("Error marking note as incomplete:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}