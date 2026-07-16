import { prisma } from "@/lib/prisma";
import { openaiAudio, AI_MODELS } from "@/lib/ai/gateway";
import { NoteService } from "@/lib/note-service";
import { noteProgressManager } from "@/lib/note-progress-manager";

const ALLOWED_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mpga",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/flac",
  "audio/m4a",
  "audio/x-m4a",
  "audio/ogg",
  "audio/oga",
  "audio/webm",
  "audio/mp4",
  "audio/aac",
];

const ALLOWED_EXTENSIONS = ["mp3", "wav", "flac", "m4a", "ogg", "oga", "webm", "mp4", "aac", "mpeg", "mpga"];

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

export const MAX_AUDIO_FILE_SIZE = 25 * 1024 * 1024; // 25MB (Whisper limit)

function normalizeAudioMimeType(mimeType: string): string {
  const base = mimeType.split(";")[0] ?? "";
  return base.trim().toLowerCase();
}

export function validateAudioFile(file: File): { ok: true } | { ok: false; status: number; body: object } {
  if (!file || !(file instanceof File)) {
    return { ok: false, status: 400, body: { error: "No valid audio file provided" } };
  }
  if (file.size === 0) {
    return { ok: false, status: 400, body: { error: "Audio file is empty" } };
  }
  if (file.size > MAX_AUDIO_FILE_SIZE) {
    return {
      ok: false,
      status: 413,
      body: {
        error: `Audio file is too large. Maximum size allowed is 25MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
        maxSizeMB: 25,
        currentSizeMB: Number((file.size / 1024 / 1024).toFixed(2)),
      },
    };
  }

  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  const normalizedMimeType = normalizeAudioMimeType(file.type);
  const isValidMime = ALLOWED_MIME_TYPES.includes(normalizedMimeType);
  const isValidExt = fileExtension && ALLOWED_EXTENSIONS.includes(fileExtension);
  if (!isValidMime && !isValidExt) {
    return {
      ok: false,
      status: 400,
      body: {
        error: `Unsupported audio format: ${file.type} (.${fileExtension}). Supported formats: MP3, WAV, FLAC, M4A, OGG, WebM, MP4, AAC.`,
      },
    };
  }

  return { ok: true };
}

export interface TranscribeResult {
  transcription: string;
  transcript: {
    id: string;
    fileName: string;
    originalName: string;
    content: string;
    cleanContent: string;
    type: string;
    createdAt: Date;
    updatedAt: Date;
  };
  note: unknown;
  noteError?: string;
}

/**
 * Transcribe an audio File with Whisper, save transcript, and generate AI note.
 * Used by both the direct FormData upload route and the transcribe-from-url route.
 */
export async function transcribeAudioAndCreateNote(
  audioFile: File,
  userId: string,
  fileNameForRecord: string,
  folderId: string | null,
  progressJobId?: string
): Promise<TranscribeResult> {
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

  const normalizedMimeType = normalizeAudioMimeType(audioFile.type);
  let transcriptionExtension = MIME_TO_EXTENSION[normalizedMimeType];
  if (!transcriptionExtension) {
    const parts = audioFile.name.split(".");
    transcriptionExtension = parts[parts.length - 1]?.toLowerCase() ?? "mp3";
  }

  const properFileName = audioFile.name.includes(".")
    ? audioFile.name
    : `audio.${transcriptionExtension}`;
  const recordBaseName = (fileNameForRecord || "audio").trim() || "audio";
  const recordHasExtension = !!recordBaseName.match(/\.[a-z0-9]+$/i);
  const transcriptFileName = recordHasExtension
    ? recordBaseName
    : `${recordBaseName}.${transcriptionExtension}`;

  const audioFileWithName = new File([await audioFile.arrayBuffer()], properFileName, {
    type: normalizedMimeType || "audio/mpeg",
  });

  await publishProgress(40, "processing", "Transcribing audio...");
  const transcriptionResult = await openaiAudio.audio.transcriptions.create({
    file: audioFileWithName,
    model: AI_MODELS.transcription,
  });

  const transcriptText = transcriptionResult.text;

  // Increment audio processing usage counter after successful transcription
  const { FeatureGateService } = await import('./feature-gate-service');
  await FeatureGateService.incrementAudioUsage(userId);

  const transcriptRecord = await prisma.transcript.create({
    data: {
      fileName: transcriptFileName,
      originalName: audioFile.name,
      content: transcriptText,
      cleanContent: transcriptText,
      type: "audio",
      userId,
      metadata: {
        fileSize: audioFile.size,
        mimeType: audioFile.type,
        duration: null,
        ...(progressJobId ? { progressJobId } : {}),
      },
    },
  });

  const noteService = new NoteService();
  let noteResult: unknown = null;

  try {
    await publishProgress(70, "generating", "Generating AI notes...");
    const reservation = await FeatureGateService.reserveNoteUsage(userId);
    if (!reservation.allowed) {
      await publishProgress(
        0,
        "error",
        reservation.message || "Unable to create note"
      );
      return {
        transcription: transcriptText,
        transcript: {
          id: transcriptRecord.id,
          fileName: transcriptRecord.fileName,
          originalName: transcriptRecord.originalName,
          content: transcriptText,
          cleanContent: transcriptText,
          type: transcriptRecord.type,
          createdAt: transcriptRecord.createdAt,
          updatedAt: transcriptRecord.updatedAt,
        },
        note: null,
        noteError: reservation.message || 'Unable to create note',
      };
    }

    noteResult = await noteService.generateAINote(
      transcriptRecord.id,
      userId,
      folderId ?? undefined
    );
  } catch (error) {
    console.error("Failed to generate AI notes:", error);
    await FeatureGateService.decrementNoteUsage(userId);
    await publishProgress(
      0,
      "error",
      error instanceof Error ? error.message : "Failed to generate notes"
    );
    return {
      transcription: transcriptText,
      transcript: {
        id: transcriptRecord.id,
        fileName: transcriptRecord.fileName,
        originalName: transcriptRecord.originalName,
        content: transcriptText,
        cleanContent: transcriptText,
        type: transcriptRecord.type,
        createdAt: transcriptRecord.createdAt,
        updatedAt: transcriptRecord.updatedAt,
      },
      note: null,
      noteError: error instanceof Error ? error.message : "Failed to generate notes",
    };
  }

  await publishProgress(100, "completed", "Audio note generated successfully");

  return {
    transcription: transcriptText,
    transcript: {
      id: transcriptRecord.id,
      fileName: transcriptRecord.fileName,
      originalName: transcriptRecord.originalName,
      content: transcriptText,
      cleanContent: transcriptText,
      type: transcriptRecord.type,
      createdAt: transcriptRecord.createdAt,
      updatedAt: transcriptRecord.updatedAt,
    },
    note: noteResult,
  };
}
