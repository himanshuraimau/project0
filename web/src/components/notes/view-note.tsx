"use client";

import React from "react";
import { Note } from "@/lib/types";
import { LexicalViewer } from "@/components/shared/LexicalViewer";

interface ViewNoteProps {
  note: Note;
  onEdit?: () => void;
}

export function ViewNote({ note }: ViewNoteProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-sans font-bold text-foreground mb-2">
          {note.title}
        </h1>
        <p className="text-muted-foreground">
          Last updated:{" "}
          {formatDate(
            note.updatedAt instanceof Date
              ? note.updatedAt.toISOString()
              : note.updatedAt
          )}
        </p>
      </div>

      <LexicalViewer
        content={note.content || "# No Content\n\nThis note has no content."}
        title={note.title}
        showToolbar={true}
        minHeight="500px"
      />
    </div>
  );
}
