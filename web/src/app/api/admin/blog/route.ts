import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createBodySchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  content: z.string(),
  coverImageUrl: z.string().url().optional().nullable(),
  instructorName: z.string().min(1).max(200),
  instructorImageUrl: z.string().url().optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        coverImageUrl: true,
        instructorName: true,
        instructorImageUrl: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Admin blog list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let userId: string;
  try {
    userId = await requireAdmin(request);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = createBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.blogPost.findUnique({
      where: { slug: parsed.data.slug },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A post with this slug already exists" },
        { status: 409 }
      );
    }

    const post = await prisma.blogPost.create({
      data: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        content: parsed.data.content,
        coverImageUrl: parsed.data.coverImageUrl ?? null,
        instructorName: parsed.data.instructorName,
        instructorImageUrl: parsed.data.instructorImageUrl ?? null,
        publishedAt: parsed.data.publishedAt
          ? new Date(parsed.data.publishedAt)
          : null,
        createdById: userId,
      },
    });
    return NextResponse.json({ post });
  } catch (error) {
    console.error("Admin blog create error:", error);
    return NextResponse.json(
      { error: "Failed to create blog post" },
      { status: 500 }
    );
  }
}
