"use client";

import React from "react";
import { UserControl } from "@/components/user-control";
import { Toaster } from "sonner";
import { ThemeToggleButton } from "@/components/dashboard/theme-toggle-button";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  weight: "600",
});

export default function NotesIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-stone-50 dark:bg-stone-900">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div
          className={`${jakarta.className} py-[22px] border-b border-stone-200 flex bg-white dark:bg-stone-950 items-center dark:border-stone-800 justify-between px-8`}
        >
          <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            Notes
          </h1>
          <span className="flex gap-6 items-center">
            <ThemeToggleButton />
            <UserControl showName />
          </span>
        </div>
        
        {/* Main content - let the page handle its own sidebar */}
        <div className="flex-1 bg-white dark:bg-stone-950">
          {children}
          <Toaster />
        </div>
      </div>
    </div>
  );
}
