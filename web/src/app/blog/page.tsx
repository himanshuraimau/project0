import type { Metadata } from "next";
import { getMetadata } from "@/lib/blog-metadata";
import { blogs, type Blog } from "@/app/blog/data";
import { BlogListing } from "@/components/blog/BlogListing";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = getMetadata({
  path: "/blog/",
  title: "Blog | Flinote",
  description:
    "Insights and interview questions to help you study and learn better.",
});

const defaultCoverImage = {
  src: "/logo.png",
  height: 630,
  width: 1200,
  blurDataURL: "",
};

export default async function BlogPage() {
  const dbPosts = await prisma.blogPost.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    select: {
      title: true,
      slug: true,
      coverImageUrl: true,
      instructorName: true,
      publishedAt: true,
    },
  });

  const dbBlogs: Blog[] = dbPosts.map((p) => ({
    title: p.title,
    slug: p.slug,
    category: "Insights" as const,
    author: p.instructorName,
    publishedOn: p.publishedAt
      ? new Date(p.publishedAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "",
    image: p.coverImageUrl
      ? { src: p.coverImageUrl, height: 630, width: 1200, blurDataURL: "" }
      : defaultCoverImage,
  }));

  const allBlogs: Blog[] = [...dbBlogs, ...blogs];

  return (
    <section>
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
        Blog
      </h1>
      <p className="text-muted-foreground mb-8">
        Insights and resources for your learning journey.
      </p>
      <BlogListing allBlogs={allBlogs} />
    </section>
  );
}
