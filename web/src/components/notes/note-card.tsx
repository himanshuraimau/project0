"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronRight,
  FileText,
  Mic,
  Upload,
  Video,
  Globe,
  FolderInput,
  Folder,
  Share2,
} from "lucide-react";
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
    if (!note.transcript?.type) return <FileText className="size-5" />;

    switch (note.transcript.type) {
      case "pdf":
        return <FileText className="size-5" />;
      case "audio":
        // Distinguish between record and upload audio based on originalName
        if (note.transcript?.originalName?.includes("recorded")) {
          return <Mic className="size-5" />;
        } else {
          return <Upload className="size-5" />;
        }
      case "youtube":
        return <Video className="size-5" />;
      case "webpage":
        return <Globe className="size-5" />;
      default:
        return <FileText className="size-5" />;
    }
  };

  // Get background style based on note type
  const getIconBackgroundStyle = () => {
    if (!note.transcript?.type) {
      // Default gradient for unknown types
      return "gradient-element";
    }

    switch (note.transcript.type) {
      case "pdf":
        return "bluw-gradient-element";
      case "audio":
        return "bluw-gradient-element";
      default:
        return "gradient-element";
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
      .replace(/#{1,6}\s+/g, "") // Remove headers
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
      .replace(/\*(.*?)\*/g, "$1") // Remove italic
      .replace(/`(.*?)`/g, "$1") // Remove inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links, keep text
      .replace(/\n+/g, " ") // Replace newlines with spaces
      .trim();

    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength).trim() + "...";
  };

  return (
    <>
      <div
        className="border bg-[#F1F1F1] dark:bg-[#1A1A1A] dark:border-[#1f1f1f] border-[#E3E3E3] w-full cursor-pointer rounded-2xl transition-all duration-300"
        onClick={handleCardClick}
      >
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-3">
            {/* Left section - Icon and Content */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Source Icon */}
              <div
                className={`${getIconBackgroundStyle()} text-white p-4 shrink-0 rounded-[14px]`}
              >
                {getSourceIcon()}
              </div>

              {/* Title and Info */}
              <div className="flex-1 ">
                {/* Title */}
                <h3
                  className="font-medium mb-1 text-lg leading-tight text-foreground line-clamp-2 "
                  title={note.title}
                >
                  {note.title}
                </h3>

                <div className="">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
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

            <div className="flex items-center gap-3">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowShareDialog(true);
                }}
                className="bg-white cursor-pointer border-neutral-200 text-neutral-600 flex items-center dark:text-neutral-400 dark:bg-neutral-800 border font-normal dark:border-neutral-800/50 gap-1.5 px-3 py-1.5"
              >
                <Share2 size={10} />
                Share
              </Button>
              {folderName ? (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMoveDialog(true);
                  }}
                  className="bg-white cursor-pointer border-neutral-200 text-neutral-600 flex items-center dark:text-neutral-400 dark:bg-neutral-800 border font-normal dark:border-neutral-800/50 gap-1.5 px-3 py-1.5"
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
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMoveDialog(true);
                  }}
                  className="bg-white cursor-pointer border-neutral-200 text-neutral-600 flex items-center dark:text-neutral-400 dark:bg-neutral-800 border font-normal dark:border-neutral-800/50 gap-1.5 px-3 py-1.5"
                >
                  <FolderInput size={12} />
                  Move
                </Button>
              )}{" "}
              {/* Chevron Button */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300">
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
