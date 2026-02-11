"use client";

import React, { useState, useRef, useEffect } from "react";
import { NotesList, NotesListRef } from "@/components/notes/notes-list";
import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";
import { HugeiconsIcon } from "@hugeicons/react";
import { FolderAddIcon, Note01Icon } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { useFolders } from "@/hooks/use-folders";
import { CreateFolderDialog } from "@/components/folders/create-folder-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function MyNotesSection() {
  const { setRefreshHandler, searchQuery } = useDashboardRefresh();
  const notesListRef = useRef<NotesListRef>(null);
  const router = useRouter();
  const { folders, loading: foldersLoading, getFolders } = useFolders();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"my-notes" | "shared">("my-notes");
  const [showCreateFolder, setShowCreateFolder] = useState(false);

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
    <div className="w-full">
      {/* Tabs Section with New Folder Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center rounded-md border-sidebar-border bg-card p-1 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("my-notes")}
            className={`relative px-4 py-2 text-sm font-medium rounded-[6px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              activeTab === "my-notes"
                ? "bg-white dark:bg-[#27282b] text-foreground shadow-sm"
                : "text-muted-foreground  hover:text-foreground"
            }`}
          >
            My Notes
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("shared");
              router.push("/dashboard/cloned");
            }}
            className={`px-4 py-2 cursor-pointer text-sm font-medium rounded-[6px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              activeTab === "shared"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Shared with Me
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/notes")}
            className="flex items-center gap-2 h-10 px-3 justify-center bg-card border border-border cursor-pointer rounded-md hover:bg-muted/50 transition-colors text-sm font-medium text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background w-fit"
          >
            <HugeiconsIcon
              icon={Note01Icon}
              className="size-4 shrink-0 text-muted-foreground"
            />
            <span>All Notes</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCreateFolder(true)}
            className="flex items-center gap-2 h-10 px-3 justify-center bg-card border-none cursor-pointer rounded-md hover:bg-muted/50 transition-colors text-sm font-medium text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background w-fit"
          >
            <HugeiconsIcon
              icon={FolderAddIcon}
              className="size-4 shrink-0 text-muted-foreground"
            />
            <span>New Folder</span>
          </button>
        </div>
      </div>

      {/* Recent Notes Header */}
      {/* <div className="flex flex-row items-center gap-2 mb-5">
        <h3 className="text-lg font-medium text-foreground tracking-tight shrink-0">
          Recent Notes
        </h3>
        <div className="flex-1 h-px bg-border/50 min-w-0" aria-hidden />
        <button
          type="button"
          onClick={() => router.push("/notes")}
          className="flex items-center gap-1.5 rounded-md py-2 px-2.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background shrink-0"
        >
          <span>View All</span>
          <HugeiconsIcon icon={ArrowRight01Icon} className="size-4 shrink-0" />
        </button>
      </div> */}

      <div className="w-full rounded-lg pt-0">
        <NotesList
          ref={notesListRef}
          searchQuery={searchQuery}
          folderId={selectedFolderId}
          limit={3}
        />
      </div>

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        open={showCreateFolder}
        onOpenChange={setShowCreateFolder}
        onSuccess={() => {
          getFolders();
          setShowCreateFolder(false);
        }}
      />
    </div>
  );
}
