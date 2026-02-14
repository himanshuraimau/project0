import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { NoteService } from "@/lib/note-service";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ALLOWED_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/flac",
  "audio/m4a",
  "audio/x-m4a",
  "audio/ogg",
  "audio/webm",
  "audio/mp4",
  "audio/aac",
  "audio/webm;codecs=opus",
  "audio/ogg;codecs=opus",
];

const ALLOWED_EXTENSIONS = ["mp3", "wav", "flac", "m4a", "ogg", "webm", "mp4", "aac"];

const MIME_TO_EXTENSION: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/wave": "wav",
  "audio/x-wav": "wav",
  "audio/flac": "flac",
  "audio/m4a": "m4a",
  "audio/x-m4a": "m4a",
  "audio/ogg": "ogg",
  "audio/ogg;codecs=opus": "ogg",
  "audio/webm": "webm",
  "audio/webm;codecs=opus": "webm",
  "audio/mp4": "mp4",
  "audio/aac": "aac",
};

export const MAX_AUDIO_FILE_SIZE = 25 * 1024 * 1024; // 25MB (Whisper limit)

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
  const isValidMime = ALLOWED_MIME_TYPES.includes(file.type);
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
  folderId: string | null
): Promise<TranscribeResult> {
  let transcriptionExtension = MIME_TO_EXTENSION[audioFile.type.toLowerCase()];
  if (!transcriptionExtension) {
    const parts = audioFile.name.split(".");
    transcriptionExtension = parts[parts.length - 1]?.toLowerCase() ?? "mp3";
  }

  const properFileName = audioFile.name.includes(".")
    ? audioFile.name
    : `audio.${transcriptionExtension}`;

  const audioFileWithName = new File([await audioFile.arrayBuffer()], properFileName, {
    type: audioFile.type,
  });

  const transcriptionResult = await openai.audio.transcriptions.create({
    file: audioFileWithName,
    model: "whisper-1",
  });

  const transcriptText = transcriptionResult.text;

  // Increment audio processing usage counter after successful transcription
  const { FeatureGateService } = await import('./feature-gate-service');
  await FeatureGateService.incrementAudioUsage(userId);

  const transcriptRecord = await prisma.transcript.create({
    data: {
      fileName: `${fileNameForRecord}.${audioFile.name.split(".").pop()}`,
      originalName: audioFile.name,
      content: transcriptText,
      cleanContent: transcriptText,
      type: "audio",
      userId,
      metadata: {
        fileSize: audioFile.size,
        mimeType: audioFile.type,
        duration: null,
      },
    },
  });

  const noteService = new NoteService();
  let noteResult: unknown = null;

  try {
    noteResult = await noteService.generateAINote(
      transcriptRecord.id,
      userId,
      folderId ?? undefined
    );
    // Increment note usage counter after successful note creation
    await FeatureGateService.incrementNoteUsage(userId);
  } catch (error) {
    console.error("Failed to generate AI notes:", error);
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
