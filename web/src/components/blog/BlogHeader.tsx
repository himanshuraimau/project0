"use client";

import { useState } from "react";
import type { BlogCategory } from "@/app/blog/data";

interface BlogHeaderProps {
  title: string;
  description: string;
  category: BlogCategory;
  publishedOn: string;
  image?: { src: string; width: number; height: number } | null;
}

const categoryStyles: Record<BlogCategory, string> = {
  Insights: "bg-primary/15 text-primary border-primary/30",
  "Interview Questions": "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
};

export function BlogHeader({
  title,
  description,
  category,
  publishedOn,
}: BlogHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(
        typeof window !== "undefined" ? window.location.href : ""
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <header className="mb-8">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${categoryStyles[category] ?? "bg-muted text-muted-foreground border-border"}`}
        >
          {category}
        </span>
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-2">
        {title}
      </h1>
      <p className="text-muted-foreground text-lg mb-6">{description}</p>
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-muted-foreground text-sm">{publishedOn}</span>
        <button
          type="button"
          onClick={handleShare}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? "Copied!" : "Share"}
        </button>
      </div>
    </header>
  );
}
