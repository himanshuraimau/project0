import { SourceError } from "../errors";
import type { ParseResult } from "../types";

export async function parseTextFromUrl(url: string): Promise<ParseResult> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new SourceError(
      "FETCH_FAILED",
      `Failed to download text file: ${res.status}`
    );
  }
  const text = await res.text();
  return { text: normalizeWhitespace(text) };
}

export function parsePastedText(content: string, title?: string): ParseResult {
  return {
    text: normalizeWhitespace(content),
    title,
  };
}

function normalizeWhitespace(s: string): string {
  return s
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
