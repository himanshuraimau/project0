"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Blog, BlogCategory } from "@/app/blog/data";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SortOption = "date-desc" | "date-asc" | "a-z" | "z-a";

const categoryStyles: Record<BlogCategory, string> = {
  Insights: "bg-primary/15 text-primary border-primary/30",
  "Interview Questions":
    "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
};

interface BlogListingProps {
  allBlogs: Blog[];
}

export function BlogListing({ allBlogs }: BlogListingProps) {
  const [sort, setSort] = useState<SortOption>("date-desc");

  const sorted = useMemo(() => {
    if (sort === "date-desc") return [...allBlogs];
    if (sort === "date-asc") return [...allBlogs].reverse();
    if (sort === "a-z") return [...allBlogs].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "z-a") return [...allBlogs].sort((a, b) => b.title.localeCompare(a.title));
    return [...allBlogs];
  }, [allBlogs, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="a-z">Title A–Z</option>
          <option value="z-a">Title Z–A</option>
        </select>
      </div>

      {sorted.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No posts yet.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {sorted.map((blog) => (
            <Link
              key={blog.slug}
              href={`/blog/${blog.slug}/`}
              className="group"
            >
              <Card className="h-full overflow-hidden border-border transition-shadow group-hover:shadow-md">
                <div className="aspect-video relative w-full overflow-hidden bg-muted">
                  <Image
                    src={blog.image.src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
                <CardHeader className="pb-2">
                  <span
                    className={`mb-2 inline-block w-fit rounded-full border px-2 py-0.5 text-xs font-medium ${categoryStyles[blog.category] ?? "bg-muted text-muted-foreground"}`}
                  >
                    {blog.category}
                  </span>
                  <CardTitle className="line-clamp-2 text-lg font-semibold text-foreground group-hover:text-primary">
                    {blog.title}
                  </CardTitle>
                </CardHeader>
                <CardFooter className="text-xs text-muted-foreground">
                  {blog.publishedOn}
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

