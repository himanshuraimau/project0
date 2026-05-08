import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromAuth } from "@/lib/auth-helper";
import {
  reserveSourceSlots,
  releaseSourceSlots,
} from "@/lib/sources/quota";
import { SOURCE_MAX_PER_BATCH } from "@/lib/sources/types";
import type { BatchItem, SourceKind } from "@/lib/sources/types";
import { looksLikeYoutube } from "@/lib/sources/parsers/url";

export const runtime = "nodejs";

interface CreatedSource {
  id: string;
  sourceKind: SourceKind;
  title: string;
  status: "queued" | "skipped";
  errorCode?: "QUOTA_EXCEEDED" | "UNSUPPORTED_FORMAT";
}

function kindFromItem(item: BatchItem): SourceKind | null {
  switch (item.kind) {
    case "text":
      return "text";
    case "url":
      return looksLikeYoutube(item.url) ? "youtube" : "url";
    case "youtube":
      return "youtube";
    case "audio":
      return "audio";
    case "file": {
      const mime = item.mime?.toLowerCase() ?? "";
      if (mime === "application/pdf") return "pdf";
      if (mime === "text/plain") return "txt";
      if (mime === "text/markdown" || mime === "text/x-markdown") return "md";
      if (mime === "text/csv") return "csv";
      if (
        mime ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
        return "docx";
      if (
        mime ===
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      )
        return "pptx";
      if (mime.startsWith("image/")) return "image";
      const name = item.filename?.toLowerCase() ?? "";
      if (name.endsWith(".pdf")) return "pdf";
      if (name.endsWith(".txt")) return "txt";
      if (name.endsWith(".md") || name.endsWith(".markdown")) return "md";
      if (name.endsWith(".csv")) return "csv";
      if (name.endsWith(".docx")) return "docx";
      if (name.endsWith(".pptx")) return "pptx";
      if (/\.(png|jpe?g|webp|heic|heif)$/.test(name)) return "image";
      return null;
    }
  }
}

function titleFromItem(item: BatchItem, kind: SourceKind): string {
  if (item.kind === "file") return item.filename;
  if (item.kind === "text") return item.title?.trim() || "Pasted text";
  if (item.kind === "audio") return item.filename || "Audio";
  if (item.kind === "url" || item.kind === "youtube") {
    try {
      if (kind === "youtube") return `YouTube · ${new URL(item.url).pathname}`;
      return new URL(item.url).hostname;
    } catch {
      return item.url;
    }
  }
  return "Source";
}

function rawInputFrom(item: BatchItem): Prisma.InputJsonValue {
  switch (item.kind) {
    case "file":
      return {
        url: item.url,
        uploadKey: item.uploadKey,
        filename: item.filename,
        size: item.size,
        mime: item.mime,
      };
    case "url":
    case "youtube":
      return { url: item.url };
    case "text":
      return { content: item.content, title: item.title ?? "" };
    case "audio":
      return { url: item.s3Url, s3Key: item.s3Key, filename: item.filename };
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      folderId?: string | null;
      items?: BatchItem[];
    };
    const items = Array.isArray(body.items) ? body.items : [];
    const folderId = body.folderId ?? null;

    if (items.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      );
    }
    if (items.length > SOURCE_MAX_PER_BATCH) {
      return NextResponse.json(
        {
          error: `Too many items in batch (max ${SOURCE_MAX_PER_BATCH}).`,
        },
        { status: 400 }
      );
    }

    // Classify items — unsupported kinds get rejected up front.
    type Classified = { item: BatchItem; kind: SourceKind | null };
    const classified: Classified[] = items.map((item) => ({
      item,
      kind: kindFromItem(item),
    }));
    const eligibleCount = classified.filter((c) => c.kind !== null).length;

    // Reserve quota slots for only eligible items.
    const reservation = await reserveSourceSlots(userId, eligibleCount);
    const slotsRemaining = { value: reservation.allowed };

    // Create the batch row.
    const batch = await prisma.sourceBatch.create({
      data: {
        userId,
        folderId,
        status: "processing",
        totalCount: items.length,
      },
      select: { id: true },
    });

    const created: CreatedSource[] = [];

    for (const { item, kind } of classified) {
      if (kind === null) {
        const skipped = await prisma.transcript.create({
          data: {
            userId,
            folderId,
            batchId: batch.id,
            fileName: `skipped_${Date.now()}`,
            originalName: titleFromItem(item, "text"),
            content: "",
            cleanContent: "",
            type: "text",
            sourceKind: "text",
            status: "skipped",
            stage: "failed",
            progress: 100,
            errorCode: "UNSUPPORTED_FORMAT",
            errorMessage: "Unsupported file type.",
            rawInput: rawInputFrom(item),
          },
          select: { id: true },
        });
        await prisma.sourceBatch.update({
          where: { id: batch.id },
          data: { skippedCount: { increment: 1 } },
        });
        created.push({
          id: skipped.id,
          sourceKind: "text",
          title: titleFromItem(item, "text"),
          status: "skipped",
          errorCode: "UNSUPPORTED_FORMAT",
        });
        continue;
      }

      if (slotsRemaining.value <= 0) {
        const skipped = await prisma.transcript.create({
          data: {
            userId,
            folderId,
            batchId: batch.id,
            fileName: `quota_${Date.now()}`,
            originalName: titleFromItem(item, kind),
            content: "",
            cleanContent: "",
            type: kind,
            sourceKind: kind,
            status: "skipped",
            stage: "failed",
            progress: 100,
            errorCode: "QUOTA_EXCEEDED",
            errorMessage: "Monthly source limit reached.",
            rawInput: rawInputFrom(item),
          },
          select: { id: true },
        });
        await prisma.sourceBatch.update({
          where: { id: batch.id },
          data: { skippedCount: { increment: 1 } },
        });
        created.push({
          id: skipped.id,
          sourceKind: kind,
          title: titleFromItem(item, kind),
          status: "skipped",
          errorCode: "QUOTA_EXCEEDED",
        });
        continue;
      }

      const title = titleFromItem(item, kind);
      const source = await prisma.transcript.create({
        data: {
          userId,
          folderId,
          batchId: batch.id,
          fileName: `${Date.now()}_${title.replace(/[^a-zA-Z0-9]/g, "_")}`,
          originalName: title,
          content: "",
          cleanContent: "",
          type: kind,
          sourceKind: kind,
          status: "queued",
          stage: "queued",
          progress: 0,
          uploadKey: item.kind === "file" ? item.uploadKey : null,
          rawInput: rawInputFrom(item),
        },
        select: { id: true },
      });
      slotsRemaining.value -= 1;
      created.push({
        id: source.id,
        sourceKind: kind,
        title,
        status: "queued",
      });
    }

    // Release any reserved-but-unused slots (all queued items consumed 1; any
    // remainder means classified length > queued count — e.g. race.)
    if (slotsRemaining.value > 0) {
      await releaseSourceSlots(userId, slotsRemaining.value);
    }

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      sources: created,
      pusherChannel: "source-progress",
      pusherBatchEvent: `batch-${batch.id}`,
      quota: {
        limit: reservation.limit,
        used: reservation.used,
      },
    });
  } catch (err) {
    console.error("[api/sources/batch] error:", err);
    return NextResponse.json(
      {
        error: "Failed to create source batch",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
