import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromAuth } from "@/lib/auth-helper";
import { processSource } from "@/lib/sources/pipeline";
import { reserveSourceSlots } from "@/lib/sources/quota";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
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

    const transcript = await prisma.transcript.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        errorCode: true,
        batchId: true,
      },
    });
    if (!transcript) {
      return NextResponse.json(
        { error: "Source not found" },
        { status: 404 }
      );
    }
    if (transcript.userId && transcript.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }
    if (transcript.status !== "failed" && transcript.status !== "skipped") {
      return NextResponse.json(
        { error: "Only failed or skipped sources can be retried." },
        { status: 400 }
      );
    }

    // If it was skipped for quota, retry requires re-reserving a slot.
    if (transcript.errorCode === "QUOTA_EXCEEDED") {
      const res = await reserveSourceSlots(userId, 1);
      if (res.allowed === 0) {
        return NextResponse.json(
          {
            error: "QUOTA_EXCEEDED",
            message: "You still don't have available source slots this month.",
          },
          { status: 403 }
        );
      }
    }

    // Clear any partial chunks so rerun is idempotent.
    const existingNote = await prisma.note.findFirst({
      where: { transcriptId: id },
      select: { id: true },
    });
    if (existingNote) {
      await prisma.noteChunk.deleteMany({
        where: { note_id: existingNote.id },
      });
    }

    await prisma.transcript.update({
      where: { id },
      data: {
        status: "queued",
        stage: "queued",
        progress: 0,
        errorCode: null,
        errorMessage: null,
      },
    });

    // Adjust batch counters (move from failed/skipped → back to pending bucket).
    if (transcript.batchId) {
      const bumpField =
        transcript.status === "failed" ? "failedCount" : "skippedCount";
      await prisma.sourceBatch.update({
        where: { id: transcript.batchId },
        data: {
          [bumpField]: { decrement: 1 },
          status: "processing",
          completedAt: null,
        },
      });
    }

    await processSource(id);

    const final = await prisma.transcript.findUnique({
      where: { id },
      select: { status: true, errorCode: true, errorMessage: true },
    });

    return NextResponse.json({
      success: true,
      status: final?.status ?? "unknown",
      errorCode: final?.errorCode ?? null,
      errorMessage: final?.errorMessage ?? null,
    });
  } catch (err) {
    console.error("[api/sources/:id/retry] error:", err);
    return NextResponse.json(
      {
        error: "Retry failed",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
