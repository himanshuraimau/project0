import { NextRequest, NextResponse } from "next/server";
import { getUserFromAuth } from "@/lib/auth-helper";
import { FeatureGateService } from "@/lib/feature-gate-service";
import {
  transcribeAudioAndCreateNote,
  validateAudioFile,
  MAX_AUDIO_FILE_SIZE,
} from "@/lib/transcribe-audio";

export const maxDuration = 300;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserFromAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const contentLength = req.headers.get("content-length");
    if (contentLength) {
      const fileSizeBytes = parseInt(contentLength, 10);
      if (fileSizeBytes > MAX_AUDIO_FILE_SIZE) {
        return NextResponse.json(
          {
            error:
              "Your audio file is too large. The maximum file size allowed is 25MB.",
            details: `Your file size: ${(fileSizeBytes / 1024 / 1024).toFixed(2)}MB. Please select a smaller audio file or compress it before uploading.`,
            maxSizeMB: 25,
            currentSizeMB: Number((fileSizeBytes / 1024 / 1024).toFixed(2)),
          },
          { status: 413 }
        );
      }
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (error) {
      console.error("FormData parsing error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("boundary")) {
        return NextResponse.json(
          {
            error: "The audio file appears to be corrupted or incomplete. Please try uploading again.",
            details:
              "If the problem persists, try clearing your browser cache or using a different browser.",
            code: "FORM_DATA_CORRUPTED",
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        {
          error: "Failed to process your audio file. Please ensure the file is valid and try again.",
          details:
            "Make sure your file is a valid audio file (MP3, WAV, FLAC, M4A, OGG, WebM, MP4, or AAC).",
          code: "FORM_DATA_ERROR",
        },
        { status: 400 }
      );
    }

    const audioFile = formData.get("audio") as File;
    const fileName = (formData.get("fileName") as string) || "recorded-audio";
    const folderId = (formData.get("folderId") as string) || null;

    const validation = validateAudioFile(audioFile);
    if (!validation.ok) {
      return NextResponse.json(validation.body, { status: validation.status });
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

    const result = await transcribeAudioAndCreateNote(
      audioFile,
      userId,
      fileName,
      folderId
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Audio transcription error:", error);
    if (error instanceof Error) {
      if (error.message.includes("FormData")) {
        return NextResponse.json(
          { error: "Invalid form data format. Please check your request." },
          { status: 400 }
        );
      }
      if (error.message.includes("boundary")) {
        return NextResponse.json(
          { error: "Malformed multipart data. Please try uploading again." },
          { status: 400 }
        );
      }
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
