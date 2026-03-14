"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { UserControl } from "../user-control";

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto grid max-w-7xl grid-cols-3 items-center gap-4 px-4 py-4 md:px-6">
        <Link
          href="/"
          className="flex w-fit items-center gap-2.5 font-medium text-lg text-foreground transition-opacity hover:opacity-90"
        >
          <Image
            src="/logo.png"
            alt="Flinote"
            width={28}
            height={28}
            className="object-contain rounded-[6px]"
          />
          <div className="flex gap-1 items-end">
            <span className="text-2xl">Flinote</span>
          </div>
        </Link>

        <div className="hidden sm:flex justify-self-center items-center gap-6">
          <Link
            href="/#features"
            className="text-muted-foreground hover:text-foreground transition-colors text-[15px] font-medium"
          >
            Features
          </Link>
          <Link
            href="/blog/"
            className="text-muted-foreground hover:text-foreground transition-colors text-[15px] font-medium"
          >
            Blog
          </Link>
        </div>

        <div className="flex items-center justify-end gap-2">
          {session ? (
            <>
              <Link href="/dashboard" className="hidden sm:block">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-border bg-transparent"
                >
                  Dashboard
                </Button>
              </Link>
              <div className="border-l border-border pl-2">
                <UserControl showName={false} />
              </div>
            </>
          ) : (
            <Link href="/sign-up" className="hidden sm:block">
              <button className="rounded-lg px-6 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm py-2.5 font-medium text-[15px]">
                Try for free
              </button>
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="flex flex-col gap-1 px-4 py-4">
            <Link
              href="/#features"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-lg px-4 py-3 text-foreground font-medium hover:bg-muted transition-colors"
            >
              Features
            </Link>
            <Link
              href="/blog/"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-lg px-4 py-3 text-foreground font-medium hover:bg-muted transition-colors"
            >
              Blog
            </Link>
            {session ? (
              <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full justify-start rounded-lg" size="lg">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/sign-up" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                  Try for free
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
