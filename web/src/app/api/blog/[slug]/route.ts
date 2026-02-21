import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug, publishedAt: { not: null } },
    });
    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        coverImageUrl: post.coverImageUrl,
        instructorName: post.instructorName,
        instructorImageUrl: post.instructorImageUrl,
        publishedAt: post.publishedAt,
        publishedOn: post.publishedAt
          ? new Date(post.publishedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : null,
      },
    });
  } catch (error) {
    console.error("Blog post get error:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 }
    );
  }
}
