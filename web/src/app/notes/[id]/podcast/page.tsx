"use client";

import React from "react";
import { useParams } from "next/navigation";
import { PodcastPage } from "@/components/podcast";
import { useNoteContext } from "@/contexts/note-context";

export default function PodcastPageRoute() {
  const params = useParams();
  const noteId = params?.id as string;
  const { note } = useNoteContext();

  return (
    <div
      className="w-full bg-transparent focus:outline-none transition-all duration-300 ease-in-out"
      data-testid="podcast-generator"
      tabIndex={-1}
      role="main"
      aria-label="Podcast generation interface"
    >
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        <PodcastPage
          key={`podcast-${noteId}`}
          noteId={noteId}
          noteTitle={note?.title}
          noteContent={note?.content || undefined}
        />
      </div>
    </div>
  );
}

