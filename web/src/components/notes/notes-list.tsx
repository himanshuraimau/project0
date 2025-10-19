"use client";

import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { useNotes } from "@/hooks/use-notes";
import { Note } from "@/lib/types";
import { NoteCard } from "./note-card";
import { Loader2, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const { getNotes, loading, error } = useNotes();
  const { loadingNotes } = useDashboardRefresh();
  const [notes, setNotes] = useState<Note[]>([]);    // Debug: Log loading notes changes
    useEffect(() => {
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
        <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileText className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-xl text-foreground mb-3">
          No notes found
        </h3>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Create your first note by uploading a PDF, recording audio, or processing a YouTube video or webpage.
        </p>
      </div>
    );
  }

  if (filteredNotes.length === 0 && searchQuery) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileText className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-xl text-foreground mb-3">
          No notes match your search
        </h3>
        <p className="text-muted-foreground">
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
          <NoteCard key={note.id} note={note} />
        ))}
      </div>


    </>
    );
  }
);

NotesList.displayName = "NotesList";
