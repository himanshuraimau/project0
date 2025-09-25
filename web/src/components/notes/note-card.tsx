"use client";

import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, Calendar } from "lucide-react";
import { MarkdownRenderer } from "@/components/mdx-renderer";
import { Note } from "@/lib/types";
import { useRouter } from "next/navigation";

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
}

export function NoteCard({ note, onDelete }: NoteCardProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleViewNote = () => {
    router.push(`/notes/${note.id}`);
  };

  const handleDeleteNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(note.id);
  };

  return (
    <Card
      className="group rounded-[12px] p-4 hover:shadow-md transition-all duration-200 cursor-pointer bg-white dark:bg-stone-900/50 border border-stone-100 dark:border-stone-900 dark:hover:bg-stone-800/80"
      onClick={handleViewNote}
    >
      <CardContent className="">
        <h3 className="font-medium text-lg  line-clamp-1">{note.title}</h3>
      </CardContent>

      <CardFooter className="flex items-center justify-between pl-2 dark:border-stone-700">
        <div className="flex items-center gap-2 text-sm font-normal leading-5 text-stone-400 dark:text-stone-400">
          <Calendar className="h-3 w-3" />
          <span>
            {formatDate(
              note.updatedAt instanceof Date
                ? note.updatedAt.toISOString()
                : note.updatedAt
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleViewNote();
            }}
            variant="outline"
            size="sm"
            className="h-8  px-3 text-xs cursor-pointer border-none dark:bg-stone-800 dark:hover:bg-stone-700 bg-stone-50 hover:bg-stone-100 rounded-[8px]"
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button
            onClick={handleDeleteNote}
            variant="outline"
            size="sm"
            className="h-8  px-3 text-xs cursor-pointer border-none dark:bg-stone-800 dark:hover:bg-stone-700 bg-stone-50 hover:bg-stone-100 rounded-[8px]"
          >
            <Trash2 className="h-3 w-3 mr-1 text-red-500" />
            Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
