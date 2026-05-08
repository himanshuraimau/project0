import { prisma } from "@/lib/prisma";
import { indexNoteContent } from "@/lib/course/embedding-service";
import { mapUnknownToSourceError, SourceError, userMessageFor } from "./errors";
import { parseSource } from "./parse";
import { publishSourceProgress } from "./progress";
import { summarizeSource } from "./summarize";
import {
  SOURCE_MAX_WORDS,
  type SourceErrorCode,
  type SourceKind,
  type SourceStage,
  type SourceStatus,
} from "./types";

function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

async function updateSource(
  transcriptId: string,
  data: {
    status?: SourceStatus;
    stage?: SourceStage | null;
    progress?: number;
    errorCode?: SourceErrorCode | null;
    errorMessage?: string | null;
    content?: string;
    cleanContent?: string;
    wordCount?: number;
    tokenCount?: number;
    summary?: string;
    keyTopics?: string[];
    suggestedQuestions?: string[];
    readyAt?: Date;
    fileName?: string;
    originalName?: string;
  }
) {
  await prisma.transcript.update({
    where: { id: transcriptId },
    data,
  });
}

async function emit(
  transcriptId: string,
  batchId: string | null,
  sourceKind: SourceKind,
  title: string,
  stage: SourceStage | null,
  status: SourceStatus,
  progress: number,
  message: string,
  errorCode?: SourceErrorCode | null
) {
  await publishSourceProgress({
    transcriptId,
    batchId,
    sourceKind,
    status,
    stage,
    progress,
    message,
    errorCode: errorCode ?? null,
    title,
  });
}

async function bumpBatchCounters(
  batchId: string | null,
  field: "readyCount" | "failedCount" | "skippedCount"
) {
  if (!batchId) return;
  await prisma.sourceBatch.update({
    where: { id: batchId },
    data: { [field]: { increment: 1 } },
  });

  const batch = await prisma.sourceBatch.findUnique({
    where: { id: batchId },
    select: {
      totalCount: true,
      readyCount: true,
      failedCount: true,
      skippedCount: true,
      status: true,
    },
  });
  if (!batch) return;
  const terminal =
    batch.readyCount + batch.failedCount + batch.skippedCount >=
    batch.totalCount;
  if (terminal && batch.status !== "completed" && batch.status !== "partial") {
    const finalStatus =
      batch.failedCount === 0 && batch.skippedCount === 0
        ? "completed"
        : batch.readyCount === 0
          ? "failed"
          : "partial";
    await prisma.sourceBatch.update({
      where: { id: batchId },
      data: { status: finalStatus, completedAt: new Date() },
    });
  }
}

/**
 * Idempotent per-source runner. Call as many times as needed for a single
 * transcript — it resumes based on current status.
 */
export async function processSource(transcriptId: string): Promise<void> {
  const transcript = await prisma.transcript.findUnique({
    where: { id: transcriptId },
  });
  if (!transcript) {
    throw new Error(`Transcript not found: ${transcriptId}`);
  }
  if (transcript.status === "ready") return;
  if (transcript.status === "skipped") return;

  const kind = (transcript.sourceKind ?? "text") as SourceKind;
  const batchId = transcript.batchId;
  const title = transcript.originalName || "Untitled source";

  try {
    // Mark as processing
    await updateSource(transcriptId, {
      status: "processing",
      stage: "parsing",
      progress: 10,
      errorCode: null,
      errorMessage: null,
    });
    await emit(
      transcriptId,
      batchId,
      kind,
      title,
      "parsing",
      "processing",
      10,
      "Parsing source…"
    );

    // Step 1: parse
    const parsed = await parseSource(transcript);
    const text = parsed.text ?? "";
    const words = countWords(text);

    if (words < 20) {
      throw new SourceError(
        "NO_CONTENT",
        "Source contains fewer than 20 readable words."
      );
    }
    if (words > SOURCE_MAX_WORDS) {
      throw new SourceError(
        "UNSUPPORTED_FORMAT",
        `Source exceeds ${SOURCE_MAX_WORDS} word limit (${words} words).`
      );
    }

    const resolvedTitle = parsed.title || transcript.originalName || title;
    await updateSource(transcriptId, {
      content: text,
      cleanContent: text,
      wordCount: words,
      tokenCount: Math.ceil(words * 1.3),
      stage: "chunking",
      progress: 35,
      originalName: resolvedTitle,
      fileName: transcript.fileName || `${Date.now()}_${resolvedTitle}`,
    });
    await emit(
      transcriptId,
      batchId,
      kind,
      resolvedTitle,
      "chunking",
      "processing",
      35,
      "Chunking content…"
    );

    // Step 2: create Note shell + index chunks (reuses existing embedding path)
    await updateSource(transcriptId, {
      stage: "embedding",
      progress: 55,
    });
    await emit(
      transcriptId,
      batchId,
      kind,
      resolvedTitle,
      "embedding",
      "processing",
      55,
      "Generating embeddings…"
    );

    // Reuse or create a shell Note for this transcript. Embeddings key on note_id.
    const existingNote = await prisma.note.findFirst({
      where: { transcriptId },
      select: { id: true },
    });

    let noteId: string;
    if (existingNote) {
      noteId = existingNote.id;
    } else {
      const note = await prisma.note.create({
        data: {
          title: resolvedTitle,
          content: text,
          transcriptId,
          userId: transcript.userId,
          folderId: transcript.folderId,
        },
        select: { id: true },
      });
      noteId = note.id;
    }

    await indexNoteContent(noteId, text);

    // Step 3: summarize (best-effort; failures don't fail the source)
    await updateSource(transcriptId, {
      stage: "summarizing",
      progress: 80,
    });
    await emit(
      transcriptId,
      batchId,
      kind,
      resolvedTitle,
      "summarizing",
      "processing",
      80,
      "Generating preview…"
    );

    const summary = await summarizeSource(resolvedTitle, text);

    // Step 4: mark ready
    await updateSource(transcriptId, {
      status: "ready",
      stage: "ready",
      progress: 100,
      summary: summary.summary,
      keyTopics: summary.keyTopics,
      suggestedQuestions: summary.suggestedQuestions,
      readyAt: new Date(),
    });
    await bumpBatchCounters(batchId, "readyCount");
    await emit(
      transcriptId,
      batchId,
      kind,
      resolvedTitle,
      "ready",
      "ready",
      100,
      "Ready"
    );
  } catch (err) {
    const mapped = mapUnknownToSourceError(err);
    console.error(
      `[sources/pipeline] Failed ${transcriptId} (${mapped.code}):`,
      mapped.message
    );

    await updateSource(transcriptId, {
      status: "failed",
      stage: "failed",
      errorCode: mapped.code,
      errorMessage: userMessageFor(mapped.code),
    });
    await bumpBatchCounters(batchId, "failedCount");
    await emit(
      transcriptId,
      batchId,
      kind,
      title,
      "failed",
      "failed",
      100,
      userMessageFor(mapped.code),
      mapped.code
    );
  }
}
