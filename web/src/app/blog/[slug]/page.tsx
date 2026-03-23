import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { prisma } from "@/lib/prisma";
import { getMetadata as getMeta, baseUrl } from "@/lib/blog-metadata";
import { BlogHeader } from "@/components/blog/BlogHeader";
import { renderArticleSchema } from "@/lib/blog-schema";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug, publishedAt: { not: null } },
    select: { title: true, content: true, coverImageUrl: true, instructorName: true, publishedAt: true },
  });
  if (!post) return { title: "Blog | Flinote" };
  const description =
    post.content.slice(0, 160).replace(/\s+/g, " ").trim() + (post.content.length > 160 ? "…" : "");
  const image = post.coverImageUrl ?? "/logo.png";
  return getMeta({
    path: `/blog/${slug}/`,
    title: `${post.title} | Flinote`,
    description,
    image: image.startsWith("http") ? image : undefined,
    ogType: "article",
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug, publishedAt: { not: null } },
  });
  if (!post) notFound();

  const publishedOn = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const description =
    post.content.slice(0, 200).replace(/\s+/g, " ").trim() + (post.content.length > 200 ? "…" : "");

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Blog",
        item: `${baseUrl}/blog`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: post.title,
        item: `${baseUrl}/blog/${post.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {post.publishedAt &&
        renderArticleSchema({
          headline: post.title,
          description,
          image: post.coverImageUrl ?? "/logo.png",
          author: { name: post.instructorName },
          datePublished: new Date(post.publishedAt).toISOString(),
          dateModified: new Date(post.updatedAt).toISOString(),
          articleUrl: `${baseUrl}/blog/${post.slug}`,
        })}
      <BlogHeader
        title={post.title}
        description={description}
        category="Insights"
        publishedOn={publishedOn}
      />
      {post.coverImageUrl && (
        <div className="relative w-full aspect-video rounded-lg border border-border overflow-hidden mb-8">
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 672px"
            priority
          />
        </div>
      )}
      <div className="flex items-center gap-3 mb-8">
        {post.instructorImageUrl && (
          <div className="relative size-12 rounded-full overflow-hidden border-2 border-border shrink-0">
            <Image
              src={post.instructorImageUrl}
              alt={post.instructorName}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
        )}
        <div>
          <p className="font-medium text-foreground">{post.instructorName}</p>
          <p className="text-sm text-muted-foreground">{publishedOn}</p>
        </div>
      </div>
      <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary prose-img:rounded-lg">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </article>
    </>
  );
}
