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
      return NextResponse.json(
        { error: `Failed to fetch audio from URL: ${response.status} ${response.statusText}` },
        { status: 502 }
      );
    }

    const contentType = response.headers.get("content-type") ?? "audio/mpeg";
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

    const ext = fileName.includes(".") ? fileName.split(".").pop() : "mp3";
    const safeName = fileName.includes(".") ? fileName : `${fileName}.${ext}`;
    const file = new File([buffer], safeName, { type: contentType });

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
