import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { BlogEditorForm } from "@/components/admin/blog-editor-form";

export default async function AdminBlogEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { id },
  });

  if (!post) {
    notFound();
  }

  return (
    <BlogEditorForm
      postId={post.id}
      initial={{
        title: post.title,
        slug: post.slug,
        content: post.content,
        coverImageUrl: post.coverImageUrl,
        instructorName: post.instructorName,
        instructorImageUrl: post.instructorImageUrl,
        publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
      }}
    />
  );
}
