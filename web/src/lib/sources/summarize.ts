import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { jsonrepair } from "jsonrepair";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const model = openrouter.chat("google/gemini-3.1-flash-lite-preview");

export interface SourceSummary {
  summary: string;
  keyTopics: string[];
  suggestedQuestions: string[];
}

/**
 * Generate a short NotebookLM-style source preview.
 * Kept small + resilient — parse failures return empty fields rather than failing
 * the pipeline. The source is still usable for grounding without a summary.
 */
export async function summarizeSource(
  title: string,
  text: string
): Promise<SourceSummary> {
  const empty: SourceSummary = {
    summary: "",
    keyTopics: [],
    suggestedQuestions: [],
  };

  if (!process.env.OPENROUTER_API_KEY) {
    return empty;
  }

  const trimmed = text.length > 30000 ? text.substring(0, 30000) : text;

  try {
    const { text: raw } = await generateText({
      model,
      maxOutputTokens: 800,
      prompt: `You are summarizing one document for a NotebookLM-style source preview. Reply with STRICT JSON only, no prose, no code fences.

Document title: ${title}

Content:
"""
${trimmed}
"""

Return JSON with this exact shape:
{
  "summary": "3-5 sentence summary of what the document covers",
  "keyTopics": ["topic 1", "topic 2", "topic 3", "topic 4", "topic 5"],
  "suggestedQuestions": ["q1?", "q2?", "q3?", "q4?", "q5?"]
}

Rules:
- summary: 3-5 sentences, plain text, no markdown
- keyTopics: 3-5 short noun phrases (2-5 words each)
- suggestedQuestions: 3-5 questions the user could ask about this source`,
    });

    const parsed = safeParseJson(raw);
    if (!parsed) return empty;

    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      keyTopics: Array.isArray(parsed.keyTopics)
        ? parsed.keyTopics.filter((t: unknown): t is string => typeof t === "string").slice(0, 5)
        : [],
      suggestedQuestions: Array.isArray(parsed.suggestedQuestions)
        ? parsed.suggestedQuestions
            .filter((q: unknown): q is string => typeof q === "string")
            .slice(0, 5)
        : [],
    };
  } catch (err) {
    console.error("[sources/summarize] failed:", err);
    return empty;
  }
}

function safeParseJson(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    try {
      return JSON.parse(jsonrepair(trimmed));
    } catch {
      return null;
    }
  }
}
