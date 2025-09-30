"use client";

import React, { useState } from "react";
import { useNotes } from "@/hooks/use-notes";
import { ProcessPDFResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, CheckCircle, AlertCircle, Type } from "lucide-react";

import { MarkdownRenderer } from "@/components/mdx-renderer";

interface SimplePDFProcessorProps {
  onProcessComplete?: (result: ProcessPDFResult) => void;
  onClose?: () => void;
}

export function SimplePDFProcessor({
  onProcessComplete,
  onClose,
}: SimplePDFProcessorProps) {
  const { processPDFWithNotes, generateNotesFromText, loading, error } =
    useNotes();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [processResult, setProcessResult] = useState<ProcessPDFResult | null>(
    null
  );
  const [mode, setMode] = useState<"pdf" | "text">("pdf");
  const [textInput, setTextInput] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    // Reset previous state
    setProcessResult(null);
    setValidationError(null);
    
    // Validate file type
    const allowedMimeTypes = ['application/pdf'];
    const allowedExtensions = ['.pdf'];
    
    if (!allowedMimeTypes.includes(file.type)) {
      setValidationError("Only PDF files are allowed. Please select a PDF file.");
      return;
    }
    
    // Check file extension as backup
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      setValidationError("File must have a .pdf extension.");
      return;
    }
    
    // Check file size (10MB limit)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxFileSize) {
      setValidationError(`File size must be less than ${maxFileSize / 1024 / 1024}MB. Please choose a smaller file.`);
      return;
    }
    
    // Check if file name is valid
    if (!file.name || file.name.trim().length === 0) {
      setValidationError("File must have a valid name.");
      return;
    }
    
    setSelectedFile(file);
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
    if (mode === "pdf" && !selectedFile) return;
    if (mode === "text" && !textInput.trim()) return;

    let result;

    if (mode === "pdf") {
      // Use simplified options - always generate notes, no images
      const options = {
        extractImages: false,
        generateNotes: true,
      };
      result = await processPDFWithNotes(selectedFile!, options);
    } else {
      // Generate notes from text
      result = await generateNotesFromText(textInput, noteTitle || "Text Note");
    }

    if (result) {
      setProcessResult(result);
      onProcessComplete?.(result);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setProcessResult(null);
    setTextInput("");
    setNoteTitle("");
    setValidationError(null);
  };

  // Helper function to get user-friendly error messages
  const getErrorMessage = (error: string): string => {
    const errorLower = error.toLowerCase();
    
    if (errorLower.includes("overloaded") || errorLower.includes("capacity")) {
      return "AI service is currently at capacity";
    }
    if (errorLower.includes("insufficient_credits") || errorLower.includes("insufficient credits")) {
      return "Insufficient credits to process PDF";
    }
    if (errorLower.includes("invalid pdf") || errorLower.includes("corrupted")) {
      return "Invalid or corrupted PDF file";
    }
    if (errorLower.includes("password")) {
      return "Password-protected PDFs are not supported";
    }
    if (errorLower.includes("timeout")) {
      return "PDF processing timed out";
    }
    if (errorLower.includes("file too large") || errorLower.includes("size limit")) {
      return "File size exceeds the 10MB limit";
    }
    if (errorLower.includes("invalid file type") || errorLower.includes("invalid file extension")) {
      return "Only PDF files are supported";
    }
    if (errorLower.includes("unauthorized") || errorLower.includes("sign in")) {
      return "Please sign in to continue";
    }
    if (errorLower.includes("database") || errorLower.includes("network")) {
      return "Server error occurred";
    }
    
    return `Error: ${error}`;
  };

  // Helper function to get additional help text for errors
  const getErrorHelpText = (error: string): string | null => {
    const errorLower = error.toLowerCase();
    
    if (errorLower.includes("overloaded") || errorLower.includes("capacity")) {
      return "Your document was processed and saved. You can view it in your notes or try generating AI notes later.";
    }
    if (errorLower.includes("insufficient_credits")) {
      return "Please purchase more credits to continue processing PDF files.";
    }
    if (errorLower.includes("invalid pdf") || errorLower.includes("corrupted")) {
      return "Please try uploading a different PDF file that is not corrupted.";
    }
    if (errorLower.includes("password")) {
      return "Please remove the password protection from your PDF and try again.";
    }
    if (errorLower.includes("timeout")) {
      return "The file may be too large or complex. Please try a smaller PDF file.";
    }
    if (errorLower.includes("file too large")) {
      return "Please choose a smaller PDF file (maximum 10MB).";
    }
    if (errorLower.includes("database") || errorLower.includes("network")) {
      return "Please try again in a few minutes. If the problem persists, contact support.";
    }
    
    return null;
  };

  return (
    <div className="space-y-6">
      {!processResult ? (
        <>
          {/* Mode Toggle */}
          <div className="flex gap-2 p-2 bg-muted/50 rounded-2xl border border-border/20">
            <Button
              variant={mode === "pdf" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("pdf")}
              className={`flex-1 rounded-xl ${
                mode === "pdf"
                  ? "bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
                  : "hover:bg-muted"
              }`}
            >
              <FileText className="h-4 w-4 mr-2" />
              Upload PDF
            </Button>
            <Button
              variant={mode === "text" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("text")}
              className={`flex-1 rounded-xl ${
                mode === "text"
                  ? "bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
                  : "hover:bg-muted"
              }`}
            >
              <Type className="h-4 w-4 mr-2" />
              Create from Text
            </Button>
          </div>

          {mode === "pdf" ? (
            <>
              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ${
                  dragActive
                    ? "border-accent/50 bg-accent/10 scale-[1.02]"
                    : "border-accent/30 hover:border-accent/50 bg-accent/5 hover:scale-[1.01]"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="space-y-6">
                  <div className="mx-auto w-20 h-20 rounded-2xl bg-accent flex items-center justify-center shadow-lg">
                    <FileText className="h-10 w-10 text-accent-foreground" />
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-foreground">
                      Upload PDF Document
                    </h3>
                    <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
                      Drag and drop your PDF file here, or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground/70">
                      Maximum file size: 10MB • Maximum pages: 50
                    </p>
                  </div>

                  <Input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleInputChange}
                    className="hidden"
                    id="pdf-upload"
                    disabled={loading}
                  />

                  <label
                    htmlFor="pdf-upload"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-accent text-accent-foreground rounded-2xl hover:bg-accent/90 transition-all duration-200 cursor-pointer font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <Upload className="h-5 w-5" />
                    Choose PDF File
                  </label>
                </div>
              </div>

              {/* Selected File Info */}
              {selectedFile && (
                <div className="bg-accent/10 rounded-2xl border border-accent/30 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center shadow-lg">
                        <FileText className="h-7 w-7 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-lg">
                          {selectedFile.name}
                        </p>
                        <p className="text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleProcess}
                        disabled={loading}
                        className="rounded-xl px-6 bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
                      >
                        {loading ? "Processing..." : "Generate Notes"}
                      </Button>
                      <Button
                        onClick={resetForm}
                        variant="outline"
                        disabled={loading}
                        className="rounded-xl px-4"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Text Input Area */}
              <div className="space-y-6 rounded-2xl border border-accent/30 bg-accent/5 p-8">
                <div className="text-center space-y-3 mb-6">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-accent flex items-center justify-center shadow-lg">
                    <Type className="h-8 w-8 text-accent-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Create from Text</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="note-title"
                      className="block text-sm font-bold text-foreground mb-3"
                    >
                      Note Title (Optional)
                    </label>
                    <Input
                      id="note-title"
                      type="text"
                      placeholder="Enter a title for your note..."
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      disabled={loading}
                      className="h-12 rounded-xl border-2 border-border/20 bg-background text-foreground placeholder:text-muted-foreground focus:border-accent/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="text-content"
                      className="block text-sm font-bold text-foreground mb-3"
                    >
                      Text Content
                    </label>
                    <Textarea
                      id="text-content"
                      placeholder="Paste or type your text content here. AI will generate structured notes from this content..."
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      disabled={loading}
                      className="min-h-[240px] rounded-xl border-2 border-border/20 bg-background text-foreground placeholder:text-muted-foreground focus:border-accent/50 transition-colors resize-none"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      {textInput.length} characters
                    </p>
                  </div>

                  {textInput.trim() && (
                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={handleProcess}
                        disabled={loading || !textInput.trim()}
                        className="flex-1 h-12 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-lg"
                      >
                        {loading ? "Generating Notes..." : "Generate AI Notes"}
                      </Button>
                      <Button
                        onClick={resetForm}
                        variant="outline"
                        disabled={loading}
                        className="rounded-xl px-6"
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Validation Error Display */}
          {validationError && (
            <Card className="border-red-200 dark:border-red-800/30 bg-red-50 dark:bg-red-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-red-600 dark:text-red-400 font-medium">
                    {validationError}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processing Error Display */}
          {error && (
            <Card className="border-red-200 dark:border-red-800/30 bg-red-50 dark:bg-red-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  {getErrorMessage(error)}
                </CardTitle>
                {getErrorHelpText(error) && (
                  <CardDescription className="text-red-500 dark:text-red-300">
                    {getErrorHelpText(error)}
                  </CardDescription>
                )}
              </CardHeader>
            </Card>
          )}
        </>
      ) : (
        /* Success State */
        <div className="text-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-accent mx-auto flex items-center justify-center shadow-lg">
            <CheckCircle className="h-12 w-12 text-accent-foreground" />
          </div>

          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-foreground">
              {mode === "pdf"
                ? "PDF Processed Successfully!"
                : "Notes Generated Successfully!"}
            </h3>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
              {processResult.note &&
              processResult.note.hasOwnProperty("modelOverloaded")
                ? `Your ${
                    mode === "pdf" ? "PDF" : "text"
                  } has been processed, but AI notes could not be generated due to high demand.`
                : `Your ${
                    mode === "pdf"
                      ? "PDF has been processed"
                      : "text has been converted"
                  } and AI-powered notes have been generated.`}
            </p>
          </div>

          {processResult.note &&
          processResult.note.hasOwnProperty("modelOverloaded") ? (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-6 text-left">
              <h4 className="font-bold text-amber-800 dark:text-amber-300 text-lg mb-2">
                AI Service Busy
              </h4>
              <p className="text-amber-700 dark:text-amber-200">
                {processResult.note.hasOwnProperty("message")
                  ? (processResult.note as { message: string }).message
                  : "The AI service is currently overloaded. Your document was processed and saved successfully."}
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-300 mt-2">
                You can try generating AI notes for this document again later
                when the service is less busy.
              </p>
            </div>
          ) : (
            processResult.note &&
            !("error" in processResult.note) && (
              <div className="bg-muted/30 border border-border/50 rounded-2xl p-6 text-left">
                <h4 className="font-bold text-foreground text-lg mb-3">Generated Note:</h4>
                <p className="text-muted-foreground font-medium mb-3">
                  {processResult.note.title}
                </p>
                <MarkdownRenderer
                  content={
                    processResult.note.content?.substring(0, 200) + "..." ||
                    "No content available"
                  }
                  className="text-sm text-muted-foreground/80"
                />
              </div>
            )
          )}

          <div className="flex gap-3 justify-center pt-4">
            <Button 
              onClick={onClose} 
              className="rounded-xl px-6 bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              View in My Notes
            </Button>
            <Button
              onClick={resetForm}
              variant="outline"
              className="rounded-xl px-6"
            >
              {mode === "pdf" ? "Upload Another PDF" : "Create Another Note"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
