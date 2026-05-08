import { PDFParser } from "@/lib/pdf-parser";
import { SourceError } from "../errors";
import type { ParseResult } from "../types";

const parser = new PDFParser();

export async function parsePdfFromUrl(url: string): Promise<ParseResult> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new SourceError(
      "FETCH_FAILED",
      `Failed to download PDF from upload: ${res.status}`
    );
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  try {
    const result = await parser.parseFromBuffer(buffer);
    return {
      text: result.cleanText,
      metadata: {
        pages: result.pages,
        ...result.metadata,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message.toLowerCase() : String(err);
    if (msg.includes("password")) {
      throw new SourceError("UNSUPPORTED_FORMAT", "Password-protected PDF.");
    }
    if (msg.includes("invalid pdf") || msg.includes("corrupted")) {
      throw new SourceError("UNSUPPORTED_FORMAT", "Corrupted or invalid PDF.");
    }
    if (msg.includes("no text")) {
      throw new SourceError("NO_CONTENT", "PDF contains no extractable text.");
    }
    throw err;
  }
}
