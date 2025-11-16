"use client";

import React, { useState, useEffect, useRef } from "react";
import { useFolders } from "@/hooks/use-folders";
import { FolderCard } from "./folder-card";
import { CreateFolderDialog } from "./create-folder-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Folder as FolderIcon, Loader2, AlertTriangle } from "lucide-react";
import { Inter } from "next/font/google";
import { FolderCardShimmer } from "@/components/ui/shimmer";
import { NotesList, NotesListRef } from "@/components/notes/notes-list";

const inter = Inter({ subsets: ["latin"] });

export function FoldersWithNotesSection() {
  const { folders, loading, error, getFolders } = useFolders();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const notesListRef = useRef<NotesListRef>(null);

  useEffect(() => {
    getFolders();
  }, [getFolders]);

  const handleRefresh = () => {
    getFolders();
    if (notesListRef.current?.refreshNotes) {
      notesListRef.current.refreshNotes();
    }
  };

  if (loading && folders.length === 0) {
    return (
      <div className={`w-full ${inter.className}`}>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="dark:text-white text-black text-[20px] font-medium leading-[24px]">
              My Folders
            </h2>
            <p className="text-[15px] tracking-[-3%] text-[#787878]">
              Organize your notes into folders
            </p>
          </div>
          <Button disabled className="h-[40px] px-6 rounded-[8px]">
            <Plus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FolderCardShimmer />
          <FolderCardShimmer />
          <FolderCardShimmer />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full ${inter.className}`}>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="dark:text-white text-black text-[20px] font-medium leading-[24px]">
              My Folders
            </h2>
            <p className="text-[15px] tracking-[-3%] text-[#787878]">
              Organize your notes into folders
            </p>
          </div>
        </div>
        <div className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              Error loading folders
            </h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${inter.className}`}>
      {/* Folders Section */}
      <div className="mb-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="dark:text-white text-black text-[20px] font-medium leading-[24px]">
              My Folders
            </h2>
            <p className="text-[15px] tracking-[-3%] text-[#787878]">
              Organize your notes into folders
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="h-[40px] px-6 rounded-[8px] bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e3] hover:to-[#7c4ddc] text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
        </div>

        {/* Folders Grid */}
        {folders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onUpdate={handleRefresh}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 neomorphic rounded-2xl">
            <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center mx-auto mb-4">
              <FolderIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg text-foreground mb-2">
              No folders yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first folder to start organizing your notes.
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              variant="outline"
              className="h-[36px] px-6 rounded-[8px]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Folder
            </Button>
          </div>
        )}
      </div>

      {/* Uncategorized Notes Section */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="dark:text-white text-black text-[20px] font-medium leading-[24px]">
            Uncategorized Notes
          </h2>
          <p className="text-[15px] tracking-[-3%] text-[#787878]">
            Notes that haven't been organized into folders yet
          </p>
        </div>
        <NotesList ref={notesListRef} folderId="uncategorized" />
      </div>

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
