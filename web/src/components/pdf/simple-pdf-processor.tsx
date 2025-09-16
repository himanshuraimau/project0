"use client";

import React, { useState, useEffect } from "react";
import { useNotes } from "@/hooks/use-notes";
import { ProcessPDFResult } from "@/lib/types";

// Extended interface to include model overload case
interface NoteWithModelOverload {
  error: string;
  message: string;
  modelOverloaded: boolean;
  retryAfter?: number;
  retryable?: boolean;
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

  const handleFileSelect = (file: File) => {
    if (file.type === "application/pdf") {
      setSelectedFile(file);
      setProcessResult(null);
    } else {
      alert("Please select a valid PDF file");
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

  const handleProcessText = async () => {
    if (!textInput.trim()) return;

    const result = await generateNotesFromText(
      textInput,
      noteTitle || "Text Note"
    );

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
  };

  return (
    <div className="space-y-6">
      {!processResult ? (
        <>
          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 bg-muted rounded-xl">
            <Button
              variant={mode === "pdf" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("pdf")}
              className="flex-1 rounded-lg hover:bg-stone-600"
            >
              <FileText className="h-4 w-4 mr-2" />
              Upload PDF
            </Button>
            <Button
              variant={mode === "text" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("text")}
              className="flex-1 rounded-lg"
            >
              <Type className="h-4 w-4 mr-2" />
              Create from Text
            </Button>
          </div>

          {mode === "pdf" ? (
            <>
              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-[8px] bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Upload PDF Document
                    </h3>
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
                        <p className="font-medium text-sm">
                          {selectedFile.name}
                        </p>
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
                        {loading ? "Processing..." : "Generate Notes"}
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
            </>
          ) : (
            <>
              {/* Text Input Area */}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="note-title"
                    className="block text-sm font-medium mb-2"
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
                    className="rounded-[8px] text-[16px] bg-white border-none dark:bg-neutral-800 font-medium"
                  />
                </div>

                <div>
                  <label
                    htmlFor="text-content"
                    className="block text-sm font-medium mb-2"
                  >
                    Text Content
                  </label>
                  <Textarea
                    id="text-content"
                    placeholder="Paste or type your text content here. AI will generate structured notes from this content..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    disabled={loading}
                    className="min-h-[200px] rounded-[8px] resize-none  font-medium text-[15px] bg-white border-none dark:bg-neutral-800"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {textInput.length} characters
                  </p>
                </div>

                {textInput.trim() && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleProcess}
                      disabled={loading || !textInput.trim()}
                      className="rounded-xl"
                    >
                      {loading ? "Generating Notes..." : "Generate AI Notes"}
                    </Button>
                    <Button
                      onClick={resetForm}
                      variant="outline"
                      disabled={loading}
                      className="rounded-xl"
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="text-sm text-destructive font-medium">
                  {error.includes("overloaded")
                    ? "AI service is currently at capacity. Your PDF was processed, but AI notes could not be generated. Please try again in a few minutes."
                    : `Error: ${error}`}
                </p>
              </div>
              {error.includes("overloaded") && (
                <p className="text-xs text-muted-foreground mt-2 ml-7">
                  The document was successfully processed and saved. You can
                  view it in your notes or try generating AI notes later.
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
            <h3 className="text-xl font-semibold mb-2">
              {mode === "pdf"
                ? "PDF Processed Successfully!"
                : "Notes Generated Successfully!"}
            </h3>
            <p className="text-muted-foreground">
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
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left">
              <h4 className="font-semibold text-sm mb-2 text-amber-800">
                AI Service Busy
              </h4>
              <p className="text-sm text-amber-700">
                {processResult.note.hasOwnProperty("message")
                  ? (processResult.note as any).message
                  : "The AI service is currently overloaded. Your document was processed and saved successfully."}
              </p>
              <p className="text-xs text-amber-600 mt-2">
                You can try generating AI notes for this document again later
                when the service is less busy.
              </p>
            </div>
          ) : (
            processResult.note &&
            !("error" in processResult.note) && (
              <div className="bg-muted/50 rounded-2xl p-4 text-left">
                <h4 className="font-semibold text-sm mb-2">Generated Note:</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {processResult.note.title}
                </p>
                <MarkdownRenderer
                  content={
                    processResult.note.content?.substring(0, 150) + "..." ||
                    "No content available"
                  }
                  className="text-xs text-muted-foreground"
                />
              </div>
            )
          )}

          <div className="flex gap-2 justify-center">
            <Button onClick={onClose} className="rounded-xl">
              View in My Notes
            </Button>
            <Button
              onClick={resetForm}
              variant="outline"
              className="rounded-xl"
            >
              {mode === "pdf" ? "Upload Another PDF" : "Create Another Note"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
