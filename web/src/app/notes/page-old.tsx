"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNotes } from "@/hooks/use-notes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { Note } from "@/lib/types";

export default function NotesPage() {
  const { getNotes, loading } = useNotes();
  const [notes, setNotes] = useState<Note[]>([]);

  const fetchNotes = useCallback(async () => {
    const fetchedNotes = await getNotes();
    if (fetchedNotes) {
      setNotes(fetchedNotes);
    }
  }, [getNotes]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
          Your Notes
        </h2>
        <Button asChild>
          <Link href="/notes/new">
            <Plus className="size-4 mr-2" />
            Create Note
          </Link>
        </Button>
      </div>

      {notes && notes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note: Note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href={`/notes/${note.id}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="size-5" />
                    {note.title || "Untitled Note"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-3">
                    {note.content ? 
                      note.content.slice(0, 150) + (note.content.length > 150 ? "..." : "") 
                      : "No content"
                    }
                  </p>
                  <p className="text-xs text-stone-500 mt-2">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="size-16 mx-auto text-stone-400 mb-4" />
          <h3 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
            No notes yet
          </h3>
          <p className="text-stone-600 dark:text-stone-400 mb-6">
            Start by creating your first note
          </p>
          <Button asChild>
            <Link href="/notes/new">
              <Plus className="size-4 mr-2" />
              Create Note
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}