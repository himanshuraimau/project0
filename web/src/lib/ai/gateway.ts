/**
 * Central Vercel AI Gateway configuration.
 *
 * Every AI model call in the app routes through the Vercel AI Gateway with a single
 * `AI_GATEWAY_API_KEY`:
 *  - Text generation, structured output, streaming and embeddings use the AI SDK
 *    gateway provider (`aiGateway`).
 *  - OpenAI audio endpoints (Whisper transcription + TTS) are NOT exposed by the
 *    gateway at all (its OpenAI-compatible API only serves /models, /chat/completions
 *    and /embeddings — /v1/audio/* returns 404), so audio goes directly to the
 *    OpenAI API with `OPENAI_API_KEY` (`openaiAudio`).
 *
 * Gateway model ids use the `creator/model` slug form; audio model ids are bare
 * OpenAI names. All are env-overridable.
 */
import { createGateway } from "ai";
import OpenAI from "openai";

const apiKey = process.env.AI_GATEWAY_API_KEY;

/** Ensure a model id carries a provider prefix — the gateway requires `creator/model`. */
function withProvider(model: string, defaultProvider = "openai"): string {
  return model.includes("/") ? model : `${defaultProvider}/${model}`;
}

/** Strip any `creator/` prefix — the OpenAI API expects bare model names. */
function withoutProvider(model: string): string {
  const slash = model.lastIndexOf("/");
  return slash === -1 ? model : model.slice(slash + 1);
}

/** AI SDK gateway provider — text, structured output, streaming, embeddings, images. */
export const aiGateway = createGateway({ apiKey });

/** Raw OpenAI SDK for audio (Whisper STT + TTS) — direct to OpenAI, not the gateway. */
export const openaiAudio = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || undefined,
});

/** Centralized, env-overridable model ids (gateway `creator/model` slugs). */
export const AI_MODELS = {
  /** Note generation (was OpenRouter google/gemini-3.1-flash-lite-preview). */
  notes: process.env.AI_MODEL_NOTES || "google/gemini-2.5-flash-lite",
  /** Source preview/summary. */
  summary: process.env.AI_MODEL_SUMMARY || "google/gemini-2.5-flash-lite",
  /** Image OCR. */
  ocr: process.env.AI_MODEL_OCR || "google/gemini-2.5-flash",
  /** Course / chapter content / quiz / flashcard / mindmap generation. */
  course: withProvider(process.env.AI_MODEL_COURSE || "gpt-4o"),
  /** General chat & streaming (chatbot, chapter chat, podcast chat). */
  chat: withProvider(process.env.CHAT_MODEL || "gpt-4o-mini"),
  /** Quizzes & flashcards generated from notes. */
  quiz: withProvider(process.env.AI_MODEL_QUIZ || "gpt-4o-mini"),
  /** Note translation. */
  translation: withProvider(process.env.AI_MODEL_TRANSLATION || "gpt-4o"),
  /** Podcast / voice transcript script. */
  transcript: withProvider(process.env.AI_MODEL_TRANSCRIPT || "gpt-5-mini"),
  /** Text embeddings. */
  embedding: withProvider(process.env.EMBEDDING_MODEL || "text-embedding-3-small"),
  /** Whisper speech-to-text (raw OpenAI SDK, direct to OpenAI). */
  transcription: withoutProvider(process.env.AI_MODEL_TRANSCRIPTION || "whisper-1"),
  /** Text-to-speech (raw OpenAI SDK, direct to OpenAI). */
  tts: withoutProvider(process.env.AI_MODEL_TTS || "gpt-4o-mini-tts"),
} as const;

/** Whether the gateway API key is configured. */
export function isGatewayConfigured(): boolean {
  return !!apiKey;
}

/** Whether the direct OpenAI key (required for audio STT/TTS) is configured. */
export function isOpenAIAudioConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
