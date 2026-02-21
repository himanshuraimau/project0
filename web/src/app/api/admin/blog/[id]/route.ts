import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateBodySchema = z.object({
  title: z.string().min(1).max(500).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  content: z.string().optional(),
  coverImageUrl: z.string().url().optional().nullable(),
  instructorName: z.string().min(1).max(200).optional(),
  instructorImageUrl: z.string().url().optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Forbidden" },
      { status: 403 }
    );
  }

  const { id } = await params;
  try {
    const post = await prisma.blogPost.findUnique({
      where: { id },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json({ post });
  } catch (error) {
    console.error("Admin blog get error:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Forbidden" },
      { status: 403 }
    );
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = updateBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (parsed.data.slug) {
      const existing = await prisma.blogPost.findFirst({
        where: { slug: parsed.data.slug, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "A post with this slug already exists" },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.slug !== undefined) updateData.slug = parsed.data.slug;
    if (parsed.data.content !== undefined) updateData.content = parsed.data.content;
    if (parsed.data.coverImageUrl !== undefined)
      updateData.coverImageUrl = parsed.data.coverImageUrl;
    if (parsed.data.instructorName !== undefined)
      updateData.instructorName = parsed.data.instructorName;
    if (parsed.data.instructorImageUrl !== undefined)
      updateData.instructorImageUrl = parsed.data.instructorImageUrl;
    if (parsed.data.publishedAt !== undefined)
      updateData.publishedAt = parsed.data.publishedAt
        ? new Date(parsed.data.publishedAt)
        : null;

    const post = await prisma.blogPost.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json({ post });
  } catch (error) {
    console.error("Admin blog update error:", error);
    return NextResponse.json(
      { error: "Failed to update blog post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Forbidden" },
      { status: 403 }
    );
  }

  const { id } = await params;
  try {
    await prisma.blogPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin blog delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete blog post" },
      { status: 500 }
    );
  }
}
