"use client";

import React, { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Image01Icon, UserIcon, CheckmarkCircle01Icon, Loading01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { cn } from "@/lib/utils";

async function uploadImageToS3(file: File, scope: "blog" | "profile"): Promise<string> {
  const res = await fetch("/api/image/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      scope,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to get upload URL");
  }
  const { uploadUrl, publicUrl } = await res.json();
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!uploadRes.ok) throw new Error("S3 upload failed");
  return publicUrl;
}

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false, loading: () => <div className="h-[400px] rounded-lg border border-border bg-muted/30 animate-pulse" /> }
);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface BlogEditorFormProps {
  postId?: string;
  initial?: {
    title: string;
    slug: string;
    content: string;
    coverImageUrl: string | null;
    instructorName: string;
    instructorImageUrl: string | null;
    publishedAt: string | null;
  };
}

export function BlogEditorForm({ postId, initial }: BlogEditorFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(initial?.coverImageUrl ?? null);
  const [instructorName, setInstructorName] = useState(initial?.instructorName ?? "");
  const [instructorImageUrl, setInstructorImageUrl] = useState<string | null>(
    initial?.instructorImageUrl ?? null
  );
  const [publishNow, setPublishNow] = useState(!!initial?.publishedAt);
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [instructorUploading, setInstructorUploading] = useState(false);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setTitle(v);
    if (!initial?.slug || slug === slugify(initial.title)) {
      setSlug(slugify(v));
    }
  }, [initial?.slug, initial?.title, slug]);

  const handleCoverFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setCoverUploading(true);
      e.target.value = "";
      try {
        const url = await uploadImageToS3(file, "blog");
        setCoverImageUrl(url);
      } catch {
        toast.error("Cover image upload failed");
      } finally {
        setCoverUploading(false);
      }
    },
    []
  );

  const handleInstructorFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setInstructorUploading(true);
      e.target.value = "";
      try {
        const url = await uploadImageToS3(file, "blog");
        setInstructorImageUrl(url);
      } catch {
        toast.error("Instructor image upload failed");
      } finally {
        setInstructorUploading(false);
      }
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!slug.trim()) {
      toast.error("Slug is required");
      return;
    }
    if (!instructorName.trim()) {
      toast.error("Instructor name is required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        content: content.trim(),
        coverImageUrl: coverImageUrl || null,
        instructorName: instructorName.trim(),
        instructorImageUrl: instructorImageUrl || null,
        publishedAt: publishNow
          ? (initial?.publishedAt ? new Date(initial.publishedAt).toISOString() : new Date().toISOString())
          : null,
      };
      if (postId) {
        const res = await fetch(`/api/admin/blog/${postId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Update failed");
        }
        toast.success("Post updated");
        router.push("/dashboard/admin/blog");
        router.refresh();
      } else {
        const res = await fetch("/api/admin/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Create failed");
        }
        toast.success("Post created");
        router.push("/dashboard/admin/blog");
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <form onSubmit={handleSubmit} className="space-y-8 p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin/blog">
          <Button type="button" variant="ghost" size="icon" className="shrink-0">
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {postId ? "Edit post" : "New post"}
        </h1>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Basics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={handleTitleChange}
              placeholder="How to study better in 2026"
              className="max-w-xl"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="slug">URL slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="how-to-study-better-2026"
              className="max-w-xl font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Used in the URL: /blog/{slug || "your-slug"}/
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HugeiconsIcon icon={Image01Icon} className="size-5" />
            Cover image (thumbnail)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {coverImageUrl ? (
            <div className="relative aspect-video max-w-xl rounded-lg overflow-hidden border border-border bg-muted">
              <Image src={coverImageUrl} alt="Cover" fill className="object-cover" sizes="640px" />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                <Label htmlFor="cover-upload" className="cursor-pointer">
                  <span className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
                    Change
                  </span>
                  <input
                    id="cover-upload"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleCoverFile}
                    disabled={coverUploading}
                  />
                </Label>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setCoverImageUrl(null)}
                  disabled={coverUploading}
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <Label
              htmlFor="cover-upload-empty"
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 aspect-video max-w-xl cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50",
                coverUploading && "opacity-60 pointer-events-none"
              )}
            >
              <HugeiconsIcon icon={Image01Icon} className="size-10 text-muted-foreground mb-2" />
              <span className="text-sm font-medium text-muted-foreground">
                {coverUploading ? "Uploading…" : "Click to upload cover image"}
              </span>
              <input
                id="cover-upload-empty"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleCoverFile}
                disabled={coverUploading}
              />
            </Label>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HugeiconsIcon icon={UserIcon} className="size-5" />
            Instructor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="instructorName">Instructor name</Label>
            <Input
              id="instructorName"
              value={instructorName}
              onChange={(e) => setInstructorName(e.target.value)}
              placeholder="Jane Doe"
              className="max-w-md"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {instructorImageUrl ? (
              <div className="relative size-20 rounded-full overflow-hidden border-2 border-border">
                <Image
                  src={instructorImageUrl}
                  alt={instructorName || "Instructor"}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                  <Label htmlFor="instructor-upload" className="cursor-pointer">
                    <span className="text-xs text-white underline">Change</span>
                    <input
                      id="instructor-upload"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleInstructorFile}
                      disabled={instructorUploading}
                    />
                  </Label>
                  <button
                    type="button"
                    className="text-xs text-white underline"
                    onClick={() => setInstructorImageUrl(null)}
                    disabled={instructorUploading}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <Label
                htmlFor="instructor-upload-empty"
                className={cn(
                  "flex size-20 flex-col items-center justify-center rounded-full border-2 border-dashed border-border bg-muted/30 cursor-pointer transition-colors hover:border-primary/50",
                  instructorUploading && "opacity-60 pointer-events-none"
                )}
              >
                <HugeiconsIcon icon={UserIcon} className="size-8 text-muted-foreground" />
                <input
                  id="instructor-upload-empty"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleInstructorFile}
                  disabled={instructorUploading}
                />
              </Label>
            )}
            <span className="text-sm text-muted-foreground">
              {instructorUploading ? "Uploading…" : "Profile image (optional)"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Content (Markdown)</CardTitle>
        </CardHeader>
        <CardContent>
          <div data-color-mode={isDark ? "dark" : "light"} className="[&_.w-md-editor]:rounded-lg [&_.w-md-editor-toolbar]:rounded-t-lg">
            <MDEditor
              value={content}
              onChange={(v) => setContent(v ?? "")}
              height={420}
              preview="live"
              visibleDragbar={false}
              textareaProps={{ placeholder: "Write your post in Markdown…" }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={publishNow}
              onChange={(e) => setPublishNow(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-sm font-medium">Publish immediately</span>
          </label>
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? (
              <HugeiconsIcon icon={Loading01Icon} className="size-4 animate-spin" />
            ) : (
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4" />
            )}
            {saving ? "Saving…" : postId ? "Update post" : "Create post"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
