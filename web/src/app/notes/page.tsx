"use client";

import React, { useState, useRef } from "react";
import { NotesList, NotesListRef } from "@/components/notes/notes-list";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { useRouter } from "next/navigation";
import { DashboardRefreshProvider } from "@/contexts/dashboard-refresh-context";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/AppSidebar";

const inter = Inter({ subsets: ["latin"] });
const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin-ext", "vietnamese"],
});

function NotesPageContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const notesListRef = useRef<NotesListRef>(null);

  return (
    <SidebarInset className="flex flex-col flex-1 min-h-0">
      {/* Content - h-screen so section is viewport height, inner area scrolls */}
      <main className="h-screen flex flex-col bg-background px-4 pt-10 overflow-hidden">
        <div className="flex-1 min-h-0 max-w-none w-full px-6 py-8 flex flex-col overflow-hidden">
          {/* Notes Display - scrollable */}
          <div className="w-full flex-1 min-h-0 overflow-y-auto">
            <NotesList ref={notesListRef} searchQuery={searchQuery} />
          </div>
        </div>
      </main>
    </SidebarInset>
  );
}

export default function NotesPage() {
  return (
    <DashboardRefreshProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full bg-background">
          {/* Full-height Sidebar on the left */}
          <AppSidebar />

          {/* Main content area */}
          <NotesPageContent />
        </div>
      </SidebarProvider>
    </DashboardRefreshProvider>
  );
}
