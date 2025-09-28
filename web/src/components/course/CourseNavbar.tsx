"use client";

import React from "react";
import Link from "next/link";
import { UserControl } from "@/components/user-control";
import { ThemeToggleButton } from "@/components/dashboard/theme-toggle-button";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ArrowLeft } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "600"],
  subsets: ["latin-ext", "vietnamese"],
});

export function CourseNavbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - Sidebar trigger, Back button, and Logo */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="mr-2" />
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
          <div className="h-6 w-px bg-border" />
          <Link href="/dashboard" className="flex items-center gap-2">
            <span
              className={`text-xl font-semibold text-foreground ${jakarta.className}`}
            >
              SonicLearn
            </span>
          </Link>
        </div>

        {/* Right side - Theme toggle and Profile */}
        <div className="flex items-center gap-4">
          <ThemeToggleButton />
          <UserControl showName />
        </div>
      </div>
    </nav>
  );
}