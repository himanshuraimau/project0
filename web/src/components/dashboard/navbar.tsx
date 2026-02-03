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
        "w-full flex h-16 items-center justify-between bg-background px-6",
        className
      )}
    >
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-foreground">Flinote</h1>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggleButton />
        <UserControl showName />
      </div>
    </header>
  );
}
