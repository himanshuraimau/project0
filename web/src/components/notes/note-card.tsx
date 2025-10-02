"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Trash2 } from "lucide-react";
import { Note } from "@/lib/types";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MarkdownRenderer } from "@/components/mdx-renderer";

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
}

export function NoteCard({ note, onDelete }: NoteCardProps) {
  const router = useRouter();
  const [showPreview, setShowPreview] = useState(false);

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

  const handlePreviewNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPreview(true);
  };

  const handleDeleteNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(note.id);
  };

  // Get plain text preview from markdown content
  const getTextPreview = (content: string, maxLength: number = 150) => {
    if (!content) return "No content available";
    
    // Remove markdown formatting for preview
    const plainText = content
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
    
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength).trim() + "...";
  };

  return (
    <>
      <Card className="h-[320px] w-full bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col">
        <CardContent className="p-6 flex flex-col h-full">
          {/* Title - Centered and Bold */}
          <div className="text-center mb-3">
            <h3 
              className="font-bold text-lg leading-tight text-slate-900 dark:text-slate-100 line-clamp-2 min-h-[3.5rem] flex items-center justify-center"
              title={note.title}
            >
              {note.title}
            </h3>
          </div>

          {/* Date - Centered and Muted */}
          <div className="text-center mb-4">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {formatDate(
                note.updatedAt instanceof Date
                  ? note.updatedAt.toISOString()
                  : note.updatedAt
              )}
            </span>
          </div>

          {/* Content Preview - Rendered Markdown (truncated) */}
          <div className="flex-1 mb-4 overflow-hidden min-h-[4.5rem]">
            <div className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed">
              {getTextPreview(note.content || "")}
            </div>
          </div>

          {/* Fixed Action Buttons */}
          <div className="flex gap-2 justify-center mt-auto">
            <Button
              onClick={handlePreviewNote}
              size="sm"
              className="h-8 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors duration-200"
            >
              <Eye className="h-3 w-3 mr-1.5" />
              View
            </Button>
            <Button
              onClick={handleDeleteNote}
              size="sm"
              variant="outline"
              className="h-8 px-4 rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 text-xs font-medium transition-colors duration-200"
            >
              <Trash2 className="h-3 w-3 mr-1.5" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Full Content Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{note.title}</DialogTitle>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Created: {formatDate(
                  note.updatedAt instanceof Date
                    ? note.updatedAt.toISOString()
                    : note.updatedAt
                )}
              </span>
              <Button
                onClick={handleViewNote}
                size="sm"
                className="ml-4"
              >
                Open Full Note
              </Button>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] pt-4">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <MarkdownRenderer content={note.content || "No content available"} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
