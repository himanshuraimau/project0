"use client";

import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Toaster } from "sonner";
import { ThemeToggleButton } from "@/components/dashboard/theme-toggle-button";
import { Plus_Jakarta_Sans } from "next/font/google";
const jakarta = Plus_Jakarta_Sans({
  weight: "600",
});
function DashboardContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 h-full bg-white border-b border-stone-200 dark:bg-stone-950 overflow-y-scroll">
      <div className="">
        <div
          className={`${jakarta.className} h-[100px] border-b border-stone-200 flex bg-white dark:bg-stone-950 items-center  dark:border-stone-800  justify-between px-8`}
        >
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
            Dashboard
          </h1>
          <span className="flex gap-6 items-center">
            <ThemeToggleButton />
            <div
              className="px-6 py-2 rounded-full bg-gradient-to-b from-stone-800/90 via-stone-800 to-black text-white flex items-center gap-2  shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]
  transition-all duration-300"
            >
              <span className="text-[16px] font-medium">Unlimited Notes⚡</span>
            </div>
          </span>
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
