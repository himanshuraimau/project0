"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, FileText, Mic, Upload, Video, Globe, FolderInput, Folder, Share2 } from "lucide-react";
import { NotesNoteWithTranscript } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MoveToFolderDialog } from "@/components/folders/move-to-folder-dialog";
import { ShareLinkDialog } from "@/components/notes/share-link-dialog";
import { useFolders } from "@/hooks/use-folders";

interface NoteCardProps {
  note: NotesNoteWithTranscript;
  onUpdate?: () => void;
}

export function NoteCard({ note, onUpdate }: NoteCardProps) {
  const router = useRouter();
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const { folders, loading: foldersLoading, getFolders } = useFolders();
  const [folderName, setFolderName] = useState<string | null>(null);
  const [folderColor, setFolderColor] = useState<string | null>(null);

  // Fetch folders on mount
  useEffect(() => {
    getFolders();
  }, [getFolders]);

  // Get folder details if note has a folderId
  useEffect(() => {
    // Wait for folders to load
    if (foldersLoading) return;

    if (note.folderId) {
      const folder = folders.find((f) => f.id === note.folderId);
      if (folder) {
        setFolderName(folder.name);
        setFolderColor(folder.color || "#6366f1");
      } else {
        // folderId exists but folder not found - might be deleted
        setFolderName(null);
        setFolderColor(null);
      }
    } else {
      // No folderId - uncategorized note
      setFolderName(null);
      setFolderColor(null);
    }
  }, [note.folderId, folders, foldersLoading]);

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

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on menu
    if ((e.target as HTMLElement).closest(".note-menu")) {
      return;
    }
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
    <>
      <div 
        className="neomorphic w-full border-0 cursor-pointer rounded-2xl transition-all duration-300"
        onClick={handleCardClick}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            {/* Left section - Icon and Content */}
            <div className="flex items-center gap-6 flex-1 min-w-0">
              {/* Source Icon */}
              <div className="neomorphic flex-shrink-0 text-muted-foreground p-3 rounded-md">
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

            {/* Right section - Actions */}
            <div className="flex items-center gap-3">
              {/* Share Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowShareDialog(true);
                }}
                className="neomorphic-button flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </Button>

              {/* Move to Folder Button - More visible */}
            {folderName ? (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoveDialog(true);
                }}
                className="neomorphic-button flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
                style={{
                  borderColor: folderColor || undefined,
                  color: folderColor || undefined,
                }}
              >
                <Folder className="h-3.5 w-3.5" />
                {folderName}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoveDialog(true);
                }}
                className="neomorphic-button flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
              >
                <FolderInput className="h-3.5 w-3.5" />
                Move
              </Button>
            )}              {/* Chevron Button */}
              <div className="neomorphic-icon flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300">
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors duration-300" />
              </div>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Move to Folder Dialog */}
      <MoveToFolderDialog
        noteId={note.id}
        noteTitle={note.title}
        currentFolderId={note.folderId}
        open={showMoveDialog}
        onOpenChange={setShowMoveDialog}
        onSuccess={onUpdate}
      />

      {/* Share Link Dialog */}
      <ShareLinkDialog
        noteId={note.id}
        noteTitle={note.title}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />
    </>
  );
}