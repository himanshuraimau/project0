"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Search,
} from "lucide-react";
import { NotesList, NotesListRef } from "@/components/notes/notes-list";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";

const inter = Inter({ subsets: ["latin"] });
const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin-ext", "vietnamese"],
});

export function MyNotesSection() {
  const { setRefreshHandler } = useDashboardRefresh();
  const notesListRef = useRef<NotesListRef>(null);
  
  const [searchQuery, setSearchQuery] = useState("");

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
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className={`text-2xl leading-8 font-semibold text-foreground mb-3 ${jakarta.className}`}>
            My Notes
          </h2>
          <p className={`text-muted-foreground text-base font-medium leading-6 ${jakarta.className}`}>
            Manage and organize your notes
          </p>
        </div>

        {/* Search Control */}
        <div className="relative min-w-xl sm:mt-1">
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="neomorphic pl-4 pr-12 h-12 border-0 rounded-2xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all duration-300"
          />
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Notes Display */}
      <div className="w-full rounded-2xl pt-5">
        <NotesList 
          ref={notesListRef}
          searchQuery={searchQuery} 
        />
      </div>
    </div>
  );
}
