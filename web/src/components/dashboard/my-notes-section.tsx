"use client";

import React, { useState, useRef, useEffect } from "react";
import { NotesList, NotesListRef } from "@/components/notes/notes-list";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";
import { ChevronRight, Folder, FolderPlus } from "lucide-react";
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
    <div className={`w-full ${inter.className}`}>
      {/* Tabs Section with New Folder Button */}
      <div className="flex flex-row justify-between items-center mb-6">
        {/* Tabs Container */}
        <div className="flex items-center border-b-[0.8px] border-[#E5E7EB]">
          {/* My Notes Tab */}
          <button
            onClick={() => setActiveTab("my-notes")}
            className={`
              relative px-3 py-2 text-[16px] leading-5 font-normal
              ${
                activeTab === "my-notes"
                  ? "text-[#0A0A0A] border-[0.8px] border-t-[0.8px] border-l-[0.8px] border-r-[0.8px] border-b-[1.6px] border-[#101828]"
                  : "text-[#0A0A0A] border-transparent"
              }
            `}
            style={{ fontFamily: "Arimo" }}
          >
            My Notes
          </button>

          {/* Shared with Me Tab */}
          <button
            onClick={() => {
              setActiveTab("shared");
              router.push("/dashboard/cloned");
            }}
            className="px-3 py-2 text-[16px] leading-5 font-normal text-[#0A0A0A]"
            style={{ fontFamily: "Arimo" }}
          >
            Shared with Me
          </button>
        </div>

        {/* New Folder Button */}
        <button
          onClick={() => setShowCreateFolder(true)}
          className="flex items-center gap-2 h-9 px-3 bg-white border-[0.8px] border-[#E5E7EB] rounded-[10px] hover:bg-gray-50 transition-colors"
        >
          <FolderPlus className="w-4 h-4 text-[#4A5565]" />
          <span className="text-[14px] leading-5 font-normal text-[#4A5565]" style={{ fontFamily: "Arimo" }}>
            New Folder
          </span>
        </button>
      </div>

      {/* Recent Notes Header */}
      <div className="flex flex-row items-center gap-3 mb-5">
        {/* Heading */}
        <h3 className="text-[16px] leading-6 font-normal text-[#101828]" style={{ fontFamily: "Arimo" }}>
          Recent Notes
        </h3>

        {/* Gradient Line */}
        <div 
          className="flex-1 h-[1px]" 
          style={{ background: "linear-gradient(90deg, #E5E7EB 0%, rgba(0, 0, 0, 0) 100%)" }}
        />

        {/* View All Button */}
        <button
          onClick={() => router.push("/notes")}
          className="flex items-center gap-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors px-2.5 py-1.5"
        >
          <span className="text-[14px] leading-5 font-normal text-[#155DFC]" style={{ fontFamily: "Arimo" }}>
            View All
          </span>
          <ChevronRight className="w-4 h-4 text-[#155DFC]" />
        </button>
      </div>

      <div className="w-full rounded-2xl pt-5">
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
