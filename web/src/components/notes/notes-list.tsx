"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useNotes } from "@/hooks/use-notes";
import { NotesNoteWithTranscript } from "@/lib/types";
import { NoteCard } from "./note-card";
import { GeneratingNoteCard } from "./generating-note-card";
import { NoteCardShimmer } from "@/components/ui/shimmer";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";
import { HugeiconsIcon } from "@hugeicons/react";
import { Note01Icon } from "@hugeicons/core-free-icons";

interface NotesListProps {
  searchQuery?: string;
  transcriptId?: string;
  limit?: number;
  folderId?: string | null;
}

export interface NotesListRef {
  refreshNotes: () => Promise<void>;
}

export const NotesList = forwardRef<NotesListRef, NotesListProps>(
  ({ searchQuery, transcriptId, limit, folderId }, ref) => {
    const { getNotes, loading, error } = useNotes();
    const { loadingNotes, removeLoadingNote } = useDashboardRefresh();
    const [notes, setNotes] = useState<NotesNoteWithTranscript[]>([]);

    const getProgressJobIdFromNote = (
      note: NotesNoteWithTranscript
    ): string | null => {
      const transcript = note.transcript as
        | ({ metadata?: unknown } & NotesNoteWithTranscript["transcript"])
        | undefined;
      const metadata = transcript?.metadata;

      if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
        return null;
      }

      const progressJobId = (metadata as Record<string, unknown>).progressJobId;
      if (typeof progressJobId !== "string" || progressJobId.trim().length === 0) {
        return null;
      }

      return progressJobId.trim();
    };

    // Use a ref for loadingNotes so cleanup logic doesn't cause loadNotes to recreate
    const loadingNotesRef = useRef(loadingNotes);
    useEffect(() => {
      loadingNotesRef.current = loadingNotes;
    }, [loadingNotes]);

    const loadNotes = useCallback(async () => {
      const result = await getNotes(transcriptId);
      if (result) {
        setNotes(result as NotesNoteWithTranscript[]);

        // Auto-cleanup loading notes that have a matching note in the DB
        const currentLoadingNotes = loadingNotesRef.current;
        if (currentLoadingNotes.length > 0) {
          const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
          const noteIds = new Set(result.map((n) => n.id));
          const transcriptIds = new Set(
            result.map((n) => n.transcriptId).filter(Boolean)
          );
          const progressJobIds = new Set(
            result
              .map((n) => getProgressJobIdFromNote(n as NotesNoteWithTranscript))
              .filter((jobId): jobId is string => Boolean(jobId))
          );

          currentLoadingNotes.forEach((loadingNote) => {
            // Remove if stale (older than 30 minutes)
            if (loadingNote.timestamp < thirtyMinutesAgo) {
              console.log('[NotesList] Removing stale loading note:', loadingNote.id);
              removeLoadingNote(loadingNote.id);
              return;
            }

            // Remove if the note is in "completed" stage (should already be gone but safety check)
            if (loadingNote.stage === 'completed') {
              console.log('[NotesList] Removing completed loading note:', loadingNote.id);
              removeLoadingNote(loadingNote.id);
              return;
            }

            // Remove if corresponding note now exists in database
            if (loadingNote.noteId && noteIds.has(loadingNote.noteId)) {
              console.log('[NotesList] Removing loading note - note found in DB:', loadingNote.id);
              removeLoadingNote(loadingNote.id);
              return;
            }

            // Remove if transcript metadata links this note to the progress job
            if (progressJobIds.has(loadingNote.id)) {
              console.log('[NotesList] Removing loading note - progressJobId found in transcript metadata:', loadingNote.id);
              removeLoadingNote(loadingNote.id);
              return;
            }

            // Remove if transcript exists and has notes
            if (
              loadingNote.transcriptId &&
              transcriptIds.has(loadingNote.transcriptId)
            ) {
              const noteForTranscript = result.find(
                (n) => n.transcriptId === loadingNote.transcriptId
              );
              if (noteForTranscript) {
                console.log('[NotesList] Removing loading note - transcript has note:', loadingNote.id);
                removeLoadingNote(loadingNote.id);
                return;
              }
            }
          });
        }
      }
    }, [transcriptId, getNotes, removeLoadingNote]);

    // Expose refresh method to parent component
    useImperativeHandle(
      ref,
      () => ({
        refreshNotes: loadNotes,
      }),
      [loadNotes]
    );

    // Load notes on component mount
    useEffect(() => {
      loadNotes();
    }, [loadNotes, searchQuery]);

    // Recovery polling: if a completion socket event is missed, detect DB note creation and clear loading card
    useEffect(() => {
      if (loadingNotes.length === 0) {
        return;
      }

      const interval = setInterval(() => {
        loadNotes();
      }, 10000);

      return () => clearInterval(interval);
    }, [loadingNotes.length, loadNotes]);
    
    // Additional cleanup check when component mounts or loadingNotes changes
    // This helps clean up any stale loading notes immediately when returning to the page
    useEffect(() => {
      if (notes.length > 0 && loadingNotes.length > 0) {
        const noteIds = new Set(notes.map((n) => n.id));
        const transcriptIds = new Set(
          notes.map((n) => n.transcriptId).filter(Boolean)
        );
        const progressJobIds = new Set(
          notes
            .map((n) => getProgressJobIdFromNote(n))
            .filter((jobId): jobId is string => Boolean(jobId))
        );
        
        loadingNotes.forEach((loadingNote) => {
          // If note exists in DB, remove the loading state immediately
          if (loadingNote.noteId && noteIds.has(loadingNote.noteId)) {
            console.log('[NotesList] Immediate cleanup: note exists in DB:', loadingNote.id);
            removeLoadingNote(loadingNote.id);
          } else if (progressJobIds.has(loadingNote.id)) {
            console.log('[NotesList] Immediate cleanup: progressJobId found in transcript metadata:', loadingNote.id);
            removeLoadingNote(loadingNote.id);
          } else if (
            loadingNote.transcriptId &&
            transcriptIds.has(loadingNote.transcriptId)
          ) {
            console.log('[NotesList] Immediate cleanup: transcript has note:', loadingNote.id);
            removeLoadingNote(loadingNote.id);
          } else if (loadingNote.stage === 'completed') {
            console.log('[NotesList] Immediate cleanup: note already completed:', loadingNote.id);
            removeLoadingNote(loadingNote.id);
          }
        });
      }
    }, [notes, loadingNotes, removeLoadingNote]);

    // Filter notes based on search query
    const filterNotes = (
      notes: NotesNoteWithTranscript[],
      query: string
    ): NotesNoteWithTranscript[] => {
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

    // Filter notes by folder
    const filterByFolder = (
      notes: NotesNoteWithTranscript[]
    ): NotesNoteWithTranscript[] => {
      if (folderId === undefined || folderId === null) {
        return notes; // Show all notes when no folder filter is applied
      }

      if (folderId === "uncategorized") {
        return notes.filter((note) => !note.folderId);
      }

      return notes.filter((note) => note.folderId === folderId);
    };

    if (loading && notes.length === 0) {
      return (
        <div className="flex flex-col gap-6 w-full">
          {[1, 2, 3].map((i) => (
            <NoteCardShimmer key={i} />
          ))}
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
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadNotes} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    const filteredNotes = filterByFolder(filterNotes(notes, searchQuery || ""));

    // Premium empty state — no notes yet
    if (notes.length === 0 && loadingNotes.length === 0) {
      return (
        <div className="flex flex-col items-center text-center py-16 px-4">
          <div
            className="relative flex size-24 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6 animate-in fade-in duration-500"
            aria-hidden
          >
            <div className="absolute inset-0 rounded-2xl bg-primary/5 animate-pulse" />
            <HugeiconsIcon
              icon={Note01Icon}
              className="size-12 shrink-0 relative z-10"
            />
          </div>
          <h3 className="font-semibold text-xl text-foreground mb-2 tracking-tight">
            No notes yet
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
            Create your first note by uploading a PDF, recording audio, or
            adding a YouTube or webpage link above.
          </p>
        </div>
      );
    }

    if (filteredNotes.length === 0 && searchQuery) {
      return (
        <div className="flex flex-col items-center text-center py-16 px-4">
          <div className="flex size-16 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-4">
            <HugeiconsIcon icon={Note01Icon} className="size-8" />
          </div>
          <h3 className="font-semibold text-lg text-foreground mb-2">
            No notes match your search
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Try different keywords or create a new note.
          </p>
        </div>
      );
    }

    // Show empty state when folder has no notes
    if (
      filteredNotes.length === 0 &&
      folderId &&
      folderId !== "uncategorized"
    ) {
      return (
        <div className="flex flex-col items-center text-center py-16 px-4 rounded-2xl border border-border bg-card/50">
          <div className="flex size-16 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-4">
            <HugeiconsIcon icon={Note01Icon} className="size-8" />
          </div>
          <h3 className="font-semibold text-lg text-foreground mb-2">
            This folder is empty
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Move notes here or create new ones to organize your content.
          </p>
        </div>
      );
    }

    // Show empty state for uncategorized
    if (filteredNotes.length === 0 && folderId === "uncategorized") {
      return (
        <div className="flex flex-col items-center text-center py-16 px-4 rounded-2xl border border-border bg-card/50">
          <div className="flex size-16 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-4">
            <HugeiconsIcon icon={Note01Icon} className="size-8" />
          </div>
          <h3 className="font-semibold text-lg text-foreground mb-2">
            All notes are organized
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Uncategorized notes will show up here when you add them.
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="flex flex-col gap-4 w-full">
          {/* Progress cards for notes being generated */}
          {loadingNotes.map((loadingNote) => (
            <GeneratingNoteCard
              key={loadingNote.id}
              loadingNote={loadingNote}
              onDismiss={(note) => removeLoadingNote(note.id)}
            />
          ))}

          {/* Show actual notes */}
          {(limit ? filteredNotes.slice(0, limit) : filteredNotes).map(
            (note) => (
              <NoteCard key={note.id} note={note} onUpdate={loadNotes} />
            )
          )}
        </div>
      </>
    );
  }
);

NotesList.displayName = "NotesList";
