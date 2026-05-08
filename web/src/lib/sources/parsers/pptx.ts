import { parseOffice } from "officeparser";
import { SourceError } from "../errors";
import type { ParseResult } from "../types";

export async function parsePptxFromUrl(url: string): Promise<ParseResult> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    throw new SourceError(
      "FETCH_FAILED",
      err instanceof Error ? err.message : "Failed to fetch PPTX."
    );
  }
  if (!res.ok) {
    throw new SourceError(
      "FETCH_FAILED",
      `PPTX download failed: HTTP ${res.status}`
    );
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  try {
    const ast = await parseOffice(buffer);
    const raw = typeof ast.toText === "function" ? ast.toText() : "";
    const text = (raw ?? "")
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (text.length < 20) {
      throw new SourceError(
        "NO_CONTENT",
        "PPTX contains no readable text."
      );
    }
    return { text };
  } catch (err) {
    if (err instanceof SourceError) throw err;
    const msg = err instanceof Error ? err.message.toLowerCase() : String(err);
    if (msg.includes("corrupted") || msg.includes("invalid")) {
      throw new SourceError(
        "UNSUPPORTED_FORMAT",
        "Corrupted or invalid PPTX."
      );
    }
    throw new SourceError("INTERNAL", "Failed to parse PPTX.");
  }
}
