"use client";

import React from "react";
import { Toaster } from "sonner";

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="">
      {children}
      <Toaster />
    </div>
  );
}
