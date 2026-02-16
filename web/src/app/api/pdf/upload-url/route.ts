import { NextRequest, NextResponse } from "next/server";
import { getUserFromAuth } from "@/lib/auth-helper";
import { getPresignedPdfUrls, isS3Configured } from "@/lib/s3-audio";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserFromAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!isS3Configured()) {
      return NextResponse.json(
        {
          error:
            "PDF upload via S3 is not configured. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, and S3_BUCKET_NAME.",
        },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";
    const contentType = typeof body.contentType === "string" ? body.contentType.trim() : "";
    const fileSize = typeof body.fileSize === "number" ? body.fileSize : 0;

    if (!fileName) {
      return NextResponse.json({ error: "fileName is required" }, { status: 400 });
    }
    if (!contentType) {
      return NextResponse.json({ error: "contentType is required" }, { status: 400 });
    }
    if (fileSize <= 0 || fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size must be between 1 byte and 20MB. Received: ${(fileSize / 1024 / 1024).toFixed(2)}MB.`,
          maxSizeMB: 20,
        },
        { status: 400 }
      );
    }

    const { uploadUrl, downloadUrl } = await getPresignedPdfUrls(
      userId,
      fileName,
      contentType
    );

    return NextResponse.json({ uploadUrl, downloadUrl });
  } catch (error) {
    console.error("PDF upload URL error:", error);
    const message = error instanceof Error ? error.message : "Failed to get upload URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
