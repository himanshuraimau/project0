"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";
import { NoteCard } from "@/components/notes/note-card";
import { HugeiconsIcon } from "@hugeicons/react";
import { FolderShared01Icon, Note01Icon } from "@hugeicons/core-free-icons";
import type { NotesNoteWithTranscript } from "@/lib/types";

/** Serialized note shape passed from server (dates as ISO strings) */
export type ClonedNoteSerialized = Omit<
  NotesNoteWithTranscript,
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
  transcript: {
    id: string;
    originalName: string;
    fileName: string;
    createdAt: string;
    type: string;
  };
};

interface ClonedPageViewProps {
  notes: ClonedNoteSerialized[];
}

function toNoteWithTranscript(n: ClonedNoteSerialized): NotesNoteWithTranscript {
  return {
    ...n,
    createdAt: new Date(n.createdAt),
    updatedAt: new Date(n.updatedAt),
    transcript: n.transcript,
  };
}

export function ClonedPageView({ notes }: ClonedPageViewProps) {
  const router = useRouter();
  const { clonedSearchQuery } = useDashboardRefresh();

  const filteredNotes = useMemo(() => {
    if (!clonedSearchQuery.trim()) return notes;
    const q = clonedSearchQuery.toLowerCase().trim();
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(q) ||
        (note.content?.toLowerCase().includes(q) ?? false) ||
        (note.transcript?.originalName?.toLowerCase().includes(q) ?? false)
    );
  }, [notes, clonedSearchQuery]);

  const handleUpdate = () => {
    router.refresh();
  };

  if (notes.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 px-4">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
          <HugeiconsIcon icon={FolderShared01Icon} className="size-10" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2 text-center">
          No shared notes yet
        </h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm leading-relaxed">
          When someone shares a note with you and you save it, it will appear here.
        </p>
      </div>
    );
  }

  if (filteredNotes.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-border bg-card/50">
        <div className="flex size-14 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-4">
          <HugeiconsIcon icon={Note01Icon} className="size-7" />
        </div>
        <h3 className="font-semibold text-foreground mb-1">No notes match your search</h3>
        <p className="text-sm text-muted-foreground">Try different keywords.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {filteredNotes.map((note) => (
        <NoteCard
          key={note.id}
          note={toNoteWithTranscript(note)}
          onUpdate={handleUpdate}
        />
      ))}
    </div>
  );
}
