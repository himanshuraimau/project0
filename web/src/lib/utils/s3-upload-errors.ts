const S3_CORS_ERROR_MESSAGE =
  "Upload to S3 was blocked by CORS. Configure your S3 bucket CORS to allow PUT from http://localhost:3000 (and your production domain).";

export function normalizeS3UploadError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Failed to transcribe audio";
  }

  const message = error.message.toLowerCase();
  const isLikelyCorsFailure =
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed");

  if (isLikelyCorsFailure) {
    return S3_CORS_ERROR_MESSAGE;
  }

  return error.message;
}

