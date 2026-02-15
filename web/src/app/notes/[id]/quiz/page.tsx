"use client";

import React from "react";
import { useParams } from "next/navigation";
import { QuizGenerator } from "@/components/quiz";
import { useNoteContext } from "@/contexts/note-context";

export default function QuizPage() {
  const params = useParams();
  const noteId = params?.id as string;
  const { note } = useNoteContext();

  return (
    <QuizGenerator
      key={`quiz-${noteId}`}
      noteId={noteId}
      noteTitle={note?.title}
    />
  );
}

