"use client";

import React from "react";
import { useParams } from "next/navigation";
import { FlashcardGenerator } from "@/components/flashcards";
import { useNoteContext } from "@/contexts/note-context";

export default function FlashcardPage() {
  const params = useParams();
  const noteId = params?.id as string;
  const { note } = useNoteContext();

  return (
    <FlashcardGenerator
      key={`flashcards-${noteId}`}
      noteId={noteId}
      noteTitle={note?.title}
    />
  );
}

