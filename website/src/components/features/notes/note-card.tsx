"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, FileText, Mic, Upload, Video, Globe } from "lucide-react";
import { NotesNoteWithTranscript } from "@/lib/types";
import { useRouter } from "next/navigation";

interface NoteCardProps {
  note: NotesNoteWithTranscript;
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

  const getSourceIcon = () => {
    if (!note.transcript?.type) return <FileText className="h-7 w-7" />;
    
    switch (note.transcript.type) {
      case "pdf":
        return <FileText className="h-7 w-7" />;
      case "audio":
        // Distinguish between record and upload audio based on originalName
        if (note.transcript?.originalName?.includes("recorded")) {
          return <Mic className="h-7 w-7" />;
        } else {
          return <Upload className="h-7 w-7" />;
        }
      case "youtube":
        return <Video className="h-7 w-7" />;
      case "webpage":
        return <Globe className="h-7 w-7" />;
      default:
        return <FileText className="h-7 w-7" />;
    }
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
    <div 
      className="neomorphic w-full border-0 cursor-pointer rounded-2xl transition-all duration-300"
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          {/* Left section - Icon and Content */}
          <div className="flex items-center gap-6 flex-1 min-w-0">
            {/* Source Icon */}
            <div className="neomorphic shrink-0 text-muted-foreground p-3 rounded-md">
              {getSourceIcon()}
            </div>
            
            {/* Title and Info */}
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

              {/* Content Preview
              <div className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {getTextPreview(note.content || "", 130)}
              </div> */}
            </div>
          </div>

          {/* Right section - Chevron Button */}
          <div className="neomorphic-icon flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300">
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors duration-300" />
          </div>
        </div>
      </CardContent>
    </div>
  );
}