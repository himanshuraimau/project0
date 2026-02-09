"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu, X, LayoutDashboard, ArrowRight } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { UserControl } from "../user-control";

const navigation = [
  { name: "Features", href: "#features" },
  { name: "How It Works", href: "#how-it-works" },
  { name: "Pricing", href: "#pricing" },
];

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="container flex mx-auto py-4 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold text-foreground transition-opacity hover:opacity-90"
        >
          <Image
            src="/logo.png"
            alt="Flinote"
            width={28}
            height={28}
            className="object-contain rounded-sm"
          />
          <span>Flinote</span>
          <span className="font-normal text-muted-foreground">AI</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-[14.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9 rounded-md cursor-pointer text-muted-foreground hover:text-foreground hover:bg-accent"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {!session ? (
            <div className="flex items-center gap-2">
              <Link href="/sign-in" className="hidden sm:block">
                <Button
                  variant="ghost"
                  className="rounded-md cursor-pointer font-medium text-[15px] text-muted-foreground hover:text-foreground"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="rounded-md cursor-pointer py-2.5 font-medium text-[15px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                  Get Started
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="hidden sm:block">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-border bg-transparent"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <div className="border-l border-border pl-2">
                <UserControl showName={false} />
              </div>
            </div>
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
          <nav className="container flex max-w-6xl flex-col gap-1 px-4 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
            <div className="my-2 h-px bg-border" />
            {session ? (
              <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full justify-start rounded-lg" size="lg">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full rounded-lg">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
