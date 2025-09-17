"use client";

import React from "react";
import { Toaster } from "sonner";

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-stone-50 dark:bg-stone-900">
      {children}
      <Toaster />
    </div>
  );
}