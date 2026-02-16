"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
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
import { toast } from "sonner";

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
    const { loadingNotes, removeLoadingNote, updateLoadingNote } =
      useDashboardRefresh();
    const [notes, setNotes] = useState<NotesNoteWithTranscript[]>([]);
    const [hasCompletedInitialFetch, setHasCompletedInitialFetch] =
      useState(false);

    type DashboardLoadingNote = {
      id: string;
      type: "pdf" | "audio" | "audio-record" | "youtube" | "webpage";
      noteId?: string;
      transcriptId?: string;
      timestamp: number;
      progress?: number;
      message?: string;
      lastProgressAt?: number;
      stage: "uploading" | "processing" | "generating" | "completed" | "error";
      rehydrated?: boolean;
    };

    type MatchingSets = {
      noteIds: Set<string>;
      transcriptIds: Set<string>;
      progressJobIds: Set<string>;
    };

    const completionToastShownRef = useRef<Set<string>>(new Set());

    const showRecoveredCompletionToast = useCallback(
      (
        jobId: string,
        type: DashboardLoadingNote["type"],
        noteTitle?: string | null
      ) => {
        if (!jobId || completionToastShownRef.current.has(jobId)) return;
        completionToastShownRef.current.add(jobId);

        const titleByType: Record<DashboardLoadingNote["type"], string> = {
          pdf: "PDF note is ready",
          audio: "Audio note is ready",
          "audio-record": "Recording note is ready",
          youtube: "YouTube note is ready",
          webpage: "Webpage note is ready",
        };

        toast.success(titleByType[type], {
          description:
            typeof noteTitle === "string" && noteTitle.trim().length > 0
              ? noteTitle
              : "Your refreshed generation finished successfully.",
          duration: 4000,
          id: `recovered-note-${jobId}`,
        });
      },
      []
    );

    const getProgressJobIdFromNote = useCallback((
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
    }, []);

    const createMatchingSets = useCallback(
      (targetNotes: NotesNoteWithTranscript[]): MatchingSets => ({
        noteIds: new Set(targetNotes.map((note) => note.id)),
        transcriptIds: new Set(
          targetNotes.map((note) => note.transcriptId).filter(Boolean)
        ),
        progressJobIds: new Set(
          targetNotes
            .map((note) => getProgressJobIdFromNote(note))
            .filter((jobId): jobId is string => Boolean(jobId))
        ),
      }),
      [getProgressJobIdFromNote]
    );

    const findMatchedNote = useCallback(
      (
        loadingNote: DashboardLoadingNote,
        targetNotes: NotesNoteWithTranscript[]
      ): NotesNoteWithTranscript | null => {
        if (loadingNote.noteId) {
          const noteById = targetNotes.find((note) => note.id === loadingNote.noteId);
          if (noteById) return noteById;
        }

        const noteByProgressJobId = targetNotes.find(
          (note) => getProgressJobIdFromNote(note) === loadingNote.id
        );
        if (noteByProgressJobId) return noteByProgressJobId;

        if (loadingNote.transcriptId) {
          const noteByTranscript = targetNotes.find(
            (note) => note.transcriptId === loadingNote.transcriptId
          );
          if (noteByTranscript) return noteByTranscript;
        }

        return null;
      },
      [getProgressJobIdFromNote]
    );

    const getResolvedReason = useCallback(
      (
        loadingNote: DashboardLoadingNote,
        matchingSets: MatchingSets,
        now: number
      ): string | null => {
        const activityTimestamp =
          loadingNote.lastProgressAt ?? loadingNote.timestamp;
        const tenMinutesAgo = now - 10 * 60 * 1000;
        const fiveMinutesAgo = now - 5 * 60 * 1000;

        if (
          (loadingNote.stage === "uploading" ||
            loadingNote.stage === "processing" ||
            loadingNote.stage === "generating") &&
          activityTimestamp < tenMinutesAgo
        ) {
          return "stale";
        }
        if (loadingNote.stage === "error" && activityTimestamp < fiveMinutesAgo) {
          return "stale";
        }
        if (loadingNote.stage === "completed") return "completed";
        if (loadingNote.noteId && matchingSets.noteIds.has(loadingNote.noteId)) {
          return "noteId";
        }
        if (matchingSets.progressJobIds.has(loadingNote.id)) {
          return "progressJobId";
        }
        if (
          loadingNote.transcriptId &&
          matchingSets.transcriptIds.has(loadingNote.transcriptId)
        ) {
          return "transcriptId";
        }

        return null;
      },
      []
    );

    // Use a ref for loadingNotes so cleanup logic doesn't cause loadNotes to recreate
    const loadingNotesRef = useRef(loadingNotes);
    useEffect(() => {
      loadingNotesRef.current = loadingNotes;
    }, [loadingNotes]);

    const cleanupResolvedLoadingNotes = useCallback(
      (targetNotes: NotesNoteWithTranscript[]) => {
        const now = Date.now();
        const matchingSets = createMatchingSets(targetNotes);
        const currentLoadingNotes = loadingNotesRef.current;

        currentLoadingNotes.forEach((loadingNote) => {
          const typedLoadingNote = loadingNote as DashboardLoadingNote;
          const reason = getResolvedReason(
            typedLoadingNote,
            matchingSets,
            now
          );
          if (!reason) return;

          // Refresh recovery path: show completion feedback once when a restored
          // loading card resolves to a real note.
          if (
            typedLoadingNote.rehydrated &&
            (reason === "noteId" ||
              reason === "progressJobId" ||
              reason === "transcriptId")
          ) {
            const matchedNote = findMatchedNote(typedLoadingNote, targetNotes);
            if (matchedNote) {
              showRecoveredCompletionToast(
                typedLoadingNote.id,
                typedLoadingNote.type,
                matchedNote.title
              );
            }
          }

          console.log(
            `[NotesList] Removing loading note (${reason}):`,
            typedLoadingNote.id
          );
          removeLoadingNote(typedLoadingNote.id);
        });
      },
      [
        createMatchingSets,
        findMatchedNote,
        getResolvedReason,
        removeLoadingNote,
        showRecoveredCompletionToast,
      ]
    );

    const loadNotes = useCallback(async () => {
      try {
        const result = await getNotes(transcriptId);
        if (!result) return;

        const fetchedNotes = result as NotesNoteWithTranscript[];
        setNotes(fetchedNotes);
        cleanupResolvedLoadingNotes(fetchedNotes);
      } finally {
        setHasCompletedInitialFetch(true);
      }
    }, [transcriptId, getNotes, cleanupResolvedLoadingNotes]);

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

    const activeLoadingNotes = useMemo(() => {
      const matchingSets = createMatchingSets(notes);
      const now = Date.now();

      return loadingNotes.filter((loadingNote) => {
        if (loadingNote.rehydrated && !hasCompletedInitialFetch) {
          return false;
        }

        return (
          getResolvedReason(
            loadingNote as DashboardLoadingNote,
            matchingSets,
            now
          ) === null
        );
      });
    }, [
      createMatchingSets,
      getResolvedReason,
      hasCompletedInitialFetch,
      loadingNotes,
      notes,
    ]);

    const recoveryStateRef = useRef<
      Map<string, { attempts: number; lastAttemptAt: number }>
    >(new Map());

    const resumeStalledYoutubeGeneration = useCallback(
      async (loadingNote: DashboardLoadingNote) => {
        const safeProgress =
          typeof loadingNote.progress === "number" &&
          Number.isFinite(loadingNote.progress)
            ? Math.max(0, Math.min(100, Math.round(loadingNote.progress)))
            : 55;

        updateLoadingNote(loadingNote.id, {
          stage: "generating",
          progress: Math.max(safeProgress, 60),
          message: "Resuming note generation...",
        });

        const response = await fetch("/api/notes/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcriptId: loadingNote.transcriptId,
            progressJobId: loadingNote.id,
          }),
        });

        const result = await response.json().catch(() => null);

        if (response.ok && result?.success && result?.data?.id) {
          if (loadingNote.rehydrated && loadingNote.type === "youtube") {
            showRecoveredCompletionToast(
              loadingNote.id,
              loadingNote.type,
              typeof result.data.title === "string" ? result.data.title : null
            );
          }

          updateLoadingNote(loadingNote.id, {
            transcriptId:
              loadingNote.transcriptId ??
              (typeof result.data.transcriptId === "string"
                ? result.data.transcriptId
                : undefined),
            noteId: result.data.id,
            stage: "completed",
            progress: 100,
            message: "Notes generated successfully",
          });
          return;
        }

        if (response.status === 404) {
          // Transcript may still be in-flight. Keep card active and retry later.
          return;
        }

        if (response.status === 403) {
          updateLoadingNote(loadingNote.id, {
            stage: "error",
            error:
              result?.message ||
              result?.error ||
              "Unable to continue note generation",
            message:
              result?.message ||
              result?.error ||
              "Unable to continue note generation",
          });
          return;
        }

        console.warn(
          "[NotesList] Auto-resume failed for loading note:",
          loadingNote.id,
          result
        );
      },
      [showRecoveredCompletionToast, updateLoadingNote]
    );

    useEffect(() => {
      const activeIds = new Set(activeLoadingNotes.map((note) => note.id));
      recoveryStateRef.current.forEach((_, noteId) => {
        if (!activeIds.has(noteId)) {
          recoveryStateRef.current.delete(noteId);
        }
      });
    }, [activeLoadingNotes]);

    useEffect(() => {
      if (!hasCompletedInitialFetch || activeLoadingNotes.length === 0) {
        return;
      }

      const now = Date.now();
      const inactivityThresholdMs = 30_000;
      const attemptCooldownMs = 30_000;
      const maxAttempts = 4;

      activeLoadingNotes.forEach((loadingNote) => {
        const candidate = loadingNote as DashboardLoadingNote;
        if (candidate.type !== "youtube") return;
        if (!candidate.rehydrated) return;
        if (candidate.stage === "error" || candidate.stage === "completed") return;

        const progress =
          typeof candidate.progress === "number" &&
          Number.isFinite(candidate.progress)
            ? candidate.progress
            : 0;

        // 55% is the transcript-complete handoff. If we are still below note-generation
        // progress after refresh and no activity arrives, re-trigger generation.
        if (progress >= 65) return;

        const activityTimestamp = candidate.lastProgressAt ?? candidate.timestamp;
        if (now - activityTimestamp < inactivityThresholdMs) return;

        const recoveryState = recoveryStateRef.current.get(candidate.id) ?? {
          attempts: 0,
          lastAttemptAt: 0,
        };

        if (recoveryState.attempts >= maxAttempts) return;
        if (now - recoveryState.lastAttemptAt < attemptCooldownMs) return;

        recoveryStateRef.current.set(candidate.id, {
          attempts: recoveryState.attempts + 1,
          lastAttemptAt: now,
        });

        void resumeStalledYoutubeGeneration(candidate).then(() => {
          void loadNotes();
        });
      });
    }, [
      activeLoadingNotes,
      hasCompletedInitialFetch,
      loadNotes,
      resumeStalledYoutubeGeneration,
    ]);

    // Recovery polling: if a completion socket event is missed, detect DB note creation and clear loading card
    useEffect(() => {
      if (!hasCompletedInitialFetch || activeLoadingNotes.length === 0) {
        return;
      }

      const interval = setInterval(() => {
        loadNotes();
      }, 10000);

      return () => clearInterval(interval);
    }, [hasCompletedInitialFetch, activeLoadingNotes.length, loadNotes]);

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
    if (notes.length === 0 && activeLoadingNotes.length === 0) {
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
          {activeLoadingNotes.map((loadingNote) => (
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
