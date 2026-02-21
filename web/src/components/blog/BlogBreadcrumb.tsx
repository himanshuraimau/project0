"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { blogs } from "@/app/blog/data";

export function BlogBreadcrumb() {
  const pathname = usePathname();
  const segment = pathname?.replace(/^\/blog\/?/, "").replace(/\/$/, "");
  const post = segment ? blogs.find((b) => b.slug === segment) : null;

  return (
    <nav className="mb-6 text-sm text-muted-foreground" aria-label="Breadcrumb">
      <Link href="/blog/" className="hover:text-foreground transition-colors">
        Blog
      </Link>
      {post && (
        <>
          <span className="mx-2">/</span>
          <span className="text-foreground">{post.title}</span>
        </>
      )}
    </nav>
  );
}
