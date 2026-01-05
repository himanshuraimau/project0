"use client";

import React from "react";
import { ViewNote } from "@/components/notes/view-note";
import { useNoteContext } from "@/contexts/note-context";

export default function NoteEditPage() {
  const { note, updateNote } = useNoteContext();

  if (!note) {
    return null;
  }

  return (
    <div data-testid="edit-note" tabIndex={-1}>
      <ViewNote 
        note={note} 
        onUpdate={updateNote} 
        initialViewMode="edit"
      />
    </div>
  );
}

