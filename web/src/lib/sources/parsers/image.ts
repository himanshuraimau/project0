import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { SourceError } from "../errors";
import type { ParseResult } from "../types";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const model = google("gemini-2.5-flash");

export async function parseImageFromUrl(
  url: string,
  filename: string
): Promise<ParseResult> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new SourceError(
      "INTERNAL",
      "Image OCR requires GOOGLE_GENERATIVE_AI_API_KEY."
    );
  }

  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    throw new SourceError(
      "FETCH_FAILED",
      err instanceof Error ? err.message : "Failed to fetch image."
    );
  }
  if (!res.ok) {
    throw new SourceError(
      "FETCH_FAILED",
      `Image download failed: HTTP ${res.status}`
    );
  }

  const mime = res.headers.get("content-type") || "image/jpeg";
  const bytes = new Uint8Array(await res.arrayBuffer());

  try {
    const { text } = await generateText({
      model,
      maxOutputTokens: 4000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract ALL readable text from this image — printed, handwritten, in diagrams, in tables, in signs. Preserve approximate layout with line breaks. If the image contains a diagram or chart, also describe it briefly under a "Diagram description:" heading. If the image is purely decorative with no text, reply with exactly: NO_TEXT`,
            },
            {
              type: "file",
              data: bytes,
              mediaType: mime,
            },
          ],
        },
      ],
    });

    const cleaned = (text ?? "").trim();
    if (!cleaned || cleaned === "NO_TEXT" || cleaned.length < 20) {
      throw new SourceError(
        "NO_CONTENT",
        "No readable text found in image."
      );
    }

    return {
      text: cleaned,
      title: filename,
      metadata: { ocrBy: "gemini-2.5-flash", mime },
    };
  } catch (err) {
    if (err instanceof SourceError) throw err;
    throw new SourceError(
      "INTERNAL",
      err instanceof Error ? err.message : "Image OCR failed."
    );
  }
}
