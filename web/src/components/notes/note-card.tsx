"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Trash2 } from "lucide-react";
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

  const handleCardClick = () => {
    router.push(`/notes/${note.id}`);
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
    <Card 
      className="w-full bg-white dark:bg-white border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 cursor-pointer rounded-2xl"
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          {/* Left section - Title and Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 
              className="font-bold text-lg leading-tight text-slate-900 dark:text-slate-100 line-clamp-2 mb-2"
              title={note.title}
            >
              {note.title}
            </h3>
            
            {/* Date */}
            <div className="mb-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {formatDate(
                  note.updatedAt instanceof Date
                    ? note.updatedAt.toISOString()
                    : note.updatedAt
                )}
              </span>
            </div>

            {/* Content Preview */}
            <div className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
              {getTextPreview(note.content || "", 200)}
            </div>
          </div>

          {/* Right section - Action Buttons */}
          <div className="flex flex-col gap-3 flex-shrink-0 justify-center">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleViewNote();
              }}
              size="sm"
              className="h-8 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors duration-200 whitespace-nowrap"
            >
              <Eye className="h-3 w-3 mr-1.5" />
              View
            </Button>
            <Button
              onClick={handleDeleteNote}
              size="sm"
              variant="outline"
              className="h-8 px-4 rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 text-xs font-medium transition-colors duration-200 whitespace-nowrap"
            >
              <Trash2 className="h-3 w-3 mr-1.5" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
