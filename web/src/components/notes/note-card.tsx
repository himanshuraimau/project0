"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { Note } from "@/lib/types";
import { useRouter } from "next/navigation";

interface NoteCardProps {
  note: Note;
}

export function NoteCard({ note }: NoteCardProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
      className="w-full bg-white dark:bg-background dark:hover:bg-muted/50 border border-muted hover:border-border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer rounded-2xl"
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          {/* Left section - Title and Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 
              className="font-bold text-lg leading-tight text-foreground line-clamp-2 mb-2"
              title={note.title}
            >
              {note.title}
            </h3>
            
            {/* Date */}
            <div className="mb-3">
              <span className="text-sm text-muted-foreground">
                {formatDate(
                  note.updatedAt instanceof Date
                    ? note.updatedAt.toISOString()
                    : note.updatedAt
                )}
              </span>
            </div>

            {/* Content Preview */}
            <div className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {getTextPreview(note.content || "", 130)}
            </div>
          </div>

          {/* Right section - Chevron Button */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 hover:bg-muted/50 group">
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
