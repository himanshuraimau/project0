"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, FileText, User } from "lucide-react";
import { useRouter } from "next/navigation";

interface SharedNoteCardProps {
  note: {
    id: string;
    title: string;
    content: string;
    createdAt: string | Date;
    originalAuthor?: string | null;
    isCloned: boolean;
  };
}

export function SharedNoteCard({ note }: SharedNoteCardProps) {
  const router = useRouter();

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div 
      className="neomorphic w-full border-0 cursor-pointer rounded-2xl transition-all duration-300"
      onClick={() => router.push(`/notes/${note.id}`)}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          {/* Left section - Icon and Content */}
          <div className="flex items-center gap-6 flex-1 min-w-0">
            {/* Icon */}
            <div className="neomorphic shrink-0 text-muted-foreground p-3 rounded-md">
              <FileText className="h-7 w-7" />
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
              
              {/* Shared Badge */}
              {note.isCloned && (
                <div className="mb-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-accent/10 text-accent rounded-md">
                    <User className="h-3 w-3" />
                    Shared with me
                  </span>
                </div>
              )}

              {/* Date */}
              <span className="text-sm text-muted-foreground">
                {formatDate(note.createdAt)}
              </span>
            </div>
          </div>

          {/* Right section - Chevron */}
          <div className="flex items-center gap-3">
            <div className="neomorphic-icon flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300">
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  );
}
