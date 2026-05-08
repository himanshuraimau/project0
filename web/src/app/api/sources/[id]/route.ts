import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromAuth } from "@/lib/auth-helper";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserFromAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    const { id } = await params;

    const source = await prisma.transcript.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        batchId: true,
        folderId: true,
        originalName: true,
        sourceKind: true,
        type: true,
        status: true,
        stage: true,
        progress: true,
        errorCode: true,
        errorMessage: true,
        wordCount: true,
        summary: true,
        keyTopics: true,
        suggestedQuestions: true,
        createdAt: true,
        readyAt: true,
      },
    });
    if (!source) {
      return NextResponse.json(
        { error: "Source not found" },
        { status: 404 }
      );
    }
    if (source.userId && source.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }
    return NextResponse.json({ success: true, source });
  } catch (err) {
    console.error("[api/sources/:id GET] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch source" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserFromAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    const { id } = await params;

    const source = await prisma.transcript.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
    if (!source) {
      return NextResponse.json(
        { error: "Source not found" },
        { status: 404 }
      );
    }
    if (source.userId && source.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    await prisma.transcript.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/sources/:id DELETE] error:", err);
    return NextResponse.json(
      { error: "Failed to delete source" },
      { status: 500 }
    );
  }
}
