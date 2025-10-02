"use client";

import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, Calendar, FileText } from "lucide-react";
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

  // Truncate content for preview
  const getContentPreview = (content: string, maxLength: number = 120) => {
    if (!content) return "No content available";
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + "...";
  };

  return (
    <Card
      className="group h-[280px] w-full rounded-2xl border border-border bg-card hover:border-primary/20 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col"
      onClick={handleViewNote}
    >
      {/* Header Section */}
      <CardContent className="p-6 flex-1 flex flex-col">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 
              className="font-semibold text-lg leading-6 text-foreground mb-1 line-clamp-2"
              title={note.title}
            >
              {note.title}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {formatDate(
                  note.updatedAt instanceof Date
                    ? note.updatedAt.toISOString()
                    : note.updatedAt
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Content Preview */}
        <div className="flex-1">
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
            {getContentPreview(note.content || "")}
          </p>
        </div>
      </CardContent>

      {/* Footer Section - Always Visible Buttons */}
      <CardFooter className="p-6 pt-0 border-t border-border/50 mt-auto">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 bg-muted rounded-lg">
              Note
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleViewNote();
              }}
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
            >
              <Eye className="h-3 w-3 mr-1.5" />
              View
            </Button>
            <Button
              onClick={handleDeleteNote}
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all duration-200"
            >
              <Trash2 className="h-3 w-3 mr-1.5" />
              Delete
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
