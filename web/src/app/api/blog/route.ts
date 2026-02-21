import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        coverImageUrl: true,
        instructorName: true,
        instructorImageUrl: true,
        publishedAt: true,
      },
    });
    const list = posts.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      coverImageUrl: p.coverImageUrl,
      instructorName: p.instructorName,
      instructorImageUrl: p.instructorImageUrl,
      publishedOn: p.publishedAt
        ? new Date(p.publishedAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : null,
    }));
    return NextResponse.json({ posts: list });
  } catch (error) {
    console.error("Blog list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}
