import { NextRequest, NextResponse } from "next/server";
import { getUserFromAuth } from "@/lib/auth-helper";
import { FeatureGateService } from "@/lib/feature-gate-service";
import {
  transcribeAudioAndCreateNote,
  validateAudioFile,
  MAX_AUDIO_FILE_SIZE,
} from "@/lib/transcribe-audio";
import { noteProgressManager } from "@/lib/note-progress-manager";

export const maxDuration = 300;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MIME_TO_EXTENSION: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mpga": "mp3",
  "audio/wav": "wav",
  "audio/wave": "wav",
  "audio/x-wav": "wav",
  "audio/flac": "flac",
  "audio/m4a": "m4a",
  "audio/x-m4a": "m4a",
  "audio/ogg": "ogg",
  "audio/oga": "oga",
  "audio/webm": "webm",
  "audio/mp4": "mp4",
  "audio/aac": "aac",
};

function normalizeAudioMimeType(mimeType: string): string {
  const base = mimeType.split(";")[0] ?? "";
  return base.trim().toLowerCase();
}

function extractExtension(value: string): string | null {
  const ext = value.split(".").pop()?.trim().toLowerCase();
  return ext && ext.length > 0 ? ext : null;
}

export async function POST(req: NextRequest) {
  let progressJobId = "";
  const publishProgress = async (
    progress: number,
    stage: "uploading" | "processing" | "generating" | "completed" | "error",
    message: string
  ) => {
    if (!progressJobId) return;
    await noteProgressManager.publish({
      jobId: progressJobId,
      progress,
      stage,
      message,
    });
  };

  try {
    const userId = await getUserFromAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const audioUrl = typeof body.audioUrl === "string" ? body.audioUrl.trim() : "";
    const fileName = (typeof body.fileName === "string" ? body.fileName.trim() : null) ?? "uploaded-audio";
    const folderId = (typeof body.folderId === "string" ? body.folderId : null) || null;
    progressJobId =
      typeof body.progressJobId === "string" ? body.progressJobId.trim() : "";

    if (!audioUrl || !audioUrl.startsWith("http")) {
      return NextResponse.json(
        { error: "Valid audioUrl is required (must be an HTTP/HTTPS URL)." },
        { status: 400 }
      );
    }

    const accessCheck = await FeatureGateService.checkNoteCreationAccess();
    if (!accessCheck.allowed) {
      return NextResponse.json(
        {
          error: accessCheck.message,
          notesUsed: accessCheck.notesUsed,
          notesLimit: accessCheck.notesLimit,
          upgradeUrl: accessCheck.upgradeUrl ?? "/pricing",
        },
        { status: accessCheck.statusCode }
      );
    }

    await publishProgress(20, "processing", "Downloading audio...");
    const response = await fetch(audioUrl, {
      method: "GET",
      headers: { Accept: "audio/*" },
    });

    if (!response.ok) {
      const retryable = response.status === 403 || response.status === 404;
      return NextResponse.json(
        {
          error: retryable
            ? "Uploaded audio is not available yet. This can happen if upload was interrupted by a page refresh."
            : `Failed to fetch audio from URL: ${response.status} ${response.statusText}`,
          code: retryable ? "S3_AUDIO_NOT_READY" : "S3_FETCH_FAILED",
          retryable,
          upstreamStatus: response.status,
        },
        { status: retryable ? 409 : 502 }
      );
    }

    const rawContentType = response.headers.get("content-type") ?? "audio/mpeg";
    const normalizedContentType = normalizeAudioMimeType(rawContentType);
    const buffer = await response.arrayBuffer();
    const size = buffer.byteLength;

    if (size > MAX_AUDIO_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `Audio file is too large. Maximum size allowed is 25MB. Your file is ${(size / 1024 / 1024).toFixed(2)}MB.`,
          maxSizeMB: 25,
          currentSizeMB: Number((size / 1024 / 1024).toFixed(2)),
        },
        { status: 413 }
      );
    }

    const fileNameExt = extractExtension(fileName);
    const urlPathExt = extractExtension(new URL(audioUrl).pathname);
    const mimeExt = MIME_TO_EXTENSION[normalizedContentType];
    const finalExt = fileNameExt ?? urlPathExt ?? mimeExt ?? "mp3";
    const baseName = fileName.replace(/\.[^/.]+$/, "") || "uploaded-audio";
    const safeName = `${baseName}.${finalExt}`;
    const file = new File([buffer], safeName, {
      type: normalizedContentType || "audio/mpeg",
    });

    const validation = validateAudioFile(file);
    if (!validation.ok) {
      return NextResponse.json(validation.body, { status: validation.status });
    }

    const result = await transcribeAudioAndCreateNote(
      file,
      userId,
      fileName,
      folderId,
      progressJobId || undefined
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Transcribe from URL error:", error);
    await publishProgress(
      0,
      "error",
      error instanceof Error ? error.message : "Failed to transcribe audio"
    );
    const upstreamStatus =
      typeof (error as { status?: unknown })?.status === "number"
        ? (error as { status: number }).status
        : null;
    const upstreamMessage =
      (error as { error?: { message?: string } })?.error?.message ||
      (error instanceof Error ? error.message : "Failed to transcribe audio");
    if (upstreamStatus === 400) {
      return NextResponse.json(
        { error: upstreamMessage || "Invalid audio file format for transcription." },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      if (error.message.includes("timeout") || error.message.includes("ETIMEDOUT")) {
        return NextResponse.json(
          { error: "Transcription timeout. Please try with a shorter audio file." },
          { status: 408 }
        );
      }
    }
    return NextResponse.json(
      { error: "Failed to transcribe audio. Please try again." },
      { status: 500 }
    );
  }
}
