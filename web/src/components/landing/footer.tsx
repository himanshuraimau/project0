"use client";

import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background py-12 md:py-16">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <p className="text-xl font-semibold tracking-tight text-foreground">
          Flinote
        </p>
        <nav className="mt-4 flex items-center justify-center gap-6 text-sm">
          <Link
            href="/blog/"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Blog
          </Link>
          <Link
            href="/support"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Support
          </Link>
          <Link
            href="/terms"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Privacy Policy
          </Link>
        </nav>
        <p className="mt-6 text-xs text-muted-foreground">
          ©{year} Flinote
        </p>
      </div>
    </footer>
  );
}
