import type { SourceErrorCode } from "./types";

export class SourceError extends Error {
  constructor(
    public code: SourceErrorCode,
    message: string
  ) {
    super(message);
    this.name = "SourceError";
  }
}

const USER_MESSAGES: Record<SourceErrorCode, string> = {
  FILE_TOO_LARGE: "File is over 200 MB. Split it into parts.",
  UNSUPPORTED_FORMAT: "We don't support this file type yet.",
  NO_CONTENT:
    "We couldn't find readable text. Audio with no speech, a paywalled page, or a captionless video will fail.",
  FETCH_FAILED: "Couldn't reach this source. Try again.",
  QUOTA_EXCEEDED:
    "You've used all your source slots this month. Upgrade to add more.",
  INTERNAL: "Something went wrong on our end. Retry, or try again later.",
};

export function userMessageFor(code: SourceErrorCode): string {
  return USER_MESSAGES[code];
}

export function mapUnknownToSourceError(err: unknown): SourceError {
  if (err instanceof SourceError) return err;
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();

  if (
    lower.includes("password") ||
    lower.includes("copy-protected") ||
    lower.includes("invalid pdf") ||
    lower.includes("corrupted")
  ) {
    return new SourceError("UNSUPPORTED_FORMAT", message);
  }

  if (
    lower.includes("too large") ||
    lower.includes("exceeds") ||
    lower.includes("size limit")
  ) {
    return new SourceError("FILE_TOO_LARGE", message);
  }

  if (
    lower.includes("no captions") ||
    lower.includes("transcript") ||
    lower.includes("no speech") ||
    lower.includes("paywall") ||
    lower.includes("empty")
  ) {
    return new SourceError("NO_CONTENT", message);
  }

  if (
    lower.includes("fetch") ||
    lower.includes("network") ||
    lower.includes("timeout") ||
    lower.includes("unreachable")
  ) {
    return new SourceError("FETCH_FAILED", message);
  }

  return new SourceError("INTERNAL", message);
}
