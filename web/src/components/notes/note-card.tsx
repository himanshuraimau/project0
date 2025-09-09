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

  // Extract a preview of the content (first 150 chars)
  const contentPreview = note.content
    ? note.content.substring(0, 150) + (note.content.length > 150 ? "..." : "")
    : "No content available";

  return (
    <Card
      className="group rounded-[12px] hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200 dark:border-stone-800  dark:bg-stone-900 "
      onClick={handleViewNote}
    >
      <CardContent className="">
        <h3 className="font-medium text-lg mt-6 pl-2 line-clamp-1">
          {note.title}
        </h3>
        {/* <div className="text-gray-800 dark:text-gray-200 line-clamp-3 text-sm">
          <MarkdownRenderer 
            content={contentPreview} 
            className="text-sm leading-relaxed" 
          />
        </div> */}
      </CardContent>

      <CardFooter className="flex items-center justify-between  dark:border-slate-700">
        <div className="flex items-center gap-2 text-sm font-normal leading-5 text-stone-400 dark:text-gray-400">
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
            className="h-8  px-3 text-xs bg-white cursor-pointer dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-600 rounded-[8px]"
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button
            onClick={handleDeleteNote}
            variant="outline"
            size="sm"
            className="h-8  px-3 text-xs bg-white  cursor-pointer dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-600 rounded-[8px]"
          >
            <Trash2 className="h-3 w-3 mr-1 text-red-500" />
            Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
