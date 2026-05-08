export type SourceKind =
  | "pdf"
  | "docx"
  | "txt"
  | "md"
  | "pptx"
  | "csv"
  | "url"
  | "youtube"
  | "audio"
  | "image"
  | "text";

export type SourceStatus =
  | "queued"
  | "uploading"
  | "processing"
  | "ready"
  | "failed"
  | "skipped";

export type SourceStage =
  | "queued"
  | "parsing"
  | "chunking"
  | "embedding"
  | "summarizing"
  | "ready"
  | "failed";

export type SourceErrorCode =
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FORMAT"
  | "NO_CONTENT"
  | "FETCH_FAILED"
  | "QUOTA_EXCEEDED"
  | "INTERNAL";

export interface ParseResult {
  text: string;
  title?: string;
  metadata?: Record<string, unknown>;
}

export type BatchItem =
  | {
      kind: "file";
      uploadKey: string;
      url: string;
      filename: string;
      size: number;
      mime: string;
    }
  | { kind: "url"; url: string }
  | { kind: "youtube"; url: string }
  | { kind: "text"; title?: string; content: string }
  | { kind: "audio"; s3Key: string; s3Url: string; filename: string };

export interface SourceProgressEvent {
  transcriptId: string;
  batchId: string | null;
  sourceKind: SourceKind;
  status: SourceStatus;
  stage: SourceStage | null;
  progress: number;
  message: string;
  errorCode?: SourceErrorCode | null;
  title?: string;
  updatedAt: number;
}

export const SOURCE_MAX_WORDS = Number(process.env.SOURCE_MAX_WORDS ?? 500_000);
export const SOURCE_MAX_PER_BATCH = Number(
  process.env.SOURCE_MAX_PER_BATCH ?? 50
);
export const SOURCE_CONCURRENCY_PER_USER = Number(
  process.env.SOURCE_CONCURRENCY_PER_USER ?? 5
);

export const SUPPORTED_FILE_MIMES: Record<string, SourceKind> = {
  "application/pdf": "pdf",
  "text/plain": "txt",
  "text/markdown": "md",
  "text/x-markdown": "md",
  "text/csv": "csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "pptx",
  "image/png": "image",
  "image/jpeg": "image",
  "image/jpg": "image",
  "image/webp": "image",
  "image/heic": "image",
  "image/heif": "image",
};

export function mimeToKind(mime: string): SourceKind | null {
  return SUPPORTED_FILE_MIMES[mime] ?? null;
}
