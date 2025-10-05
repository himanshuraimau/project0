"use client";

import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { useNotes } from "@/hooks/use-notes";
import { Note } from "@/lib/types";
import { NoteCard } from "./note-card";
import { Loader2, FileText, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { NoteCardShimmer } from "@/components/ui/shimmer";
import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";

interface NotesListProps {
  searchQuery?: string;
  transcriptId?: string;
}

export interface NotesListRef {
  refreshNotes: () => Promise<void>;
}

export const NotesList = forwardRef<NotesListRef, NotesListProps>(
  ({ searchQuery, transcriptId }, ref) => {
    const { getNotes, deleteNote, loading, error } = useNotes();
    const { loadingNotes } = useDashboardRefresh();
    const [notes, setNotes] = useState<Note[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Debug: Log loading notes changes
    useEffect(() => {
      console.log('[NotesList] Loading notes updated:', loadingNotes);
    }, [loadingNotes]);

    const loadNotes = useCallback(async () => {
      const result = await getNotes(transcriptId);
      if (result) {
        setNotes(result);
      }
    }, [transcriptId, getNotes]);

    // Expose refresh method to parent component
    useImperativeHandle(ref, () => ({
      refreshNotes: loadNotes
    }), [loadNotes]);

    // Load notes on component mount
    useEffect(() => {
      loadNotes();
    }, [loadNotes, searchQuery]);

  const handleDeleteNote = (id: string) => {
    setNoteToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;

    setIsDeleting(true);
    try {
      const success = await deleteNote(noteToDelete);
      if (success) {
        await loadNotes();
        setDeleteDialogOpen(false);
        setNoteToDelete(null);
        toast.success("Note deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteNote = () => {
    setDeleteDialogOpen(false);
    setNoteToDelete(null);
  };

  // Filter notes based on search query
  const filterNotes = (notes: Note[], query: string): Note[] => {
    if (!query || query.trim() === "") {
      return notes;
    }

    const searchTerm = query.toLowerCase().trim();

    return notes.filter((note) => {
      // Search in note title
      const titleMatch = note.title.toLowerCase().includes(searchTerm);

      // Search in note content
      const contentMatch =
        note.content?.toLowerCase().includes(searchTerm) || false;

      // Search in transcript original name
      const transcriptMatch =
        note.transcript?.originalName.toLowerCase().includes(searchTerm) ||
        false;

      return titleMatch || contentMatch || transcriptMatch;
    });
  };

  if (loading && notes.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">
            Loading notes...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">
            Error loading notes
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {error}
          </p>
          <Button onClick={loadNotes} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const filteredNotes = filterNotes(notes, searchQuery || "");

  // Show shimmer if we're loading the first note (empty state with loading notes)
  if (notes.length === 0 && loadingNotes.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileText className="h-10 w-10 text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="font-semibold text-xl text-slate-900 dark:text-slate-100 mb-3">
          No notes found
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
          Create your first note by uploading a PDF, recording audio, or processing a YouTube video or webpage.
        </p>
      </div>
    );
  }

  if (filteredNotes.length === 0 && searchQuery) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileText className="h-10 w-10 text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="font-semibold text-xl text-slate-900 dark:text-slate-100 mb-3">
          No notes match your search
        </h3>
        <p className="text-slate-500 dark:text-slate-400">
          Try adjusting your search terms or create a new note.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6 w-full">
        {/* Show shimmer cards for loading notes */}
        {loadingNotes.map((loadingNote) => (
          <NoteCardShimmer key={loadingNote.id} />
        ))}
        
        {/* Show actual notes */}
        {filteredNotes.map((note) => (
          <NoteCard key={note.id} note={note} onDelete={handleDeleteNote} />
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md bg-card border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              Delete Note
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2">
              Are you sure you want to delete this note? This action cannot be
              undone and all content will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-4">
            <AlertDialogCancel
              onClick={cancelDeleteNote}
              disabled={isDeleting}
              className="flex-1"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteNote}
              disabled={isDeleting}
              className="flex-1 bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Note
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
    );
  }
);

NotesList.displayName = "NotesList";
