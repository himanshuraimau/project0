import { YoutubeTranscript } from "youtube-transcript";
import { SourceError } from "../errors";
import type { ParseResult } from "../types";

const YT_ID_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

export function extractYoutubeId(url: string): string | null {
  const match = url.match(YT_ID_REGEX);
  return match ? match[1] : null;
}

export async function parseYoutube(url: string): Promise<ParseResult> {
  const videoId = extractYoutubeId(url);
  if (!videoId) {
    throw new SourceError("UNSUPPORTED_FORMAT", "Invalid YouTube URL.");
  }

  let segments;
  try {
    segments = await YoutubeTranscript.fetchTranscript(videoId);
  } catch (err) {
    const msg = err instanceof Error ? err.message.toLowerCase() : String(err);
    if (
      msg.includes("transcript") ||
      msg.includes("caption") ||
      msg.includes("disabled")
    ) {
      throw new SourceError(
        "NO_CONTENT",
        "YouTube video has no available captions."
      );
    }
    throw new SourceError("FETCH_FAILED", "Couldn't fetch YouTube transcript.");
  }

  if (!segments || segments.length === 0) {
    throw new SourceError(
      "NO_CONTENT",
      "YouTube video has no available captions."
    );
  }

  const text = segments
    .map((s) => s.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    text,
    title: `YouTube · ${videoId}`,
    metadata: { videoId, url },
  };
}
