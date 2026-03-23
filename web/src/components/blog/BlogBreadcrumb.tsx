"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BlogBreadcrumb({ postTitle }: { postTitle?: string }) {
  const pathname = usePathname();
  const isPostPage =
    pathname !== "/blog" && pathname !== "/blog/" && pathname?.startsWith("/blog/");

  return (
    <nav className="mb-6 text-sm text-muted-foreground" aria-label="Breadcrumb">
      <Link href="/blog" className="hover:text-foreground transition-colors">
        Blog
      </Link>
      {isPostPage && postTitle && (
        <>
          <span className="mx-2">/</span>
          <span className="text-foreground">{postTitle}</span>
        </>
      )}
    </nav>
  );
}
