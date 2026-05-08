import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromAuth } from "@/lib/auth-helper";
import { processSource } from "@/lib/sources/pipeline";

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
      select: { id: true, userId: true, status: true },
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

    if (transcript.status === "ready") {
      return NextResponse.json({ success: true, status: "ready" });
    }
    if (transcript.status === "skipped") {
      return NextResponse.json({ success: true, status: "skipped" });
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
    console.error("[api/sources/:id/process] error:", err);
    return NextResponse.json(
      {
        error: "Processing failed",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
