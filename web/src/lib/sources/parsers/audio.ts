import OpenAI from "openai";
import { SourceError } from "../errors";
import type { ParseResult } from "../types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function parseAudioFromUrl(
  audioUrl: string,
  filename: string
): Promise<ParseResult> {
  let res: Response;
  try {
    res = await fetch(audioUrl);
  } catch (err) {
    throw new SourceError(
      "FETCH_FAILED",
      err instanceof Error ? err.message : "Failed to fetch audio."
    );
  }
  if (!res.ok) {
    throw new SourceError(
      "FETCH_FAILED",
      `Audio download failed: HTTP ${res.status}`
    );
  }

  const arrayBuffer = await res.arrayBuffer();
  const fileForApi = new File([arrayBuffer], filename || "audio.mp3", {
    type: res.headers.get("content-type") || "audio/mpeg",
  });

  let transcript: string;
  try {
    const result = await openai.audio.transcriptions.create({
      file: fileForApi,
      model: "whisper-1",
    });
    transcript = result.text;
  } catch (err) {
    const msg = err instanceof Error ? err.message.toLowerCase() : String(err);
    if (msg.includes("invalid") || msg.includes("unsupported")) {
      throw new SourceError(
        "UNSUPPORTED_FORMAT",
        "Audio format not supported by Whisper."
      );
    }
    throw new SourceError(
      "INTERNAL",
      err instanceof Error ? err.message : "Whisper failed."
    );
  }

  if (!transcript || transcript.trim().length < 20) {
    throw new SourceError(
      "NO_CONTENT",
      "Audio produced no transcript (no speech detected)."
    );
  }

  return { text: transcript, metadata: { transcribedBy: "whisper-1" } };
}
