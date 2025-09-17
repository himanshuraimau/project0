"use client";

import React from "react";
import { UserControl } from "@/components/user-control";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { NotesAppSidebar } from "@/components/notes/notes-sidebar";
import { Toaster } from "sonner";
import { ThemeToggleButton } from "@/components/dashboard/theme-toggle-button";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  weight: "600",
});

function NotesContent({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  return (
    <div 
      className={`
        flex-1 h-full bg-white border-b border-stone-200 dark:bg-stone-950 overflow-y-scroll 
        transition-all duration-300 ease-in-out
      `}
    >
      <div className="">
        <div
          className={`${jakarta.className} py-[22px] border-b border-stone-200 flex bg-white dark:bg-stone-950 items-center  dark:border-stone-800  justify-between px-8 transition-all duration-300`}
        >
          <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            Notes
          </h1>
          <span className="flex gap-6 items-center">
            <ThemeToggleButton />
            <UserControl showName />
          </span>
        </div>
        <div className="transition-all duration-300">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-stone-50 dark:bg-stone-900">
      <SidebarProvider defaultOpen={true}>
        <div className="flex flex-1 h-full">
          <NotesAppSidebar />
          <NotesContent>
            {children}
            <Toaster />
          </NotesContent>
        </div>
      </SidebarProvider>
    </div>
  );
}