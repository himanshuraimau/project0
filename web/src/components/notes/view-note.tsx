"use client";

import React from "react";
import { Note } from "@/lib/types";
import { LexicalViewer } from "@/components/shared/LexicalViewer";

interface ViewNoteProps {
  note: Note;
  onEdit?: () => void;
}

export function ViewNote({ note }: ViewNoteProps) {
  return (
    <div className="max-w-5xl mx-auto bg-transparent">
      <LexicalViewer
        content={note.content || "# No Content\n\nThis note has no content."}
        title={note.title}
        showToolbar={true}
      />
    </div>
  );
}
