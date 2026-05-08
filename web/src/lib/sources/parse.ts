import type { Prisma, Transcript } from "@prisma/client";
import { SourceError } from "./errors";
import { parseAudioFromUrl } from "./parsers/audio";
import { parseCsvFromUrl } from "./parsers/csv";
import { parseDocxFromUrl } from "./parsers/docx";
import { parseImageFromUrl } from "./parsers/image";
import { parsePdfFromUrl } from "./parsers/pdf";
import { parsePptxFromUrl } from "./parsers/pptx";
import { parsePastedText, parseTextFromUrl } from "./parsers/text";
import { parseUrl } from "./parsers/url";
import { parseYoutube } from "./parsers/youtube";
import type { ParseResult, SourceKind } from "./types";

type RawInput = Prisma.JsonValue | null;

function readField(raw: RawInput, key: string): string | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const v = (raw as Record<string, unknown>)[key];
  return typeof v === "string" ? v : undefined;
}

/**
 * Dispatch by sourceKind to the right parser.
 * Parsers are pure: they return text + metadata; they do not touch the DB.
 */
export async function parseSource(
  transcript: Pick<
    Transcript,
    "sourceKind" | "uploadKey" | "rawInput" | "originalName"
  >
): Promise<ParseResult> {
  const kind = transcript.sourceKind as SourceKind | null;
  if (!kind) {
    throw new SourceError(
      "UNSUPPORTED_FORMAT",
      "Source kind not set on transcript."
    );
  }

  const raw = transcript.rawInput ?? null;

  switch (kind) {
    case "pdf": {
      const url = readField(raw, "url") ?? transcript.uploadKey ?? "";
      if (!url) {
        throw new SourceError("INTERNAL", "PDF upload URL missing.");
      }
      return parsePdfFromUrl(url);
    }

    case "txt":
    case "md": {
      const url = readField(raw, "url") ?? transcript.uploadKey ?? "";
      if (!url) {
        throw new SourceError("INTERNAL", "Text upload URL missing.");
      }
      return parseTextFromUrl(url);
    }

    case "text": {
      const content = readField(raw, "content") ?? "";
      return parsePastedText(content, readField(raw, "title"));
    }

    case "url": {
      const url = readField(raw, "url") ?? "";
      if (!url) {
        throw new SourceError("INTERNAL", "Source URL missing.");
      }
      return parseUrl(url);
    }

    case "youtube": {
      const url = readField(raw, "url") ?? "";
      if (!url) {
        throw new SourceError("INTERNAL", "YouTube URL missing.");
      }
      return parseYoutube(url);
    }

    case "audio": {
      const url = readField(raw, "url") ?? readField(raw, "s3Url") ?? "";
      const filename =
        readField(raw, "filename") ?? transcript.originalName ?? "audio.mp3";
      if (!url) {
        throw new SourceError("INTERNAL", "Audio URL missing.");
      }
      return parseAudioFromUrl(url, filename);
    }

    case "docx": {
      const url = readField(raw, "url") ?? transcript.uploadKey ?? "";
      if (!url) {
        throw new SourceError("INTERNAL", "DOCX upload URL missing.");
      }
      return parseDocxFromUrl(url);
    }

    case "pptx": {
      const url = readField(raw, "url") ?? transcript.uploadKey ?? "";
      if (!url) {
        throw new SourceError("INTERNAL", "PPTX upload URL missing.");
      }
      return parsePptxFromUrl(url);
    }

    case "csv": {
      const url = readField(raw, "url") ?? transcript.uploadKey ?? "";
      if (!url) {
        throw new SourceError("INTERNAL", "CSV upload URL missing.");
      }
      return parseCsvFromUrl(url);
    }

    case "image": {
      const url = readField(raw, "url") ?? transcript.uploadKey ?? "";
      const filename =
        readField(raw, "filename") ?? transcript.originalName ?? "image";
      if (!url) {
        throw new SourceError("INTERNAL", "Image upload URL missing.");
      }
      return parseImageFromUrl(url, filename);
    }

    default:
      throw new SourceError(
        "UNSUPPORTED_FORMAT",
        `Unknown source kind: ${kind}`
      );
  }
}
