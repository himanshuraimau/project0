"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useFolders } from "@/hooks/use-folders";
import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";
import { FolderCard } from "./folder-card";
import { CreateFolderDialog } from "./create-folder-dialog";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FolderAddIcon,
  Folder01Icon,
  AlertDiamondIcon,
} from "@hugeicons/core-free-icons";
import { FolderCardShimmer } from "@/components/ui/shimmer";
import { NotesList, NotesListRef } from "@/components/notes/notes-list";

export function FoldersWithNotesSection() {
  const { folders, loading, error, getFolders } = useFolders();
  const { folderSearchQuery } = useDashboardRefresh();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const notesListRef = useRef<NotesListRef>(null);

  useEffect(() => {
    getFolders();
  }, [getFolders]);

  const handleRefresh = () => {
    getFolders();
    notesListRef.current?.refreshNotes?.();
  };

  const filteredFolders = useMemo(() => {
    if (!folderSearchQuery.trim()) return folders;
    const q = folderSearchQuery.toLowerCase().trim();
    return folders.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.description?.toLowerCase().includes(q) ?? false)
    );
  }, [folders, folderSearchQuery]);

  if (loading && folders.length === 0) {
    return (
      <div className="w-full space-y-10">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
              My Folders
            </h1>
            <p className=" text-muted-foreground mt-0.5">
              Organize your notes into folders
            </p>
          </div>
          <Button disabled size="sm" className="h-10 px-5 rounded-xl shrink-0">
            <HugeiconsIcon icon={FolderAddIcon} className="size-4 mr-2" />
            New Folder
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <FolderCardShimmer />
          <FolderCardShimmer />
          <FolderCardShimmer />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full space-y-8">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            My Folders
          </h1>
          <p className=" text-muted-foreground mt-0.5">
            Organize your notes into folders
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-border bg-card/50">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-5">
            <HugeiconsIcon icon={AlertDiamondIcon} className="size-7" />
          </div>
          <h3 className="font-semibold text-lg text-foreground mb-2">
            Error loading folders
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
            {error}
          </p>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="cursor-pointer"
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-12">
      {/* My Folders block */}
      <section>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground tracking-tight">
              My Folders
            </h2>
            <p className="text-muted-foreground mt-0.5">
              Organize your notes into folders
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            size="lg"
            className="h-10 px-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 cursor-pointer shrink-0"
          >
            <HugeiconsIcon icon={FolderAddIcon} className="size-4 mr-2" />
            New Folder
          </Button>
        </div>

        {filteredFolders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredFolders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onUpdate={handleRefresh}
              />
            ))}
          </div>
        ) : folders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-border bg-card/50">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5">
              <HugeiconsIcon icon={Folder01Icon} className="size-8" />
            </div>
            <h3 className="font-semibold text-xl text-foreground mb-2">
              No folders yet
            </h3>
            <p className=" text-muted-foreground text-center max-w-sm mb-6">
              Create your first folder to start organizing your notes.
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              variant="outline"
              size="sm"
              className="rounded-xl cursor-pointer"
            >
              <HugeiconsIcon icon={FolderAddIcon} className="size-4 mr-2" />
              Create folder
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 rounded-2xl border border-border bg-card/30">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-4">
              <HugeiconsIcon icon={Folder01Icon} className="size-6" />
            </div>
            <h3 className="font-medium text-foreground mb-1">
              No folders match your search
            </h3>
            <p className="text-sm text-muted-foreground">
              Try a different name or create a new folder.
            </p>
          </div>
        )}
      </section>

      {/* Uncategorized Notes */}
      <section>
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-foreground tracking-tight">
            Uncategorized notes
          </h2>
          <p className=" text-muted-foreground mt-0.5">
            Notes not in any folder yet
          </p>
        </div>
        <NotesList ref={notesListRef} folderId="uncategorized" />
      </section>

      <CreateFolderDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
