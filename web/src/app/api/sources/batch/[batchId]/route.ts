import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromAuth } from "@/lib/auth-helper";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const userId = await getUserFromAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    const { batchId } = await params;

    const batch = await prisma.sourceBatch.findUnique({
      where: { id: batchId },
      include: {
        transcripts: {
          select: {
            id: true,
            originalName: true,
            sourceKind: true,
            status: true,
            stage: true,
            progress: true,
            errorCode: true,
            errorMessage: true,
            summary: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!batch) {
      return NextResponse.json(
        { error: "Batch not found" },
        { status: 404 }
      );
    }
    if (batch.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }
    return NextResponse.json({ success: true, batch });
  } catch (err) {
    console.error("[api/sources/batch/:batchId GET] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch batch" },
      { status: 500 }
    );
  }
}
