"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNotes } from "@/hooks/use-notes";
import { useFolders } from "@/hooks/use-folders";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Folder01Icon,
  FileDownloadIcon,
  Delete01Icon,
  Loading01Icon,
} from "@hugeicons/core-free-icons";
import { MoveToFolderDialog } from "@/components/folders/move-to-folder-dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { NotesNoteWithTranscript } from "@/lib/types";

interface NoteSettingsModalProps {
  note: NotesNoteWithTranscript;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function NoteSettingsModal({
  note,
  open,
  onOpenChange,
  onSuccess,
}: NoteSettingsModalProps) {
  const router = useRouter();
  const { updateNote, deleteNote } = useNotes();
  const { folders, getFolders } = useFolders();
  const [title, setTitle] = useState(note.title);
  const [savingTitle, setSavingTitle] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(note.title);
      getFolders();
    }
  }, [open, note.title, note.id, getFolders]);

  const handleSaveTitle = async () => {
    const trimmed = title.trim();
    if (trimmed === note.title || !trimmed) return;
    setSavingTitle(true);
    try {
      const updated = await updateNote(note.id, { title: trimmed });
      if (updated) {
        toast.success("Title updated");
        onSuccess?.();
      } else {
        throw new Error("Update failed");
      }
    } catch {
      toast.error("Failed to update title");
    } finally {
      setSavingTitle(false);
    }
  };

  const handleExportPdf = () => {
    onOpenChange(false);
    router.push(`/notes/${note.id}`);
  };

  const handleDeleteClick = () => setShowDeleteConfirm(true);
  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await deleteNote(note.id);
      toast.success("Note deleted");
      onOpenChange(false);
      setShowDeleteConfirm(false);
      onSuccess?.();
    } catch {
      toast.error("Failed to delete note");
    } finally {
      setDeleting(false);
    }
  };

  const currentFolderName =
    note.folderId != null
      ? folders.find((f) => f.id === note.folderId)?.name ?? "Select folder"
      : "Uncategorized";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md rounded-2xl border border-border bg-card p-0 gap-0 overflow-hidden shadow-xl">
          <DialogHeader className="p-6 pb-4 border-b border-border/10">
            <DialogTitle className="text-xl font-semibold text-foreground pr-10">
              Note settings
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-5">
            {/* Note Title */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Note Title
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveTitle}
                disabled={savingTitle}
                className="rounded-xl border-border bg-muted/30 dark:bg-muted/20 text-foreground h-11"
                placeholder="Note title"
              />
            </div>

            {/* Add note to folder */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Add note to folder
              </Label>
              <button
                type="button"
                onClick={() => setShowMoveDialog(true)}
                className="w-full flex items-center gap-3 rounded-xl border border-border bg-muted/30 dark:bg-muted/20 h-11 px-4 text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <HugeiconsIcon
                  icon={Folder01Icon}
                  className="size-5 text-primary shrink-0"
                />
                <span className="text-sm font-medium">{currentFolderName}</span>
              </button>
            </div>

            {/* Export note as PDF */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Export note
              </Label>
              <Button
                type="button"
                variant="outline"
                onClick={handleExportPdf}
                className="w-full justify-start gap-3 rounded-xl border border-border bg-muted/30 dark:bg-muted/20 hover:bg-muted/50 h-11 cursor-pointer"
              >
                <HugeiconsIcon
                  icon={FileDownloadIcon}
                  className="size-5 text-muted-foreground shrink-0"
                />
                Export note as PDF
              </Button>
            </div>

            {/* Delete note */}
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteClick}
              className="w-full justify-start gap-3 rounded-xl h-11 cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <HugeiconsIcon icon={Delete01Icon} className="size-5 shrink-0" />
              Delete note
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MoveToFolderDialog
        noteId={note.id}
        noteTitle={note.title}
        currentFolderId={note.folderId}
        open={showMoveDialog}
        onOpenChange={setShowMoveDialog}
        onSuccess={onSuccess}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The note &quot;{note.title}&quot; will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={handleDeleteConfirm}
              className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <HugeiconsIcon icon={Loading01Icon} className="size-4 animate-spin mr-2" />
              ) : null}
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
