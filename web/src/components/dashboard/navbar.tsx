"use client";

import React from "react";
import { ThemeToggleButton } from "@/components/dashboard/theme-toggle-button";
import { UserControl } from "@/components/user-control";
import { cn } from "@/lib/utils";


interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between border-b border-border dark:border-slate-800 bg-background px-6",
        className
      )}
    >
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-foreground">Project0</h1>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggleButton />
        <UserControl showName />
      </div>
    </header>
  );
}
