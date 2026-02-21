"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit01Icon,
  Delete01Icon,
  Add01Icon,
  Note01Icon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface BlogPostRow {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  instructorName: string;
  instructorImageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function AdminBlogContent() {
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/admin/blog");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch (e) {
      toast.error("Failed to load blog posts");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/blog/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Post deleted");
      setDeleteId(null);
      fetchPosts();
    } catch {
      toast.error("Failed to delete post");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

  return (
    <div className="space-y-8 p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HugeiconsIcon icon={Note01Icon} className="size-7 text-primary" />
            Blog posts
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage blog posts. Only published posts appear on the public blog.
          </p>
        </div>
        <Link href="/dashboard/admin/blog/new">
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <HugeiconsIcon icon={Add01Icon} className="size-4" />
            New post
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden border-border animate-pulse">
              <div className="aspect-video bg-muted" />
              <CardHeader>
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card className="border-dashed border-2 border-border bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <HugeiconsIcon icon={Note01Icon} className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-medium">No blog posts yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Create your first post to get started.</p>
            <Link href="/dashboard/admin/blog/new">
              <Button className="gap-2">New post</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {posts.map((post) => (
            <Card
              key={post.id}
              className="overflow-hidden border-border transition-shadow hover:shadow-md"
            >
              <div className="aspect-video relative w-full overflow-hidden bg-muted">
                {post.coverImageUrl ? (
                  <Image
                    src={post.coverImageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <HugeiconsIcon icon={Note01Icon} className="size-12" />
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-2 text-lg">{post.title}</CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <HugeiconsIcon icon={Calendar03Icon} className="size-3.5" />
                  {post.publishedAt ? (
                    <span className="text-primary font-medium">Published {formatDate(post.publishedAt)}</span>
                  ) : (
                    <span>Draft</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">By {post.instructorName}</p>
              </CardHeader>
              <CardContent className="flex gap-2 pt-0">
                <Link href={`/dashboard/admin/blog/${post.id}/edit`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full gap-1.5">
                    <HugeiconsIcon icon={Edit01Icon} className="size-3.5" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleteId(post.id)}
                >
                  <HugeiconsIcon icon={Delete01Icon} className="size-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The post will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
