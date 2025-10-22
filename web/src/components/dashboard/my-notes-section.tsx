"use client";

import React, { useState, useRef, useEffect } from "react";
import { NotesList, NotesListRef } from "@/components/notes/notes-list";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });
const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin-ext", "vietnamese"],
});

export function MyNotesSection() {
  const { setRefreshHandler, searchQuery } = useDashboardRefresh();
  const notesListRef = useRef<NotesListRef>(null);
  const router = useRouter();

  // Register refresh handler when component mounts
  useEffect(() => {
    const refreshHandler = async () => {
      if (notesListRef.current?.refreshNotes) {
        await notesListRef.current.refreshNotes();
      }
    };
    setRefreshHandler(refreshHandler);
  }, [setRefreshHandler]);

  return (
<div className={`w-full ${inter.className}`}>
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-1">
          <h2 className={`text-2xl leading-8 font-semibold text-foreground whitespace-nowrap ${jakarta.className}`}>
            My Notes
          </h2>
          <hr className="flex-1 opacity-50" />
          <button
            onClick={() => router.push('/notes')}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 group whitespace-nowrap cursor-pointer"
          >
            View All
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </div>
        <p className={`text-gray-500 text-base font-medium leading-6 ${jakarta.className}`}>
          Manage and organize your notes
        </p>
      </div>

      {/* Notes Display */}
      <div className="w-full rounded-2xl pt-5">
        <NotesList 
          ref={notesListRef}
          searchQuery={searchQuery}
          limit={3}
        />
      </div>
    </div>
  );
}