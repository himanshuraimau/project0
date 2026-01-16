"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFolders } from "@/hooks/use-folders";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin-ext", "vietnamese"],
});

interface DeleteFolderDialogProps {
  folder: {
    id: string;
    name: string;
    noteCount: number;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteFolderDialog({
  folder,
  open,
  onOpenChange,
  onSuccess,
}: DeleteFolderDialogProps) {
  const { deleteFolder, loading } = useFolders();

  const handleDelete = async () => {
    try {
      await deleteFolder(folder.id);
      toast.success("🗑️ Folder deleted successfully", {
        description: "Your notes have been moved to uncategorized",
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete folder"
      );
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className="shrink-0 h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className={`text-left ${jakarta.className}`}>
                Delete Folder?
              </AlertDialogTitle>
              <AlertDialogDescription className={`${jakarta.className} mt-2`}>
                Are you sure you want to delete <strong>"{folder.name}"</strong>
                ?
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="py-4 px-4 bg-muted/50 rounded-lg space-y-2">
          <p className="text-sm font-medium">What will happen:</p>
          <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>The folder will be permanently deleted</li>
            <li>
              {folder.noteCount === 0
                ? "No notes will be affected"
                : `${folder.noteCount} note${
                    folder.noteCount > 1 ? "s" : ""
                  } will be moved to uncategorized`}
            </li>
            <li>Your notes will NOT be deleted</li>
            <li>This action cannot be undone</li>
          </ul>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} className="h-[40px]">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="h-[40px] bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Folder"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
