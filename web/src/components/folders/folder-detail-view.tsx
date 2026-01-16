"use client";

import React, { useState, useEffect, useRef } from "react";
import { useFolders } from "@/hooks/use-folders";
import { Button } from "@/components/ui/button";
import { ChevronRight, Edit, Trash2, Loader2, AlertTriangle, Folder } from "lucide-react";
import { Inter } from "next/font/google";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NotesList, NotesListRef } from "@/components/notes/notes-list";
import { EditFolderDialog } from "./edit-folder-dialog";
import { DeleteFolderDialog } from "./delete-folder-dialog";

const inter = Inter({ subsets: ["latin"] });

interface FolderDetailViewProps {
  folderId: string;
}

export function FolderDetailView({ folderId }: FolderDetailViewProps) {
  const { getFolder, loading, error } = useFolders();
  const [folder, setFolder] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();
  const notesListRef = useRef<NotesListRef>(null);

  useEffect(() => {
    loadFolder();
  }, [folderId]);

  const loadFolder = async () => {
    const folderData = await getFolder(folderId, true);
    if (folderData) {
      setFolder(folderData);
    }
  };

  const handleDeleteSuccess = () => {
    router.push("/dashboard/folders");
  };

  if (loading && !folder) {
    return (
      <div className={`w-full ${inter.className}`}>
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">
              Loading folder...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !folder) {
    return (
      <div className={`w-full ${inter.className}`}>
        <div className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              Error loading folder
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error || "Folder not found"}
            </p>
            <Button
              onClick={() => router.push("/dashboard/folders")}
              variant="outline"
              size="sm"
            >
              Back to Folders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${inter.className}`}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link
          href="/dashboard/folders"
          className="hover:text-foreground transition-colors"
        >
          Folders
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{folder.name}</span>
      </div>

      {/* Folder Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          {/* Folder Icon */}
          <div
            className="neomorphic shrink-0 p-4 rounded-xl"
            style={{
              backgroundColor: folder.color
                ? `${folder.color}15`
                : "#6366f115",
            }}
          >
            <Folder
              className="h-8 w-8"
              style={{ color: folder.color || "#6366f1" }}
            />
          </div>

          {/* Folder Info */}
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {folder.name}
            </h1>
            {folder.description && (
              <p className="text-muted-foreground mb-2">{folder.description}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {folder.noteCount} {folder.noteCount === 1 ? "note" : "notes"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEditDialog(true)}
            className="h-[36px]"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="h-[36px] text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Notes in Folder */}
      <div className="mb-8">
        <h2 className="dark:text-white text-black text-[20px] font-medium leading-[24px] mb-6">
          Notes in this folder
        </h2>
        <NotesList ref={notesListRef} folderId={folderId} />
      </div>

      {/* Edit Dialog */}
      <EditFolderDialog
        folder={folder}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={loadFolder}
      />

      {/* Delete Dialog */}
      <DeleteFolderDialog
        folder={folder}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
