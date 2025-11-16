"use client";

import { useState, useEffect } from "react";
import { SharedNoteCard } from "@/components/notes/shared-note-card";
import { FileX } from "lucide-react";

export function ClonedNotesSection() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClonedNotes();
  }, []);

  const fetchClonedNotes = async () => {
    try {
      const response = await fetch("/api/notes/cloned");
      if (response.ok) {
        const data = await response.json();
        setNotes(data.data);
      }
    } catch (error) {
      console.error("Error fetching cloned notes:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="neomorphic h-32 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="neomorphic rounded-2xl p-12 text-center">
        <FileX className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No shared notes yet
        </h3>
        <p className="text-muted-foreground">
          Notes shared with you will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {notes.map((note) => (
        <SharedNoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}
