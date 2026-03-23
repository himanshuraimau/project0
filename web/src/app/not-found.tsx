import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-6xl font-bold text-foreground">404</h1>
      <p className="mt-4 text-xl text-muted-foreground">
        This page doesn&apos;t exist.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go home
        </Link>
        <Link
          href="/support"
          className="rounded-lg border border-border px-6 py-3 font-medium text-foreground transition-colors hover:bg-muted"
        >
          Get help
        </Link>
      </div>
      <nav className="mt-12 flex gap-6 text-sm text-muted-foreground">
        <Link href="/blog" className="hover:text-foreground transition-colors">
          Blog
        </Link>
        <Link
          href="/pricing"
          className="hover:text-foreground transition-colors"
        >
          Pricing
        </Link>
        <Link
          href="/support"
          className="hover:text-foreground transition-colors"
        >
          Support
        </Link>
      </nav>
    </div>
  );
}
