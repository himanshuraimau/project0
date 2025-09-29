"use client";

import React, { useState } from "react";
import { Note } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Copy, 
  Download, 
  Edit, 
  Eye, 
  Calendar,
  FileText,
  MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";
import { MDXRenderer } from "@/components/mdx-renderer";
import { LexicalViewer } from "@/components/shared/LexicalViewer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ViewNoteProps {
  note: Note;
  onEdit?: () => void;
  onSave?: (content: string) => void;
}

export function ViewNote({ note, onSave }: ViewNoteProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');

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
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-5xl mx-auto p-8">
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
                      <span>{getWordCount(note.content || "")} words</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-2">
                      <span>{getReadingTime(note.content || "")} min read</span>
                    </div>
                  </div>
                </div>

                {/* Controls Toolbar */}
                <div className="flex items-center gap-3">
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
                      onClick={() => setViewMode('edit')}
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

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="rounded-xl px-3 py-2 hover:bg-accent/5 border-border hover:border-accent/20 transition-all duration-200"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={() => setViewMode('preview')}>
                          <Eye className="h-4 w-4 mr-2" />
                          Show Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setViewMode('edit')}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Mode
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <Badge 
                  variant="secondary" 
                  className="bg-primary/10 text-primary border-primary/20 rounded-full px-4 py-1 text-sm font-medium"
                >
                  <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                  Published
                </Badge>
              </div>
            </div>
          </CardHeader>

          <Separator className="mx-8" />

          {/* Content Section */}
          <CardContent className="p-8 pt-8">
            <div className="min-h-[400px]">
              {viewMode === 'preview' ? (
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
                      content={note.content || ""}
                      title={note.title || ""}
                      showToolbar={true}
                      minHeight="400px"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
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
    </div>
  );
}
