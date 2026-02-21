"use client";

import React, { useState, useEffect, useRef } from "react";
import { useNotes } from "@/hooks/use-notes";
import { useFolders } from "@/hooks/use-folders";
import { ProcessPDFResult } from "@/lib/types";
import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  File01Icon,
  Folder01Icon,
  MagicWand01Icon,
  Upload01Icon,
  Delete01Icon,
} from "@hugeicons/core-free-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UploadTextModalProps {
  onProcessComplete?: (result: ProcessPDFResult) => void;
  onClose?: () => void;
}

export function UploadTextModal({
  onProcessComplete,
  onClose,
}: UploadTextModalProps) {
  const { generateNotesFromText, processPDFWithNotes, loading } = useNotes();
  const { folders, getFolders, loading: foldersLoading } = useFolders();
  const {
    addLoadingNote,
    updateLoadingNote,
    removeLoadingNote,
    triggerRefresh,
  } = useDashboardRefresh();
  const [textInput, setTextInput] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedPDFFile, setSelectedPDFFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getFolders();
  }, [getFolders]);

  const handleGenerateNotes = async () => {
    const hasPDF = selectedPDFFile !== null;
    const hasText = textInput.trim().length > 0;

    if (!hasPDF && !hasText) return;

    const tempId = hasPDF ? `pdf-${Date.now()}` : `text-${Date.now()}`;
    let loadingNoteCreated = false;
    let modalClosed = false;

    const createLoadingNote = (
      stage: "uploading" | "processing" | "generating"
    ) => {
      if (loadingNoteCreated) {
        return;
      }
      addLoadingNote(tempId, "pdf", stage);
      loadingNoteCreated = true;
    };

    const closeModal = () => {
      if (modalClosed) {
        return;
      }
      modalClosed = true;
      onClose?.();
    };

    try {
      let result;

      if (hasPDF) {
        createLoadingNote("uploading");
        updateLoadingNote(tempId, {
          stage: "uploading",
          progress: 5,
          message: "Uploading PDF...",
        });

        result = await processPDFWithNotes(selectedPDFFile, {
          generateNotes: true,
          extractImages: false,
          folderId: selectedFolderId,
          progressJobId: tempId,
          onUploadProgress: (percent) => setUploadProgress(percent),
          onUploadComplete: () => {
            setUploadProgress(null);
            updateLoadingNote(tempId, {
              stage: "processing",
              progress: 20,
              message: "Parsing PDF...",
            });
            closeModal();
          },
        });

        if (loadingNoteCreated && result?.transcript?.id) {
          updateLoadingNote(tempId, {
            transcriptId: result.transcript.id,
            stage: "generating",
          });
        }
      } else {
        createLoadingNote("generating");
        closeModal();
        result = await generateNotesFromText(
          textInput,
          "Text Note",
          selectedFolderId,
          tempId
        );
      }

      if (result) {
        if (loadingNoteCreated && result.note && "id" in result.note) {
          updateLoadingNote(tempId, {
            noteId: result.note.id,
            stage: "completed",
          });
          await new Promise((resolve) => setTimeout(resolve, 600));
        }

        if (loadingNoteCreated) {
          removeLoadingNote(tempId);
        }

        await new Promise((resolve) => setTimeout(resolve, 200));

        onProcessComplete?.({
          ...result,
          transcript: {
            ...result.transcript,
            id: result.transcript.id || tempId,
          },
        });

        // Wait for database transaction to commit before refreshing UI
        await new Promise((resolve) => setTimeout(resolve, 400));
        triggerRefresh();

        setTextInput("");
        setSelectedFolderId(null);
        setSelectedPDFFile(null);
      } else {
        // processPDFWithNotes / generateNotesFromText returned null (internal failure)
        const errorMessage = "Failed to generate notes. Please try again.";
        if (loadingNoteCreated) {
          updateLoadingNote(tempId, {
            stage: "error",
            error: errorMessage,
          });
        }
        toast.error("Failed to generate notes", {
          description: errorMessage,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error generating notes:", error);
      setUploadProgress(null);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate notes";

      if (loadingNoteCreated) {
        updateLoadingNote(tempId, {
          stage: "error",
          error: errorMessage,
        });
      }

      toast.error("Failed to generate notes", {
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  const handleImportPDFs = () => {
    fileInputRef.current?.click();
  };

  const handlePDFSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Invalid file type", {
        description: "Please select a PDF file",
      });
      return;
    }

    const maxFileSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxFileSize) {
      toast.error("File too large", {
        description: "PDF must be less than 100MB",
      });
      return;
    }

    setSelectedPDFFile(file);

    toast.success("PDF uploaded", {
      description: `${file.name} is ready. Click "Generate notes" to process.`,
    });
  };

  const selectWrapperClass =
    "flex items-center gap-3 h-12 rounded-xl border border-primary/25 bg-primary/4 dark:bg-primary/8 transition-[border-color,box-shadow] focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:ring-offset-2 focus-within:ring-offset-card overflow-hidden pl-3 pr-1";
  const selectTriggerClass =
    "!h-12 flex-1 min-w-0 w-full rounded-none border-0 bg-transparent shadow-none pl-3 pr-9 py-0 text-sm font-medium text-foreground text-left cursor-pointer hover:bg-transparent focus:ring-0 focus-visible:ring-0 data-[placeholder]:text-muted-foreground [&_svg]:text-primary/90 [&_svg]:size-4";

  return (
    <div className="w-full max-w-[580px] rounded-2xl border border-border bg-card px-6 py-6 shadow-lg dark:shadow-none dark:bg-neutral-900/95 dark:border-neutral-800">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handlePDFSelect}
        className="hidden"
        id="upload-text-pdf-input"
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HugeiconsIcon icon={File01Icon} className="size-5" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground truncate">
            Document upload
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Close"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-5" />
        </button>
      </div>

      {/* Text input */}
      <div className="space-y-2 mb-6">
        <label
          className="block text-sm font-medium text-foreground"
          htmlFor="upload-text-area"
        >
          Paste text or upload PDF
        </label>
        <textarea
          id="upload-text-area"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          disabled={loading || selectedPDFFile !== null}
          placeholder={
            selectedPDFFile
              ? "Text input disabled when PDF is selected"
              : "Enter or paste your text here..."
          }
          className="w-full min-h-[160px] px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background resize-none disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        />
      </div>

      {/* Selected PDF card */}
      {selectedPDFFile && (
        <div className="mb-6 p-4 rounded-xl border border-primary/25 bg-primary/4 dark:bg-primary/8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <HugeiconsIcon icon={File01Icon} className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm text-foreground truncate">
                  {selectedPDFFile.name}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                  {(selectedPDFFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedPDFFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Remove PDF"
            >
              <HugeiconsIcon icon={Delete01Icon} className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Folder select */}
      <div className="space-y-2 mb-6">
        <label
          className="block text-sm font-medium text-foreground"
          id="upload-text-folder-label"
        >
          Folder
        </label>
        <div className={selectWrapperClass}>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <HugeiconsIcon icon={Folder01Icon} className="size-4" />
          </div>
          <Select
            value={selectedFolderId ?? "__all__"}
            onValueChange={(v) =>
              setSelectedFolderId(v === "__all__" ? null : v)
            }
            disabled={foldersLoading || loading}
          >
            <SelectTrigger
              className={selectTriggerClass}
              aria-labelledby="upload-text-folder-label"
            >
              <SelectValue placeholder="Select folder" />
            </SelectTrigger>
            <SelectContent
              className="bg-popover text-popover-foreground border-border dark:bg-neutral-900 dark:border-neutral-800 min-w-(--radix-select-trigger-width)"
              position="popper"
              align="start"
            >
              <SelectItem value="__all__" className="cursor-pointer">
                All notes
              </SelectItem>
              {folders.map((folder) => (
                <SelectItem
                  key={folder.id}
                  value={folder.id}
                  className="cursor-pointer"
                >
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleImportPDFs}
          disabled={loading || textInput.trim().length > 0}
          className="w-full h-11 rounded-xl border border-border bg-muted/50 text-foreground font-medium text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <HugeiconsIcon icon={Upload01Icon} className="size-4 shrink-0" />
          {selectedPDFFile ? "Change PDF" : "Import PDF"}
        </button>

        <button
          type="button"
          onClick={handleGenerateNotes}
          disabled={
            loading || (!textInput.trim() && !selectedPDFFile)
          }
          className="w-full h-12 rounded-xl bg-linear-to-r from-primary to-primary/90 text-primary-foreground font-semibold text-sm flex flex-col items-stretch justify-center gap-2 cursor-pointer hover:from-primary hover:to-primary/95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20 overflow-hidden"
        >
          {loading ? (
            uploadProgress !== null ? (
              <>
                <div className="flex items-center justify-center gap-2">
                  <span className="tabular-nums font-medium">{uploadProgress}%</span>
                  <span className="text-primary-foreground/90">Uploading…</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-primary-foreground/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary-foreground/90 transition-[width] duration-200 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </>
            ) : (
              <span className="text-primary-foreground/90">Creating notes…</span>
            )
          ) : (
            <>
              <HugeiconsIcon icon={MagicWand01Icon} className="size-4 shrink-0" />
              <span>Generate notes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
