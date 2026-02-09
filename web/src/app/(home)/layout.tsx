"use client";

import { Header } from "@/components/landing/header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-screen flex-col bg-background font-(--font-bricolage) antialiased text-foreground">
      <Header />
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
