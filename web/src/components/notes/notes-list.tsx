"use client";

import React, { useState, useEffect } from "react";
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

interface NotesListProps {
  searchQuery?: string;
  transcriptId?: string;
}

export function NotesList({ searchQuery, transcriptId }: NotesListProps) {
  const { getNotes, deleteNote, loading, error } = useNotes();
  const [notes, setNotes] = useState<Note[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load notes on component mount
  useEffect(() => {
    loadNotes();
  }, [transcriptId, searchQuery]);

  const loadNotes = async () => {
    const result = await getNotes(transcriptId);
    if (result) {
      setNotes(result);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
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
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Error loading notes
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
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

  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-stone-400" />
        </div>
        <h3 className="font-semibold text-stone-900 dark:text-white mb-2">
          No notes found
        </h3>
        <p className="text-stone-600 dark:text-stone-400 mb-6">
          Create your first note to get started
        </p>
      </div>
    );
  }

  if (filteredNotes.length === 0 && searchQuery) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-stone-400" />
        </div>
        <h3 className="font-semibold text-stone-900 dark:text-white mb-2">
          No notes match your search
        </h3>
        <p className="text-stone-600 dark:text-stone-400">
          Try adjusting your search terms
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {filteredNotes.map((note) => (
          <NoteCard key={note.id} note={note} onDelete={handleDeleteNote} />
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
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
              className="flex-1 bg-red-600 hover:bg-red-700"
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
