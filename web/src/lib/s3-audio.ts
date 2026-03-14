import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client } from "@aws-sdk/client-s3";

const PRESIGNED_GET_EXPIRES_IN = 3600; // 1 hour for server to fetch and transcribe
const PRESIGNED_PUT_EXPIRES_IN = 900; // 15 min to upload

function getS3Client(): S3Client {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "S3 is not configured. Set AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY."
    );
  }

  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function getBucket(): string {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) {
    throw new Error("S3_BUCKET_NAME is not set.");
  }
  return bucket;
}

/**
 * Sanitize filename for S3 key (avoid path traversal and special chars).
 */
function sanitizeFileName(fileName: string): string {
  const base = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return base.slice(0, 200) || "audio";
}

export interface PresignedAudioUrls {
  uploadUrl: string;
  transcribeUrl: string;
  key: string;
}

/**
 * Generate presigned PUT URL for client upload and presigned GET URL
 * for the server to fetch the file when transcribing.
 * Keys use prefix temp/audio/ for S3 lifecycle auto-deletion.
 */
export async function getPresignedAudioUrls(
  userId: string,
  fileName: string,
  contentType: string
): Promise<PresignedAudioUrls> {
  const bucket = getBucket();
  const prefix = process.env.S3_AUDIO_PREFIX ?? "temp/audio";
  const safeName = sanitizeFileName(fileName);
  const fileId = `${Date.now()}-${safeName}`;
  const key = `${prefix}/${userId}/${fileId}`;

  const client = getS3Client();

  const putCommand = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const getCommand = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const [uploadUrl, transcribeUrl] = await Promise.all([
    getSignedUrl(client, putCommand, { expiresIn: PRESIGNED_PUT_EXPIRES_IN }),
    getSignedUrl(client, getCommand, { expiresIn: PRESIGNED_GET_EXPIRES_IN }),
  ]);

  return { uploadUrl, transcribeUrl, key };
}

export interface PresignedUploadUrls {
  uploadUrl: string;
  downloadUrl: string;
  key: string;
}

/**
 * Generate presigned PUT URL for client upload and presigned GET URL
 * for the server to fetch the PDF when processing.
 * Keys use prefix temp/pdf/ for S3 lifecycle auto-deletion.
 */
export async function getPresignedPdfUrls(
  userId: string,
  fileName: string,
  contentType: string
): Promise<PresignedUploadUrls> {
  const bucket = getBucket();
  const prefix = process.env.S3_PDF_PREFIX ?? "temp/pdf";
  const safeName = sanitizeFileName(fileName);
  const fileId = `${Date.now()}-${safeName}`;
  const key = `${prefix}/${userId}/${fileId}`;

  const client = getS3Client();

  const putCommand = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const getCommand = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const [uploadUrl, downloadUrl] = await Promise.all([
    getSignedUrl(client, putCommand, { expiresIn: PRESIGNED_PUT_EXPIRES_IN }),
    getSignedUrl(client, getCommand, { expiresIn: PRESIGNED_GET_EXPIRES_IN }),
  ]);

  return { uploadUrl, downloadUrl, key };
}

export interface PresignedImageUrls {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

/**
 * Generate presigned PUT URL for client image upload.
 * Returns both the presigned upload URL and the permanent public URL for the image.
 * Keys use prefix images/ so they are not subject to temp lifecycle deletion.
 */
export async function getPresignedImageUrl(
  userId: string,
  fileName: string,
  contentType: string,
  prefix: string = "images"
): Promise<PresignedImageUrls> {
  const bucket = getBucket();
  const safeName = sanitizeFileName(fileName);
  const fileId = `${Date.now()}-${safeName}`;
  const key = `${prefix}/${userId}/${fileId}`;

  const client = getS3Client();
  const region = process.env.AWS_REGION!;

  const putCommand = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, putCommand, {
    expiresIn: PRESIGNED_PUT_EXPIRES_IN,
  });

  // Permanent public URL (requires bucket/object to be publicly readable)
  const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

  return { uploadUrl, publicUrl, key };
}

export function isS3Configured(): boolean {
  return !!(
    process.env.AWS_REGION &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET_NAME
  );
}
