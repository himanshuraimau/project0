"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Note, LanguageCode, NoteTranslation } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  FloppyDiskIcon,
  Cancel01Icon,
  Share07Icon,
  StarIcon,
  Loading01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { LexicalViewer } from "@/components/shared/LexicalViewer";
import { useNotes } from "@/hooks/use-notes";
import { useTranslations } from "@/hooks/use-translations";
import { LanguageSelector } from "@/components/notes/language-selector";
import { ShareLinkDialog } from "@/components/notes/share-link-dialog";
import { cn } from "@/lib/utils";

interface ViewNoteProps {
  note: Note;
  onEdit?: () => void;
  onSave?: (content: string) => void;
  onUpdate?: (updatedNote: Note) => void;
  initialViewMode?: "preview" | "edit";
}

export function ViewNote({
  note,
  onSave,
  onUpdate,
  initialViewMode = "preview",
}: ViewNoteProps) {
  const [viewMode, setViewMode] = useState<"preview" | "edit">(initialViewMode);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editedContent, setEditedContent] = useState(note.content || "");
  const [editedTitle, setEditedTitle] = useState(note.title || "");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Translation state
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode | "en">(
    "en"
  );
  const [currentTranslation, setCurrentTranslation] =
    useState<NoteTranslation | null>(null);
  const [availableTranslations, setAvailableTranslations] = useState<
    LanguageCode[]
  >([]);
  const [translationsLoaded, setTranslationsLoaded] = useState(false);

  const { updateNote } = useNotes();
  const { getTranslation } = useTranslations();

  // Load available translations only when needed
  const loadAvailableTranslations = async () => {
    if (translationsLoaded) return;

    const languages: LanguageCode[] = ["es", "fr", "de", "zh", "hi"];
    const available: LanguageCode[] = [];

    // Use Promise.allSettled to fetch all translations in parallel instead of sequentially
    const results = await Promise.allSettled(
      languages.map((lang) => getTranslation(note.id, lang))
    );

    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value) {
        available.push(languages[index]);
      }
    });

    setAvailableTranslations(available);
    setTranslationsLoaded(true);
  };

  // Load translation when language changes
  useEffect(() => {
    const loadTranslation = async () => {
      if (currentLanguage === "en") {
        setCurrentTranslation(null);
        return;
      }

      const translation = await getTranslation(note.id, currentLanguage);
      if (translation) {
        setCurrentTranslation(translation);
      }
    };

    loadTranslation();
  }, [currentLanguage, note.id]); // Remove getTranslation from dependencies

  const handleLanguageChange = (language: LanguageCode | "en") => {
    setCurrentLanguage(language);
    if (language !== "en" && !availableTranslations.includes(language)) {
      setAvailableTranslations([...availableTranslations, language]);
    }
  };

  // Get current content based on language
  const getCurrentTitle = () => {
    return currentLanguage === "en"
      ? note.title
      : currentTranslation?.title || note.title;
  };

  const getCurrentContent = () => {
    return currentLanguage === "en"
      ? note.content
      : currentTranslation?.content || note.content;
  };

  const handleSaveNote = async () => {
    if (!hasUnsavedChanges || isSaving) return;

    setIsSaving(true);
    try {
      const updatedNote = await updateNote(note.id, {
        title: editedTitle,
        content: editedContent,
      });

      if (updatedNote) {
        setHasUnsavedChanges(false);
        setIsEditMode(false);
        setViewMode("preview");
        onUpdate?.(updatedNote);
        toast.success("Note saved successfully", {
          duration: 2000,
          position: "top-center",
        });
      } else {
        throw new Error("Failed to update note");
      }
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note", {
        duration: 3000,
        position: "top-center",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      setShowCancelDialog(true);
      return;
    }

    setEditedContent(note.content || "");
    setEditedTitle(note.title || "");
    setHasUnsavedChanges(false);
    setIsEditMode(false);
    setViewMode("preview");
  };

  const confirmCancelEdit = () => {
    setEditedContent(note.content || "");
    setEditedTitle(note.title || "");
    setHasUnsavedChanges(false);
    setIsEditMode(false);
    setViewMode("preview");
    setShowCancelDialog(false);
  };

  const handleContentChange = (content: string) => {
    setEditedContent(content);
    setHasUnsavedChanges(true);
  };

  const handleTitleChange = (title: string) => {
    setEditedTitle(title);
    setHasUnsavedChanges(true);
  };

  const enterEditMode = () => {
    // Prevent any scrolling behavior
    const currentScrollPosition = window.scrollY;
    setIsEditMode(true);
    setViewMode("edit");
    // Restore scroll position after state update
    requestAnimationFrame(() => {
      window.scrollTo(0, currentScrollPosition);
    });
  };

  const handleCopy = async () => {
    const contentToCopy = getCurrentContent();
    if (contentToCopy) {
      await navigator.clipboard.writeText(contentToCopy);
      toast.success("Content copied to clipboard", {
        duration: 2000,
        position: "top-center",
      });
    }
  };

  const handleDownload = () => {
    const contentToDownload = getCurrentContent();
    const titleToUse = getCurrentTitle();
    if (contentToDownload) {
      const element = document.createElement("a");
      const file = new Blob([contentToDownload], { type: "text/markdown" });
      element.href = URL.createObjectURL(file);
      element.download = `${titleToUse || "note"}.md`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success("Note downloaded successfully", {
        duration: 2000,
        position: "top-center",
      });
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getWordCount = (content: string) => {
    return content.trim().split(/\s+/).length;
  };

  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = getWordCount(content);
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes;
  };

  const [isFavorite, setIsFavorite] = useState(false);

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? "Removed from favorites" : "Added to favorites");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-sidebar backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-[16.5px]">
          <div className="flex items-center justify-between gap-4">
            <Link
              href={`/notes/${note.id}`}
              className="flex items-center gap-2 cursor-pointer font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
              <span>Back to note</span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {hasUnsavedChanges && (
                <span className="hidden sm:inline text-amber-600 dark:text-amber-400 font-medium">
                  Unsaved
                </span>
              )}
              <Button
                onClick={handleCancelEdit}
                variant="outline"
                size="sm"
                className="h-[36px] cursor-pointer rounded-lg text-[15px] border-border text-muted-foreground hover:text-foreground shrink-0"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-5 sm:mr-1" />
                <span className="hidden sm:inline">Cancel</span>
              </Button>
              <Button
                onClick={handleSaveNote}
                disabled={!hasUnsavedChanges || isSaving}
                size="sm"
                className="h-[36px] cursor-pointer text-[15px] rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 gap-1.5"
              >
                {isSaving ? (
                  <>
                    <HugeiconsIcon
                      icon={Loading01Icon}
                      className="size-5 animate-spin"
                    />
                    <span>Saving…</span>
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={FloppyDiskIcon} className="size-5" />
                    <span>Save</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Editable title */}
          {/* <Input
            value={editedTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Note title"
            className="mt-4 text-xl sm:text-2xl font-semibold tracking-tight border-0 px-0 h-auto min-h-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
          /> */}
        </div>
      </header>

      {/* Editor */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="rounded-md border border-border/50 bg-card overflow-hidden shadow-sm">
          <div className="min-h-[520px]">
            <LexicalViewer
              content={editedContent}
              title={editedTitle}
              showToolbar={true}
              minHeight="520px"
              onContentChange={handleContentChange}
              onTitleChange={handleTitleChange}
              isEditable={true}
            />
          </div>
        </div>

        {/* Footer / meta & actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 py-4 border-t border-border/60">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-1.5 py-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowShareDialog(true)}
              className="h-8 rounded-full border-border bg-background/80 text-xs font-medium text-foreground hover:bg-muted px-3 gap-1.5"
            >
              <HugeiconsIcon icon={Share07Icon} className="size-3.5" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <span className="h-4 w-px bg-border/60" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleFavorite}
              className={cn(
                "h-8 rounded-full border-border text-xs font-medium px-3 gap-1.5",
                isFavorite
                  ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-500/50"
                  : "bg-background/80 text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <HugeiconsIcon
                icon={StarIcon}
                className={cn("size-3.5", isFavorite && "fill-current")}
              />
              <span className="hidden sm:inline">
                {isFavorite ? "Saved" : "Favorite"}
              </span>
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span>
              {getWordCount(editedContent || "")} words · ~
              {getReadingTime(editedContent || "")} min read
            </span>
            <span className="hidden sm:inline">·</span>
            <span>
              Last edited {formatDate(note.updatedAt || note.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Custom Prose Styling */}
      <style jsx global>{`
        .prose-custom {
          @apply max-w-none;
        }

        .prose-custom h1 {
          @apply text-3xl lg:text-4xl font-bold text-foreground mt-8 mb-6 pb-3 border-b-2 border-border first:mt-0;
        }

        .prose-custom h2 {
          @apply text-2xl lg:text-3xl font-bold text-foreground mt-8 mb-4 pb-2 border-b border-border;
        }

        .prose-custom h3 {
          @apply text-xl lg:text-2xl font-semibold text-muted-foreground mt-6 mb-3;
        }

        .prose-custom h4 {
          @apply text-lg lg:text-xl font-semibold text-muted-foreground mt-5 mb-3;
        }

        .prose-custom h5 {
          @apply text-base lg:text-lg font-semibold text-muted-foreground mt-4 mb-2;
        }

        .prose-custom h6 {
          @apply text-sm lg:text-base font-semibold text-muted-foreground mt-4 mb-2;
        }

        .prose-custom p {
          @apply mb-6 leading-relaxed text-foreground text-base lg:text-lg;
        }

        .prose-custom ul {
          @apply list-disc ml-6 mb-6 space-y-3;
        }

        .prose-custom ol {
          @apply list-decimal ml-6 mb-6 space-y-3;
        }

        .prose-custom li {
          @apply text-foreground leading-relaxed;
        }

        .prose-custom blockquote {
          @apply border-l-4 border-accent pl-6 py-4 my-8 bg-accent/5 rounded-r-2xl italic text-muted-foreground font-medium;
        }

        .prose-custom code {
          @apply bg-muted px-3 py-1.5 rounded-lg text-sm font-mono text-foreground font-medium border border-border/50;
        }

        .prose-custom pre {
          @apply bg-muted p-6 rounded-2xl mb-8 overflow-x-auto text-sm border border-border/50 relative;
        }

        .prose-custom pre code {
          @apply bg-transparent p-0 border-0 rounded-none;
        }

        .prose-custom strong {
          @apply font-bold text-foreground;
        }

        .prose-custom em {
          @apply italic text-muted-foreground;
        }

        .prose-custom a {
          @apply text-primary hover:text-primary/80 underline underline-offset-2 transition-colors font-medium;
        }

        .prose-custom hr {
          @apply my-12 border-border;
        }

        .prose-custom table {
          @apply w-full border border-border rounded-2xl overflow-hidden my-8;
        }

        .prose-custom th {
          @apply px-6 py-4 bg-muted text-left font-semibold text-foreground border-b border-border;
        }

        .prose-custom td {
          @apply px-6 py-4 text-foreground border-b border-border last:border-b-0;
        }

        .prose-custom tr:hover {
          @apply bg-muted/30 transition-colors;
        }
      `}</style>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md rounded-xl border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-foreground">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  className="size-5 text-destructive"
                />
              </div>
              <span>Discard changes?</span>
            </DialogTitle>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              You have unsaved edits. Leaving now will permanently discard them.
            </p>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              className="rounded-lg font-medium"
            >
              Keep editing
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancelEdit}
              className="rounded-lg font-medium"
            >
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Link Dialog */}
      <ShareLinkDialog
        noteId={note.id}
        noteTitle={note.title}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />
    </div>
  );
}
