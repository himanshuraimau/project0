"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu, X, LayoutDashboard, ArrowRight } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { UserControl } from "../user-control";
import { cn } from "@/lib/utils"; // Assuming you have a standard cn utility

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!mounted) return null;

  const navigation = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6 transition-all duration-300 ease-in-out">
      {/* 
        Main Glass Container 
        - Floats off top
        - Uses backdrop-blur
        - Adjusts width based on container
      */}
      <div
        className={cn(
          "mx-auto flex items-center justify-between px-6 py-3 transition-all duration-300 ease-in-out",
          "bg-white/70 dark:bg-black/60 backdrop-blur-md border border-black/5 dark:border-white/10",
          "shadow-[0_4px_30px_rgba(0,0,0,0.03)]", // Custom soft shadow
          isMenuOpen ? "rounded-2xl" : "rounded-full",
          scrolled ? "max-w-5xl" : "max-w-7xl"
        )}
      >
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logo.png"
            alt="Logo"
            width={24}
            height={24}
            className="object-contain"
          />

          <span className="text-lg font-bold tracking-tight text-foreground/90 group-hover:text-foreground transition-colors">
            JelliNote
            <span className="text-muted-foreground font-normal">AI</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
            >
              {item.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* User Auth State */}
          {!session ? (
            <div className="flex items-center gap-2">
              <Link href="/sign-in" className="hidden sm:block">
                <Button
                  variant="ghost"
                  className="rounded-full text-muted-foreground hover:text-foreground font-medium"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-md transition-transform hover:scale-105">
                  Get Started
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="hidden sm:flex">
                <Button
                  variant="outline"
                  className="rounded-full border-black/10 dark:border-white/10 bg-transparent hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2 text-muted-foreground" />
                  Dashboard
                </Button>
              </Link>
              <div className="pl-2 border-l border-black/10 dark:border-white/10">
                <UserControl showName={false} />
              </div>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full ml-1"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="absolute top-[calc(100%-0.5rem)] left-0 right-0 px-4 md:px-6 animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="mx-auto max-w-5xl rounded-2xl bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-black/5 dark:border-white/10 p-4 shadow-xl">
            <nav className="flex flex-col space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center justify-between p-3 rounded-xl text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                  <ArrowRight className="w-4 h-4 opacity-50" />
                </Link>
              ))}
              <div className="h-px bg-border my-2" />
              {session ? (
                <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full rounded-xl justify-start" size="lg">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>
                    <Button
                      variant="outline"
                      className="w-full rounded-xl border-black/10 dark:border-white/10"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-up" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full rounded-xl">Get Started</Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
