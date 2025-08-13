'use client';

import React, { useState, useEffect } from 'react';
import { useNotes, ProcessPDFResult } from '@/hooks/use-notes';

// Extended interface to include model overload case
interface NoteWithModelOverload {
  error: string;
  message: string;
  modelOverloaded: boolean;
  retryAfter?: number;
  retryable?: boolean;
}
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { checkCreditsAndRedirect } from '@/lib/client/credits-api';

interface SimplePDFProcessorProps {
  onProcessComplete?: (result: ProcessPDFResult) => void;
  onClose?: () => void;
}

export function SimplePDFProcessor({ onProcessComplete, onClose }: SimplePDFProcessorProps) {
  const { processPDFWithNotes, loading, error } = useNotes();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [processResult, setProcessResult] = useState<ProcessPDFResult | null>(null);
  
  // We don't need to check credits on mount since the parent component already checks

  const formatNoteContent = (content: string) => {
    if (!content) return 'No content available';
    
    // First, process markdown formatting
    let processedContent = content
      // Bold text: **text** -> <strong>text</strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>')
      // Italic text: *text* -> <em>text</em>
      .replace(/\*(.*?)\*/g, '<em class="italic text-foreground">$1</em>')
      // Code/technical terms: `text` -> <code>text</code>
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      // Strikethrough: ~~text~~ -> <del>text</del>
      .replace(/~~(.*?)~~/g, '<del class="line-through text-muted-foreground">$1</del>')
      // Links: [text](url) -> <a>text</a>
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // Line breaks: \n\n -> </p><p>
      .replace(/\n\n/g, '</p>\n<p class="mb-3 leading-relaxed">');
    
    // Split content into lines
    const lines = processedContent.split('\n');
    const formattedLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        // Add spacing for empty lines
        formattedLines.push('');
        continue;
      }
      
      // Check if this is a main section heading (e.g., "1. OVERVIEW / ABSTRACT")
      if (/^\d+\.\s+[A-Z\s\/]+$/.test(line)) {
        formattedLines.push(`<h2 class="text-xl font-bold text-foreground mt-6 mb-3 border-b border-border pb-2">${line}</h2>`);
      }
      // Check if this is a subsection heading (e.g., "BACKGROUND AND MOTIVATION")
      else if (/^[A-Z\s]+$/.test(line) && line.length > 3 && line.length < 50) {
        formattedLines.push(`<h3 class="text-lg font-semibold text-foreground mt-4 mb-2">${line}</h3>`);
      }
      // Check if this is a numbered list item (e.g., "1. First item")
      else if (/^\d+\.\s+/.test(line)) {
        const content = line.replace(/^\d+\.\s+/, '');
        formattedLines.push(`<li class="ml-4 mb-2">${content}</li>`);
      }
      // Check if this is a bullet point (e.g., "- Item" or "• Item")
      else if (/^[-•]\s+/.test(line)) {
        const content = line.replace(/^[-•]\s+/, '');
        formattedLines.push(`<li class="ml-4 mb-2">${content}</li>`);
      }
      // Check if this is a key term definition (e.g., "Term: Definition")
      else if (/^[A-Za-z\s]+:\s+/.test(line)) {
        const [term, definition] = line.split(': ', 2);
        formattedLines.push(`<div class="mb-3 p-3 bg-muted/30 rounded-lg border border-border"><strong class="text-foreground">${term}:</strong> ${definition}</div>`);
      }
      // Regular paragraph text
      else {
        formattedLines.push(`<p class="mb-3 leading-relaxed">${line}</p>`);
      }
    }
    
    // Join lines and wrap lists properly
    let formattedContent = formattedLines.join('\n');
    
    // Wrap consecutive list items in <ul> tags
    formattedContent = formattedContent.replace(
      /(<li[^>]*>.*?<\/li>(\s*<li[^>]*>.*?<\/li>)*)/g,
      '<ul class="list-disc ml-6 mb-4">$1</ul>'
    );
    
    return formattedContent;
  };

  const handleFileSelect = (file: File) => {
    if (file.type === 'application/pdf') {
      setSelectedFile(file);
      setProcessResult(null);
    } else {
      alert('Please select a valid PDF file');
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) return;
    
    // Check credits before processing
    const hasCredits = await checkCreditsAndRedirect();
    if (!hasCredits) {
      if (onClose) {
        onClose();
      }
      return;
    }

    // Use simplified options - always generate notes, no images
    const options = {
      extractImages: false,
      generateNotes: true,
    };

    const result = await processPDFWithNotes(selectedFile, options);
    
    if (result) {
      setProcessResult(result);
      onProcessComplete?.(result);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setProcessResult(null);
  };

  return (
    <div className="space-y-6">
      {!processResult ? (
        <>
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Upload PDF Document</h3>
                <p className="text-muted-foreground text-sm">
                  Drag and drop your PDF file here, or click to browse
                </p>
              </div>

              <Input
                type="file"
                accept=".pdf"
                onChange={handleInputChange}
                className="hidden"
                id="pdf-upload"
                disabled={loading}
              />
              
              <label 
                htmlFor="pdf-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                Choose PDF File
              </label>
            </div>
          </div>

          {/* Selected File Info */}
          {selectedFile && (
            <div className="bg-muted/50 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleProcess}
                    disabled={loading}
                    className="rounded-xl"
                  >
                    {loading ? 'Processing...' : 'Generate Notes'}
                  </Button>
                  <Button 
                    onClick={resetForm}
                    variant="outline"
                    disabled={loading}
                    className="rounded-xl"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="text-sm text-destructive font-medium">
                  {error.includes('overloaded') ? 
                    'AI service is currently at capacity. Your PDF was processed, but AI notes could not be generated. Please try again in a few minutes.' : 
                    `Error: ${error}`}
                </p>
              </div>
              {error.includes('overloaded') && (
                <p className="text-xs text-muted-foreground mt-2 ml-7">
                  The document was successfully processed and saved. You can view it in your notes or try generating AI notes later.
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        /* Success State */
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 mx-auto flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2">PDF Processed Successfully!</h3>
            <p className="text-muted-foreground">
              {processResult.note && processResult.note.hasOwnProperty('modelOverloaded')
                ? 'Your PDF has been processed, but AI notes could not be generated due to high demand.' 
                : 'Your PDF has been processed and AI-powered notes have been generated.'}
            </p>
          </div>

          {processResult.note && processResult.note.hasOwnProperty('modelOverloaded') ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left">
              <h4 className="font-semibold text-sm mb-2 text-amber-800">AI Service Busy</h4>
              <p className="text-sm text-amber-700">
                {processResult.note.hasOwnProperty('message') 
                  ? (processResult.note as any).message 
                  : 'The AI service is currently overloaded. Your document was processed and saved successfully.'}
              </p>
              <p className="text-xs text-amber-600 mt-2">
                You can try generating AI notes for this document again later when the service is less busy.
              </p>
            </div>
          ) : processResult.note && !('error' in processResult.note) && (
            <div className="bg-muted/50 rounded-2xl p-4 text-left">
              <h4 className="font-semibold text-sm mb-2">Generated Note:</h4>
              <p className="text-sm text-muted-foreground mb-2">{processResult.note.title}</p>
              <div className="text-xs text-muted-foreground [&>h2]:text-sm [&>h2]:font-bold [&>h2]:text-foreground [&>h2]:mt-1 [&>h2]:mb-1 [&>h2]:border-b [&>h2]:border-border [&>h2]:pb-1 [&>h3]:text-xs [&>h3]:font-semibold [&>h2]:text-foreground [&>h3]:mt-1 [&>h3]:mb-1 [&>p]:mb-1 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:ml-2 [&>ul]:mb-1 [&>li]:mb-1 [&>div]:mb-1 [&>strong]:text-foreground [&>div]:p-1 [&>div]:bg-muted/30 [&>div]:rounded [&>div]:border [&>div]:border-border [&>em]:italic [&>code]:bg-muted [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-xs [&>code]:font-mono [&>del]:line-through [&>del]:text-muted-foreground [&>a]:text-primary [&>a]:hover:underline [&>a]:transition-colors" 
                   dangerouslySetInnerHTML={{ __html: formatNoteContent(processResult.note.content?.substring(0, 150) + '...') }} />
            </div>
          )}

          <div className="flex gap-2 justify-center">
            <Button onClick={onClose} className="rounded-xl">
              View in My Notes
            </Button>
            <Button onClick={resetForm} variant="outline" className="rounded-xl">
              Upload Another PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
