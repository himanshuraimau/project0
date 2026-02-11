"use client";

import React, { useState, useEffect } from "react";
import { useFolders } from "@/hooks/use-folders";
import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Link01Icon,
  Folder01Icon,
  MagicWand01Icon,
  Loading01Icon,
} from "@hugeicons/core-free-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddLinkModalProps {
  onClose?: () => void;
  onProcessComplete?: (result: any) => void;
}

export function AddLinkModal({
  onClose,
  onProcessComplete,
}: AddLinkModalProps) {
  const { folders, getFolders, loading: foldersLoading } = useFolders();
  const {
    addLoadingNote,
    removeLoadingNote,
    triggerRefresh,
  } = useDashboardRefresh();
  const [linkInput, setLinkInput] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTempId, setCurrentTempId] = useState<string | null>(null);
  const [processingUrls, setProcessingUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    getFolders();
  }, [getFolders]);

  const detectLinkType = (url: string): "youtube" | "webpage" => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      return "youtube";
    }
    return "webpage";
  };

  const handleGenerateNotes = async () => {
    if (!linkInput.trim()) return;

    const normalizedUrl = linkInput.trim().toLowerCase();

    if (processingUrls.has(normalizedUrl)) {
      toast.warning("Already processing this link", {
        description:
          "This link is currently being processed. Please wait for it to complete.",
        duration: 4000,
      });
      return;
    }

    setIsProcessing(true);
    setProcessingUrls((prev) => new Set(prev).add(normalizedUrl));

    const tempId = `link-${Date.now()}`;
    setCurrentTempId(tempId);

    const linkType = detectLinkType(linkInput);
    addLoadingNote(
      tempId,
      linkType === "youtube" ? "youtube" : "webpage"
    );

    await new Promise((resolve) => setTimeout(resolve, 300));

    if (onClose) {
      onClose();
    }

    try {
      let result;

      if (linkType === "youtube") {
        const transcriptResponse = await fetch("/api/transcripts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: linkInput }),
        });

        const transcriptResult = await transcriptResponse.json();

        if (!transcriptResponse.ok || !transcriptResult.success) {
          if (
            transcriptResponse.status === 408 ||
            transcriptResult.error === "TIMEOUT"
          ) {
            toast.info("YouTube video is being processed", {
              description:
                transcriptResult.message ||
                "This is taking longer than expected. The transcript is being processed in the background and should appear in your notes within 5-10 minutes.",
              duration: 8000,
            });

            if (currentTempId) {
              removeLoadingNote(currentTempId);
              setCurrentTempId(null);
            }
            setIsProcessing(false);
            return;
          }

          const errorMessages: Record<string, string> = {
            NO_CAPTIONS:
              "This video does not have captions available.",
            SERVICE_UNAVAILABLE:
              "YouTube transcript service is temporarily busy. Please try again in a few minutes.",
            RATE_LIMITED:
              "Too many requests. Please wait a moment before trying again.",
            NETWORK_ERROR:
              "Connection issue. Please check your internet and try again.",
            EXTERNAL_API_ERROR:
              "YouTube service error. Please try again or use a different video.",
          };

          const errorMsg =
            errorMessages[transcriptResult.error] ||
            transcriptResult.message ||
            "Failed to process YouTube video";
          throw new Error(errorMsg);
        }

        const noteResponse = await fetch("/api/notes/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcriptId: transcriptResult.data.id,
            folderId: selectedFolderId,
          }),
        });

        const noteResult = await noteResponse.json();

        if (!noteResponse.ok || !noteResult.success) {
          toast.warning("Transcript created, but notes generation failed", {
            description:
              "You can retry generating notes from your transcripts list.",
            duration: 5000,
          });

          result = {
            success: true,
            data: {
              transcript: transcriptResult.data,
              note: null,
            },
          };
        } else {
          result = {
            success: true,
            data: {
              transcript: transcriptResult.data,
              note: noteResult.data,
            },
          };
        }
      } else {
        const response = await fetch("/api/webpage/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: linkInput,
            folderId: selectedFolderId,
          }),
        });

        result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || result.message || "Failed to process webpage"
          );
        }
      }

      if (currentTempId) {
        removeLoadingNote(currentTempId);
        setCurrentTempId(null);
      }

      await new Promise((resolve) => setTimeout(resolve, 200));

      onProcessComplete?.(result.data);

      triggerRefresh();

      setLinkInput("");
      setSelectedFolderId(null);

      const source = linkType === "youtube" ? "YouTube video" : "webpage";

      if (result.data.note) {
        toast.success(`${source} processed successfully! Notes generated.`, {
          description: "Content extracted and notes created",
          duration: 4000,
        });
      } else {
        toast.success(`${source} transcript created`, {
          description:
            "Transcript saved. You can generate notes from it later.",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Error processing link:", error);

      setTimeout(() => {
        setProcessingUrls((prev) => {
          const newSet = new Set(prev);
          newSet.delete(normalizedUrl);
          return newSet;
        });
      }, 2000);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to process link. Please try again.";

      toast.error("Processing failed", {
        description: errorMessage,
        duration: 6000,
      });
    } finally {
      if (currentTempId) {
        removeLoadingNote(currentTempId);
        setCurrentTempId(null);
      }
      setIsProcessing(false);
    }
  };

  const selectWrapperClass =
    "flex items-center gap-3 h-12 rounded-xl border border-primary/25 bg-primary/4 dark:bg-primary/8 transition-[border-color,box-shadow] focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:ring-offset-2 focus-within:ring-offset-card overflow-hidden pl-3 pr-1";
  const selectTriggerClass =
    "!h-12 flex-1 min-w-0 w-full rounded-none border-0 bg-transparent shadow-none pl-3 pr-9 py-0 text-sm font-medium text-foreground text-left cursor-pointer hover:bg-transparent focus:ring-0 focus-visible:ring-0 data-[placeholder]:text-muted-foreground [&_svg]:text-primary/90 [&_svg]:size-4";

  return (
    <div className="w-full max-w-[580px] rounded-2xl border border-border bg-card px-6 py-6 shadow-lg dark:shadow-none dark:bg-neutral-900/95 dark:border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HugeiconsIcon icon={Link01Icon} className="size-5" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground truncate">
            Website link
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

      {/* Link input */}
      <div className="space-y-2 mb-4">
        <label
          className="block text-sm font-medium text-foreground"
          htmlFor="add-link-input"
        >
          URL
        </label>
        <div className="relative flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/4 dark:bg-primary/8 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:ring-offset-2 focus-within:ring-offset-card overflow-hidden pl-3 pr-2">
          <HugeiconsIcon
            icon={Link01Icon}
            className="size-4 shrink-0 text-primary/80"
          />
          <input
            id="add-link-input"
            type="url"
            inputMode="url"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="https://youtube.com/watch?v=... or any website URL"
            disabled={isProcessing}
            className="flex-1 min-w-0 h-11 bg-transparent border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 disabled:opacity-50"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-6">
        YouTube, PDFs, TikTok, and most websites
      </p>

      {/* Folder select */}
      <div className="space-y-2 mb-8">
        <label
          className="block text-sm font-medium text-foreground"
          id="add-link-folder-label"
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
            disabled={foldersLoading || isProcessing}
          >
            <SelectTrigger
              className={selectTriggerClass}
              aria-labelledby="add-link-folder-label"
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

      {/* Generate Notes */}
      <button
        type="button"
        onClick={handleGenerateNotes}
        disabled={isProcessing || !linkInput.trim()}
        className="w-full h-12 rounded-xl bg-linear-to-r from-primary to-primary/90 text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer hover:from-primary hover:to-primary/95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
      >
        {isProcessing ? (
          <>
            <HugeiconsIcon
              icon={Loading01Icon}
              className="size-4 shrink-0 animate-spin"
            />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <HugeiconsIcon icon={MagicWand01Icon} className="size-4 shrink-0" />
            <span>Generate notes</span>
          </>
        )}
      </button>
    </div>
  );
}
