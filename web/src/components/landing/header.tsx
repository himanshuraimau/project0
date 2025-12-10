"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu, X, LayoutDashboard, ArrowRight } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { UserControl } from "../user-control";
import { cn } from "@/lib/utils";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const pathname = usePathname();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const navigation = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" }, // Added Pricing for realism
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out border-b",
        isScrolled
          ? "bg-background/70 backdrop-blur-md border-border/40 py-3"
          : "bg-transparent border-transparent py-5"
      )}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-6 h-6 object-contain"
              />
            </div>
            <span className="text-lg font-bold tracking-tight">JelliNote</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
              >
                {item.name}
                {/* Subtle underline animation */}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle - Minimalist */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full w-9 h-9 text-muted-foreground hover:text-foreground"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>

            <div className="hidden md:flex items-center gap-3">
              {!session ? (
                <>
                  <Link href="/sign-in">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-sm font-medium rounded-full"
                    >
                      Log in
                    </Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button
                      size="sm"
                      className="rounded-full px-5 font-medium shadow-sm"
                    >
                      Get Started
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/dashboard">
                    <Button
                      size="sm"
                      className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 shadow-none rounded-full px-4 font-medium"
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <UserControl showName={false} />
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full"
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
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-background/95 backdrop-blur-xl border-b border-border/40 shadow-2xl p-6 md:hidden animate-in slide-in-from-top-2 fade-in duration-200">
          <nav className="flex flex-col gap-4">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-lg font-medium text-foreground/80 hover:text-primary transition-colors py-2 border-b border-border/30"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </a>
            ))}

            <div className="flex flex-col gap-3 mt-4">
              {!session ? (
                <>
                  <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>
                    <Button
                      variant="outline"
                      className="w-full rounded-full justify-center"
                    >
                      Log in
                    </Button>
                  </Link>
                  <Link href="/sign-up" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full rounded-full justify-center">
                      Get Started <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full rounded-full justify-center">
                    Go to Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
