"use client";

import React, { useState, useEffect } from "react";
import { useNotes } from "@/hooks/use-notes";
import { Note } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { UserControl } from "@/components/user-control";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { NotesAppSidebar } from "@/components/notes/notes-sidebar";
import { Toaster } from "sonner";
import { ThemeToggleButton } from "@/components/dashboard/theme-toggle-button";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  weight: "600",
});

function NotesContent({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  return (
    <div 
      className={`
        flex-1 h-full bg-white border-b border-stone-200 dark:bg-stone-950 overflow-y-scroll 
        transition-all duration-300 ease-in-out
      `}
    >
      <div className="">
        <div
          className={`${jakarta.className} py-[22px] border-b border-stone-200 flex bg-white dark:bg-stone-950 items-center  dark:border-stone-800  justify-between px-8 transition-all duration-300`}
        >
          <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            Notes
          </h1>
          <span className="flex gap-6 items-center">
            <ThemeToggleButton />
            <UserControl showName />
          </span>
        </div>
        <div className="transition-all duration-300">
          {children}
        </div>
      </div>
    </div>
  );
}

function NotesMainContent() {
  const { getNotes, loading } = useNotes();
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    const fetchNotes = async () => {
      const fetchedNotes = await getNotes();
      if (fetchedNotes) {
        setNotes(fetchedNotes);
      }
    };

    fetchNotes();
  }, [getNotes]);

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

export default function NotesPage() {
  return (
    <div className="h-screen bg-stone-50 dark:bg-stone-900">
      <SidebarProvider defaultOpen={true}>
        <div className="flex flex-1 h-full">
          <NotesAppSidebar />
          <NotesContent>
            <NotesMainContent />
            <Toaster />
          </NotesContent>
        </div>
      </SidebarProvider>
    </div>
  );
}