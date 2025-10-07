"use client";

import React, { useState, useRef } from "react";
import { Note } from "@/lib/types";
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
  Maximize2,
  Save,
  X,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { MDXRenderer } from "@/components/mdx-renderer";
import { LexicalViewer } from "@/components/shared/LexicalViewer";
import { useNotes } from "@/hooks/use-notes";
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
  const { updateNote } = useNotes();

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
    if (note.content) {
      await navigator.clipboard.writeText(note.content);
      toast.success("Content copied to clipboard", {
        duration: 2000,
        position: "top-center",
      });
    }
  };

  const handleDownload = () => {
    if (note.content) {
      const element = document.createElement("a");
      const file = new Blob([note.content], { type: "text/markdown" });
      element.href = URL.createObjectURL(file);
      element.download = `${note.title || "note"}.md`;
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
      <div className="w-full mx-auto p-8">
        {/* Two Column Layout - Responsive Grid */}
        <div className={`grid grid-cols-1 gap-6 lg:gap-8 ${!isChatbotMinimized ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
          {/* Main Content - Takes 2/3 of the width on lg+ screens when chatbot is open, full width when minimized */}
          <div className={!isChatbotMinimized ? "lg:col-span-2" : "lg:col-span-1"}>
            {/* Main Content Card */}
            <Card className="rounded-3xl border-0 shadow-xl bg-card hover:shadow-2xl transition-all duration-300">
          {/* Header Section */}
          <CardHeader className="p-8 pb-6">
            <div className="space-y-6">
              {/* Title and Controls Row */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                <div className="flex-1 space-y-3">
                  <h1 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                    {note.title || "Untitled Note"}
                  </h1>
                  
                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {note.updatedAt 
                          ? formatDate(note.updatedAt) 
                          : formatDate(note.createdAt || new Date().toISOString())
                        }
                      </span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{getReadingTime(note.content || "")} min read</span>
                    </div>
                  </div>
                </div>

                {/* Controls Toolbar */}
                <div className="flex items-center gap-3">
                  {isEditMode ? (
                    /* Edit Mode Controls */
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleSaveNote}
                        disabled={!hasUnsavedChanges || isSaving}
                        className="rounded-xl px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
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
                        className="rounded-xl px-4 py-2 hover:bg-muted border-border hover:border-muted-foreground/20 transition-all duration-200"
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
                    <>
                      {/* Mode Toggle */}
                      <div className="hidden sm:flex items-center bg-muted rounded-2xl p-1">
                        <Button
                          variant={viewMode === 'preview' ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setViewMode('preview')}
                          className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                            viewMode === 'preview' 
                              ? "bg-primary text-primary-foreground shadow-md" 
                              : "hover:bg-background text-muted-foreground"
                          }`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                        <Button
                          variant={viewMode === 'edit' ? "default" : "ghost"}
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            enterEditMode();
                          }}
                          className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                            viewMode === 'edit' 
                              ? "bg-primary text-primary-foreground shadow-md" 
                              : "hover:bg-background text-muted-foreground"
                          }`}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopy}
                          className="rounded-xl px-4 py-2 hover:bg-primary/5 border-border hover:border-primary/20 transition-all duration-200"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownload}
                          className="rounded-xl px-4 py-2 hover:bg-secondary/5 border-border hover:border-secondary/20 transition-all duration-200"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>

                        {isChatbotMinimized && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsChatbotMinimized(false)}
                            className="rounded-xl px-4 py-2 hover:bg-primary/5 border-border hover:border-primary/20 transition-all duration-200"
                            title="Show AI Assistant"
                          >
                            <Bot className="h-4 w-4 mr-2" />
                            AI Chat
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>


          {/* Content Section */}
          <CardContent className="p-8 pt-8">
            <div className="min-h-[400px]">
              {viewMode === 'preview' && !isEditMode ? (
                <div className="prose-custom">
                  <MDXRenderer 
                    content={note.content || "# No Content\n\nThis note has no content yet."} 
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
            <CardContent className="p-8 pt-4">
            </CardContent>
          )}
        </Card>
          </div>

          {/* Chatbot Sidebar - Takes 1/3 of the width on lg+ screens */}
          <div className="lg:col-span-1">
            {!isChatbotMinimized ? (
              <Card className="rounded-3xl border-0 shadow-xl bg-card hover:shadow-2xl transition-all duration-300 fixed mr-[3.1vw]">
                <CardHeader className="p-6 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold">AI Assistant</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsChatbotMinimized(true)}
                      className="hover:bg-primary/10 rounded-full"
                      title="Minimize chatbot"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Ask questions about your note content
                  </p>
                </CardHeader>
                <CardContent className="p-0 pb-6">
                  <div className="h-[500px] lg:h-[600px] overflow-hidden">
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
