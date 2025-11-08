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
        <div className="flex justify-between items-center gap-4 ">
          <h2
            className={`dark:text-white text-black text-[20px] font-medium leading-[24px]`}
          >
            My Notes
          </h2>
          <button
            onClick={() => router.push("/notes")}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 group whitespace-nowrap cursor-pointer"
          >
            View All
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </div>
        <p className={`text-[15px] tracking-[-3%] text-[#787878]`}>
          Manage and organize your notes
        </p>
      </div>

      {/* Notes Display */}
      <div className="w-full rounded-2xl pt-5">
        <NotesList ref={notesListRef} searchQuery={searchQuery} limit={3} />
      </div>
    </div>
  );
}
