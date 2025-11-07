"use client";

import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { useNotes } from "@/hooks/use-notes";
import { NotesNoteWithTranscript } from "@/lib/types";
import { NoteCard } from "@/components/features/notes/note-card";
import { Loader2, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardRefresh } from "@/lib/contexts/dashboard-refresh-context";

/**
 * Simple local shimmer placeholder for note cards to avoid depending on a missing module.
 * Kept minimal — adjust styles to match your design system if needed.
 */
const NoteCardShimmer: React.FC = () => {
  return (
    <div className="w-full border rounded-lg p-4 animate-pulse bg-background/50">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 bg-muted rounded-md" />
        <div className="flex-1">
          <div className="h-4 bg-muted rounded mb-2 w-3/4" />
          <div className="h-3 bg-muted rounded mb-3 w-1/2" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
      </div>
    </div>
  );
};

interface NotesListProps {
  searchQuery?: string;
  transcriptId?: string;
  limit?: number;
}

export interface NotesListRef {
  refreshNotes: () => Promise<void>;
}

export const NotesList = forwardRef<NotesListRef, NotesListProps>(
  ({ searchQuery, transcriptId, limit }, ref) => {
    const { getNotes, loading, error } = useNotes();
    const { loadingNotes } = useDashboardRefresh();
    const [notes, setNotes] = useState<NotesNoteWithTranscript[]>([]);    // Debug: Log loading notes changes
    useEffect(() => {
    }, [loadingNotes]);

    const loadNotes = useCallback(async () => {
      const result = await getNotes(transcriptId);
      if (result) {
        setNotes(result as NotesNoteWithTranscript[]);
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
    const filterNotes = (notes: NotesNoteWithTranscript[], query: string): NotesNoteWithTranscript[] => {
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
          {(limit ? filteredNotes.slice(0, limit) : filteredNotes).map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>


      </>
    );
  }
);

NotesList.displayName = "NotesList";