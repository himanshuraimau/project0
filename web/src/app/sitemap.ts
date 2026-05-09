import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://flinote.ai";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch published blog posts from the database.
  // During build/CI the DB may be unreachable; fall back to static routes.
  let dbPosts: Array<{ slug: string; publishedAt: Date | null }> = [];
  try {
    dbPosts = await prisma.blogPost.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      select: {
        slug: true,
        publishedAt: true,
      },
    });
  } catch {
    dbPosts = [];
  }

  const blogRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blog`,
      lastModified: dbPosts[0]?.publishedAt ?? new Date("2025-01-01"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...dbPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.publishedAt ?? new Date("2025-01-01"),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date("2025-03-01"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/sign-up`,
      lastModified: new Date("2025-03-01"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date("2025-03-01"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: new Date("2025-03-01"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date("2025-02-06"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date("2025-02-06"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  return [...blogRoutes, ...staticRoutes];
}
