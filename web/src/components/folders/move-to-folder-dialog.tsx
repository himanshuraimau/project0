"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFolders } from "@/hooks/use-folders";
import { toast } from "sonner";
import { Loader2, Folder, FolderOpen, Check } from "lucide-react";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin-ext", "vietnamese"],
});

interface MoveToFolderDialogProps {
  noteId: string;
  noteTitle: string;
  currentFolderId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function MoveToFolderDialog({
  noteId,
  noteTitle,
  currentFolderId,
  open,
  onOpenChange,
  onSuccess,
}: MoveToFolderDialogProps) {
  const { folders, getFolders, moveNoteToFolder, loading } = useFolders();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    currentFolderId || null
  );
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    if (open) {
      getFolders();
      setSelectedFolderId(currentFolderId || null);
    }
  }, [open, currentFolderId]);

  const handleMove = async () => {
    try {
      setIsMoving(true);
      await moveNoteToFolder(noteId, selectedFolderId);

      const folderName = selectedFolderId
        ? folders.find((f) => f.id === selectedFolderId)?.name
        : "Uncategorized";

      toast.success(`📁 Note moved to ${folderName}`, {
        description: `"${noteTitle}" has been moved successfully`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to move note"
      );
    } finally {
      setIsMoving(false);
    }
  };

  const hasChanges = selectedFolderId !== currentFolderId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className={`text-left ${jakarta.className}`}>
            Move Note to Folder
          </DialogTitle>
          <DialogDescription className={`${jakarta.className}`}>
            Select a folder to move "{noteTitle}" to
          </DialogDescription>
        </DialogHeader>

        <div className="pt-4">
          {loading && folders.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="h-[300px] overflow-y-auto pr-4">
                <div className="space-y-2">
                  {/* Uncategorized Option */}
                  <button
                    onClick={() => setSelectedFolderId(null)}
                    disabled={isMoving}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-lg transition-all
                      ${
                        selectedFolderId === null
                          ? "bg-primary/10 border-2 border-primary"
                          : "bg-muted/50 hover:bg-muted border-2 border-transparent"
                      }
                    `}
                  >
                    <div
                      className={`
                      shrink-0 h-10 w-10 rounded-lg flex items-center justify-center
                      ${
                        selectedFolderId === null
                          ? "bg-primary/20"
                          : "bg-background"
                      }
                    `}
                    >
                      <FolderOpen
                        className={`h-5 w-5 ${
                          selectedFolderId === null
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">Uncategorized</p>
                      <p className="text-xs text-muted-foreground">
                        Remove from all folders
                      </p>
                    </div>
                    {selectedFolderId === null && (
                      <Check className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </button>

                  {/* Folder Options */}
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => setSelectedFolderId(folder.id)}
                      disabled={isMoving}
                      className={`
                        w-full flex items-center gap-3 p-3 rounded-lg transition-all
                        ${
                          selectedFolderId === folder.id
                            ? "bg-primary/10 border-2 border-primary"
                            : "bg-muted/50 hover:bg-muted border-2 border-transparent"
                        }
                      `}
                    >
                      <div
                        className="shrink-0 h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: folder.color
                            ? `${folder.color}20`
                            : "#6366f120",
                        }}
                      >
                        <Folder
                          className="h-5 w-5"
                          style={{ color: folder.color || "#6366f1" }}
                        />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium text-sm truncate">
                          {folder.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {folder.noteCount}{" "}
                          {folder.noteCount === 1 ? "note" : "notes"}
                        </p>
                      </div>
                      {selectedFolderId === folder.id && (
                        <Check className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {folders.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Folder className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    No folders available. Create a folder first.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      // Navigate to folders page
                      window.location.href = "/dashboard/folders";
                    }}
                  >
                    Go to Folders
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        {folders.length > 0 && (
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isMoving}
              className="flex-1 h-[40px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleMove}
              disabled={isMoving || !hasChanges}
              className="flex-1 h-[40px] bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e3] hover:to-[#7c4ddc] text-white"
            >
              {isMoving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Moving...
                </>
              ) : (
                "Move Note"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
