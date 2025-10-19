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
  Copy, 
  Download, 
  Edit, 
  Eye, 
  Calendar,
  FileText,
  Bot,
  Minimize2,
  Save,
  X
} from "lucide-react";
import { toast } from "sonner";
import { MDXRenderer } from "@/components/mdx-renderer";
import { LexicalViewer } from "@/components/shared/LexicalViewer";
import { useNotes } from "@/hooks/use-notes";
import { useTranslations } from "@/hooks/use-translations";
import { LanguageSelector } from "@/components/notes/language-selector";
import dynamic from "next/dynamic";

const DynamicInlineChatbot = dynamic(
  () => import("@/components/chatbot/inline-chatbot"),
  { ssr: false }
);

interface ViewNoteProps {
  note: Note;
  onEdit?: () => void;
  onSave?: (content: string) => void;
  onUpdate?: (updatedNote: Note) => void;
}

export function ViewNote({ note, onSave, onUpdate }: ViewNoteProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  const [isChatbotMinimized, setIsChatbotMinimized] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editedContent, setEditedContent] = useState(note.content || "");
  const [editedTitle, setEditedTitle] = useState(note.title || "");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  // Translation state
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode | 'en'>('en');
  const [currentTranslation, setCurrentTranslation] = useState<NoteTranslation | null>(null);
  const [availableTranslations, setAvailableTranslations] = useState<LanguageCode[]>([]);
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  
  const { updateNote } = useNotes();
  const { getTranslation } = useTranslations();

  // Load available translations only when needed
  const loadAvailableTranslations = async () => {
    if (translationsLoaded) return;

    const languages: LanguageCode[] = ['es', 'fr', 'de', 'zh', 'hi'];
    const available: LanguageCode[] = [];

    // Use Promise.allSettled to fetch all translations in parallel instead of sequentially
    const results = await Promise.allSettled(
      languages.map(lang => getTranslation(note.id, lang))
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        available.push(languages[index]);
      }
    });

    setAvailableTranslations(available);
    setTranslationsLoaded(true);
  };

  // Load translation when language changes
  useEffect(() => {
    const loadTranslation = async () => {
      if (currentLanguage === 'en') {
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

  const handleLanguageChange = (language: LanguageCode | 'en') => {
    setCurrentLanguage(language);
    if (language !== 'en' && !availableTranslations.includes(language)) {
      setAvailableTranslations([...availableTranslations, language]);
    }
  };

  // Get current content based on language
  const getCurrentTitle = () => {
    return currentLanguage === 'en' ? note.title : (currentTranslation?.title || note.title);
  };

  const getCurrentContent = () => {
    return currentLanguage === 'en' ? note.content : (currentTranslation?.content || note.content);
  };

  const handleSaveNote = async () => {
    if (!hasUnsavedChanges || isSaving) return;

    setIsSaving(true);
    try {
      const updatedNote = await updateNote(note.id, {
        title: editedTitle,
        content: editedContent
      });

      if (updatedNote) {
        setHasUnsavedChanges(false);
        setIsEditMode(false);
        setViewMode('preview');
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
    setViewMode('preview');
  };

  const confirmCancelEdit = () => {
    setEditedContent(note.content || "");
    setEditedTitle(note.title || "");
    setHasUnsavedChanges(false);
    setIsEditMode(false);
    setViewMode('preview');
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
    setViewMode('edit');
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
  return (
    <div className="min-h-screen bg-background">
      <div className="w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Two Column Layout - Responsive Grid */}
        <div className={`grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 ${!isChatbotMinimized ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
          {/* Main Content - Takes 2/3 of the width on lg+ screens when chatbot is open, full width when minimized */}
          <div className={!isChatbotMinimized ? "lg:col-span-2" : "lg:col-span-1"}>
            {/* Main Content Card */}
            <Card className="rounded-3xl border-0  bg-card hover: transition-all duration-300">
          {/* Header Section */}
          <CardHeader className="p-4 sm:p-6 lg:p-8 pb-4 lg:pb-6">
            <div className="space-y-4 sm:space-y-6">
              {/* Title and Controls Row */}
              <div className="flex flex-col gap-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight flex-1">
                      {getCurrentTitle() || "Untitled Note"}
                    </h1>
                    {currentLanguage !== 'en' && (
                      <Badge variant="secondary" className="mt-1 shrink-0">
                        Translated
                      </Badge>
                    )}
                  </div>
                  
                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="truncate">
                        {note.updatedAt 
                          ? formatDate(note.updatedAt) 
                          : formatDate(note.createdAt || new Date().toISOString())
                        }
                      </span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{getReadingTime(getCurrentContent() || "")} min read</span>
                    </div>
                  </div>
                </div>

                {/* Controls Toolbar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {isEditMode ? (
                    /* Edit Mode Controls */
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleSaveNote}
                        disabled={!hasUnsavedChanges || isSaving}
                        className="rounded-xl px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 cursor-pointer"
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
                            Save
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
                        <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/5">
                          Unsaved changes
                        </Badge>
                      )}
                    </div>
                  ) : (
                    /* View Mode Controls */
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
                      {/* Mode Toggle */}
                      <div className="flex items-center bg-muted rounded-2xl p-1 shrink-0">
                        <Button
                          variant={viewMode === 'preview' ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setViewMode('preview')}
                          className={`rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer ${
                            viewMode === 'preview' 
                              ? "bg-primary text-primary-foreground " 
                              : "hover:bg-background text-foreground hover:text-foreground"
                          }`}
                        >
                          <Eye className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Preview</span>
                        </Button>
                        <Button
                          variant={viewMode === 'edit' ? "default" : "ghost"}
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            enterEditMode();
                          }}
                          className={`rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer ${
                            viewMode === 'edit' 
                              ? "bg-primary text-primary-foreground " 
                              : "hover:bg-background text-foreground hover:text-foreground"
                          }`}
                        >
                          <Edit className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 flex-1">
                        <LanguageSelector
                          noteId={note.id}
                          currentLanguage={currentLanguage}
                          onLanguageChange={handleLanguageChange}
                          availableTranslations={availableTranslations}
                          onDropdownOpen={loadAvailableTranslations}
                        />
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopy}
                          className="rounded-xl px-3 py-2 hover:bg-primary/5 hover:text-foreground border-border hover:border-primary/20 transition-all duration-200 cursor-pointer shrink-0"
                        >
                          <Copy className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Copy</span>
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownload}
                          className="rounded-xl px-3 py-2 hover:bg-secondary/5 hover:text-foreground border-border hover:border-secondary/20 transition-all duration-200 cursor-pointer shrink-0"
                        >
                          <Download className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Download</span>
                        </Button>

                        {isChatbotMinimized && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsChatbotMinimized(false)}
                            className="rounded-xl px-3 py-2 hover:bg-primary/5 hover:text-foreground border-border hover:border-primary/20 transition-all duration-200 cursor-pointer shrink-0"
                            title="Show AI Assistant"
                          >
                            <Bot className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">AI Chat</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>


          {/* Content Section */}
          <CardContent className="p-4 sm:p-6 lg:p-8 pt-4 sm:pt-6 lg:pt-8">
            <div className="min-h-[400px]">
              {viewMode === 'preview' && !isEditMode ? (
                <div className="prose-custom">
                  <MDXRenderer 
                    content={getCurrentContent() || "# No Content\n\nThis note has no content yet."} 
                    className="leading-relaxed"
                  />
                </div>
              ) : (
                <div className="bg-background rounded-2xl border border-border/50">
                  <div className="flex items-center justify-between mb-4 p-4 pb-2">
                    <h3 className="text-lg font-semibold text-foreground">Edit Note</h3>
                    <Badge variant="outline" className="rounded-full text-xs">
                      Editor
                    </Badge>
                  </div>
                  <div className="px-4 pb-4">
                    <LexicalViewer
                      content={editedContent}
                      title={editedTitle}
                      showToolbar={true}
                      minHeight="400px"
                      onContentChange={handleContentChange}
                      onTitleChange={handleTitleChange}
                      isEditable={true}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          {/* Completion Section */}
          {!isEditMode && (
            <CardContent className="p-4 sm:p-6 lg:p-8 pt-2 sm:pt-3 lg:pt-4">
            </CardContent>
          )}
        </Card>
          </div>

          {/* Chatbot Sidebar - Takes 1/3 of the width on lg+ screens */}
          <div className="lg:col-span-1">
            {!isChatbotMinimized ? (
              <Card className="rounded-3xl border-0 bg-card hover: transition-all duration-300 sticky top-4">
                <CardHeader className="p-4 sm:p-6 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold">AI Assistant</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsChatbotMinimized(true)}
                      className="hover:bg-primary/10 rounded-full shrink-0"
                      title="Minimize chatbot"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Ask questions about your note content
                  </p>
                </CardHeader>
                <CardContent className="p-0 pb-4 sm:pb-6">
                  <div className="h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden">
                    <DynamicInlineChatbot 
                      noteId={note.id} 
                      className="h-full"
                    />
                  </div>
                </CardContent>
              </Card>
            ) : null}
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
                  If you cancel now, all your changes will be lost and cannot be recovered.
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
    </div>
  );
}
