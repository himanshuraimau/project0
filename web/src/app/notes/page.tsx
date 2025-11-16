"use client";

import React, { useState, useRef } from "react";
import { NotesList, NotesListRef } from "@/components/notes/notes-list";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { ChevronLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
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
    <SidebarInset className="flex flex-col flex-1">
      <header className="bg-white dark:bg-background pt-10 pl-4">
        <div className="flex h-20 items-center justify-between px-6 mr-4 mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-muted rounded-lg transition-colors duration-200 cursor-pointer"
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <div>
              <h1 className={`text-3xl font-bold text-foreground `}>
                All Notes
              </h1>
              <p className={`text-gray-500 text-base font-medium leading-6 `}>
                Browse and manage all your notes
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-md">
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 pr-12 h-12 border-1 border-black/10 dark:border-muted/30 rounded-2xl text-foreground placeholder:text-muted-foreground"
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 bg-background px-4">
        <div className="max-w-none w-full px-6 py-8">
          {/* Notes Display */}
          <div className="w-full">
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
