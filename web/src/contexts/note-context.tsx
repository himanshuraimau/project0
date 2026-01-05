"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useNotes } from "@/hooks/use-notes";
import { Note } from "@/lib/types";
import { NoteDetailSkeleton } from "@/components/notes/notes-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface NoteContextType {
  note: Note | null;
  updateNote: (updatedNote: Note) => void;
  loading: boolean;
  error: string | null;
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export function NoteProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const noteId = params.id as string;
  const { getNote, loading, error } = useNotes();
  const [note, setNote] = useState<Note | null>(null);

  useEffect(() => {
    const fetchNote = async () => {
      if (noteId) {
        const fetchedNote = await getNote(noteId);
        if (fetchedNote) {
          setNote(fetchedNote);
        }
      }
    };

    fetchNote();
  }, [noteId]);

  const updateNote = (updatedNote: Note) => {
    setNote(updatedNote);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-background">
        <NoteDetailSkeleton />
      </div>
    );
  }

  if (error || !note) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="text-center text-red-600">
            <p className="font-medium">Error loading note</p>
            <p className="text-sm mt-1">{error || "Note not found"}</p>
            <Button onClick={() => router.push("/dashboard")} className="mt-3" size="sm">
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <NoteContext.Provider value={{ note, updateNote, loading, error }}>
      {children}
    </NoteContext.Provider>
  );
}

export function useNoteContext() {
  const context = useContext(NoteContext);
  if (context === undefined) {
    throw new Error("useNoteContext must be used within a NoteProvider");
  }
  return context;
}

