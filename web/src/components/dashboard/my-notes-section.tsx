"use client";

import React, { useState, useRef, useEffect } from "react";
import { NotesList, NotesListRef } from "@/components/notes/notes-list";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";
import { ChevronRight, Folder } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFolders } from "@/hooks/use-folders";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const inter = Inter({ subsets: ["latin"] });
const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin-ext", "vietnamese"],
});

export function MyNotesSection() {
  const { setRefreshHandler, searchQuery } = useDashboardRefresh();
  const notesListRef = useRef<NotesListRef>(null);
  const router = useRouter();
  const { folders, loading: foldersLoading, getFolders } = useFolders();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Fetch folders on mount
  useEffect(() => {
    getFolders();
  }, [getFolders]);

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
      <div className="mb-5">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div>
            <h2
              className={`dark:text-white text-black text-[20px] font-medium leading-[24px]`}
            >
              My Notes
            </h2>
            <p className={`text-[15px] tracking-[-3%] text-[#787878] mt-1`}>
              Manage and organize your notes
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Folder Filter Dropdown */}
            <Select
              value={selectedFolderId || "all"}
              onValueChange={(value: string) =>
                setSelectedFolderId(value === "all" ? null : value)
              }
            >
              <SelectTrigger className="border hover:bg-transparent dark:hover:bg-transparent cursor-pointer bg-[#F9FAFB] border-neutral-100 dark:border-neutral-800/50 h-10 dark:bg-[#1A1A1A]">
                <Folder className="h-4 w-4 mr-1 text-muted-foreground" />
                <SelectValue placeholder="All Notes" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-neutral-200 dark:border-neutral-800/50 dark:bg-neutral-900">
                <SelectItem value="all">All Notes</SelectItem>
                <SelectItem value="uncategorized">Uncategorized</SelectItem>
                {!foldersLoading &&
                  folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: folder.color || "#6366f1" }}
                        />
                        <span>{folder.name}</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <button
              onClick={() => router.push("/notes")}
              className="flex items-center gap-2 text-sm  text-muted-foreground hover:text-foreground transition-colors duration-200 group whitespace-nowrap cursor-pointer"
            >
              View All
            </button>
          </div>
        </div>
      </div>

      <div className="w-full rounded-2xl pt-5">
        <NotesList
          ref={notesListRef}
          searchQuery={searchQuery}
          folderId={selectedFolderId}
          limit={3}
        />
      </div>
    </div>
  );
}
