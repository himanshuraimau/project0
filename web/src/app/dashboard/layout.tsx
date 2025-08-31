"use client";

import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Toaster } from "sonner";

function DashboardContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 h-screen bg-stone-50 dark:bg-stone-950">
      <div className="p-8">
        <div className="flex  items-center border-b border-stone-200 dark:border-stone-800  justify-between mb-8">
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
            Dashboard
          </h1>
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900">
            <span className="text-sm font-medium">Unlimited Notes</span>
            <span className="text-lg">⚡</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-stone-50 dark:bg-stone-950">
      <SidebarProvider defaultOpen={true}>
        <div className="flex h-screen">
          <Sidebar />
          <DashboardContent>
            {children}
            <Toaster />
          </DashboardContent>
        </div>
      </SidebarProvider>
    </div>
  );
}
