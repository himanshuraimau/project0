import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getPresignedImageUrl } from "@/lib/s3-audio";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileName, contentType, size, scope } = await request.json();

    if (!fileName || !contentType) {
      return NextResponse.json({ error: "fileName and contentType are required" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
    }

    if (size && size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 8 MB)" }, { status: 400 });
    }

    // Blog images are admin-only
    if (scope === "blog") {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      if (user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Admin only" }, { status: 403 });
      }
    }

    const prefix = scope === "blog" ? "images/blog" : "images/profiles";
    const { uploadUrl, publicUrl, key } = await getPresignedImageUrl(
      session.user.id,
      fileName,
      contentType,
      prefix
    );

    return NextResponse.json({ uploadUrl, publicUrl, key });
  } catch (error) {
    console.error("Error generating image upload URL:", error);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
