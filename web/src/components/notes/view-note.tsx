"use client";

import React, { useState, useEffect } from "react";
import { Note, LanguageCode, NoteTranslation } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Save,
  X,
  Share2,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { LexicalViewer } from "@/components/shared/LexicalViewer";
import { useNotes } from "@/hooks/use-notes";
import { useTranslations } from "@/hooks/use-translations";
import { LanguageSelector } from "@/components/notes/language-selector";
import { ShareLinkDialog } from "@/components/notes/share-link-dialog";

interface ViewNoteProps {
  note: Note;
  onEdit?: () => void;
  onSave?: (content: string) => void;
  onUpdate?: (updatedNote: Note) => void;
  initialViewMode?: "preview" | "edit";
}

export function ViewNote({ note, onSave, onUpdate, initialViewMode = "preview" }: ViewNoteProps) {
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
    <div className="min-h-screen px-20 py-6">
      {/* Header Section */}
      <div className="pb-6 mb-6 border-b border-transparent" style={{
        boxShadow: '0 1px 0 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
      }}>
        {/* Breadcrumb with Actions */}
        <nav className="mb-4">
          <div className="flex items-center justify-between">
            <ol className="flex items-center space-x-2 text-[19px] font-normal text-muted-foreground">
              <li>
                <button
                  onClick={() => window.history.back()}
                  className="hover:text-foreground transition-colors"
                >
                  Notes
                </button>
              </li>
              <li>
                <span className="mx-2">&gt;</span>
              </li>
              <li className="text-foreground font-medium">
                Edit Note
              </li>
            </ol>

            {/* Share and Star Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShareDialog(true)}
                className="gap-2 rounded-none"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorite}
                className="text-yellow-500 hover:text-yellow-600 rounded-none"
              >
                <Star
                  className="h-5 w-5"
                  fill={isFavorite ? "currentColor" : "none"}
                />
              </Button>
            </div>
          </div>
        </nav>

        {/* Title */}
        <div>
          <div className="text-2xl text-purple-800 pb-2">{isEditMode ? 'Editing:' : 'Note:'}</div>
          <h1 className="text-[19px] font-bold text-foreground leading-tight">
            {getCurrentTitle() || "Untitled Note"}
          </h1>
        </div>
      </div>

      <div className="w-full">
        <div className="w-full">
          {/* Main Content */}
          <div className="w-full">
            {/* Main Content Card */}
            <Card className="rounded-3xl border-0 bg-card hover: transition-all duration-300">
              {/* Header Section - Only show save controls in edit mode */}
              <CardHeader className="">
                <div className="space-y-4">
                  {/* Save Controls - Only in Edit Mode */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleSaveNote}
                      disabled={!hasUnsavedChanges || isSaving}
                      className="rounded-xl px-4 py-2 bg-primary hover:bg-primary/90 text-white dark:text-black transition-all duration-200 cursor-pointer"
                      size="sm"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      size="sm"
                      className="rounded-xl px-4 py-2 hover:bg-muted hover:text-foreground border-border hover:border-muted-foreground/20 transition-all duration-200 cursor-pointer"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    {hasUnsavedChanges && (
                      <Badge
                        variant="outline"
                        className="text-destructive border-destructive/30 bg-destructive/5"
                      >
                        Unsaved changes
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Content Section */}
              <CardContent className="p-4 sm:p-6 lg:p-8 pt-4 sm:pt-6 lg:pt-8">
                <div className="min-h-[400px]">
                  <div className="bg-background rounded-2xl border border-border/50">
                    <div className="px-4 pb-4 pt-4">
                      <LexicalViewer
                        content={editedContent}
                        title={editedTitle}
                        showToolbar={true}
                        minHeight="500px"
                        onContentChange={handleContentChange}
                        onTitleChange={handleTitleChange}
                        isEditable={true}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <div className="p-2 bg-destructive/10 rounded-full">
                <X className="h-4 w-4 text-destructive" />
              </div>
              Discard Changes?
            </DialogTitle>
            <div className="space-y-3 mt-4 text-base text-muted-foreground/80 leading-relaxed">
              <div>You have unsaved changes to your note.</div>
              <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                <div className="text-sm text-destructive font-medium">
                  If you cancel now, all your changes will be lost and cannot be
                  recovered.
                </div>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              className="font-medium"
            >
              Keep Editing
            </Button>
            <Button
              onClick={confirmCancelEdit}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium"
            >
              Discard Changes
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
