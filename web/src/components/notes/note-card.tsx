"use client";

import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, Calendar } from "lucide-react";
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
      className="group rounded-2xl p-6 hover:shadow-xl transition-all duration-300 cursor-pointer bg-card border border-border hover:border-primary/20"
      onClick={handleViewNote}
    >
      <CardContent className="">
        <h3 className="font-semibold text-lg text-card-foreground line-clamp-2 mb-2">{note.title}</h3>
      </CardContent>

      <CardFooter className="flex items-center justify-between pl-2">
        <div className="flex items-center gap-2 text-sm font-normal leading-5 text-muted-foreground">
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
            className="h-8 px-3 text-xs cursor-pointer border-border bg-muted/50 hover:bg-muted rounded-xl"
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button
            onClick={handleDeleteNote}
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs cursor-pointer border-border bg-muted/50 hover:bg-destructive/10 rounded-xl"
          >
            <Trash2 className="h-3 w-3 mr-1 text-destructive" />
            Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
