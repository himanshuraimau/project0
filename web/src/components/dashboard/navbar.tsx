"use client";

import React from "react";
import { UserControl } from "@/components/user-control";
import { cn } from "@/lib/utils";


interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between border-b border-border bg-background px-6",
        className
      )}
    >
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-foreground">Project0</h1>
      </div>

      <div className="flex items-center gap-4">
        <UserControl showName />
      </div>
    </header>
  );
}
