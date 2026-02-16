"use client";

import { useState, useRef } from "react";
import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";
import { useUpgradeModal } from "@/contexts/upgrade-modal-context";
import { normalizeS3UploadError } from "@/lib/utils/s3-upload-errors";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Upload01Icon,
  Cancel01Icon,
  Folder01Icon,
  MagicWand01Icon,
  Loading01Icon,
  Mic01Icon,
} from "@hugeicons/core-free-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AudioUploadModalProps {
  onTranscriptionComplete: (result: {
    transcript: { id: string; content: string };
    note: {
      id?: string;
      title?: string;
      content?: string;
      error?: string;
      message?: string;
    };
  }) => void;
  onClose?: () => void;
}

export default function AudioUploadModal({
  onTranscriptionComplete,
  onClose,
}: AudioUploadModalProps) {
  const {
    addLoadingNote,
    updateLoadingNote,
    removeLoadingNote,
    triggerRefresh,
  } = useDashboardRefresh();
  const { openUpgradeModal } = useUpgradeModal();
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState("");
  const [audioLanguage, setAudioLanguage] = useState("English");
  const [folder, setFolder] = useState("All notes");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const maxFileSize = 25 * 1024 * 1024; // 25MB
      if (file.size > maxFileSize) {
        toast.error("File too large!", {
          description: `Maximum size is 25MB. Your file is ${(
            file.size /
            1024 /
            1024
          ).toFixed(2)}MB. Please compress or choose a smaller file.`,
          duration: 5000,
        });
        event.target.value = "";
        return;
      }

      const allowedTypes = [
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/wave",
        "audio/x-wav",
        "audio/flac",
        "audio/m4a",
        "audio/x-m4a",
        "audio/mp4",
        "audio/ogg",
        "audio/webm",
        "audio/aac",
      ];

      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      const allowedExtensions = [
        "mp3",
        "wav",
        "flac",
        "m4a",
        "ogg",
        "webm",
        "mp4",
        "aac",
      ];

      const isValidMimeType = allowedTypes.includes(file.type);
      const isValidExtension =
        fileExtension && allowedExtensions.includes(fileExtension);

      if (!isValidMimeType && !isValidExtension) {
        toast.error("Unsupported audio format", {
          description: `Please use MP3, WAV, FLAC, M4A, OGG, WebM, MP4, or AAC.`,
          duration: 5000,
        });
        event.target.value = "";
        return;
      }

      setAudioBlob(file);
      setFileName(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);

    const tempId = `audio-upload-${Date.now()}`;
    addLoadingNote(tempId, "audio", "uploading");

    await new Promise((resolve) => setTimeout(resolve, 300));

    if (onClose) {
      onClose();
    }

    const file = audioBlob instanceof File ? audioBlob : new File([audioBlob], fileName || "uploaded-audio", { type: audioBlob.type });
    const fileDisplayName = fileName || (file.name?.replace(/\.[^/.]+$/, "") ?? "uploaded-audio");

    try {
      // 1) Get presigned S3 URLs (avoids Vercel 5MB body limit by uploading directly to S3)
      const urlRes = await fetch("/api/audio/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name || `${fileDisplayName}.mp3`,
          contentType: file.type || "audio/mpeg",
          fileSize: file.size,
        }),
      });

      if (!urlRes.ok) {
        const urlError = await urlRes.json().catch(() => ({}));
        if (urlRes.status === 503) {
          throw new Error(urlError.error ?? "Audio upload is not configured. Please set up S3.");
        }
        throw new Error(urlError.error ?? "Failed to get upload URL");
      }

      const { uploadUrl, transcribeUrl } = await urlRes.json();

      // 2) Upload file directly to S3
      updateLoadingNote(tempId, { stage: "uploading" });
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "audio/mpeg" },
      });

      if (!putRes.ok) {
        throw new Error("Failed to upload file to storage");
      }

      // 3) Ask API to transcribe from the S3 URL (small JSON body, no size limit)
      updateLoadingNote(tempId, { stage: "processing" });
      const response = await fetch("/api/audio/transcribe-from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioUrl: transcribeUrl,
          fileName: file.name || `${fileDisplayName}.mp3`,
          folderId: null,
          progressJobId: tempId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const responseData = result.data || result;

        if (responseData.transcript?.id) {
          updateLoadingNote(tempId, {
            transcriptId: responseData.transcript.id,
            stage: "generating",
          });
        }

        if (responseData.note?.id) {
          updateLoadingNote(tempId, {
            noteId: responseData.note.id,
            stage: "completed",
          });
        }

        // Use local tempId (not currentTempId which is stale due to async setState)
        removeLoadingNote(tempId);

        await new Promise((resolve) => setTimeout(resolve, 200));

        onTranscriptionComplete({
          transcript: {
            ...responseData.transcript,
            id: responseData.transcript?.id || tempId,
          },
          note: responseData.note
            ? responseData.note
            : {
                error: responseData.noteError || "Failed to generate notes",
                message: responseData.noteError || "Note generation failed. You can retry from the transcript.",
              },
        });

        // Wait for database transaction to commit before refreshing UI
        await new Promise((resolve) => setTimeout(resolve, 400));
        triggerRefresh();

        setAudioBlob(null);
        setFileName("");
      } else {
        const errorData = await response.json();

        updateLoadingNote(tempId, {
          stage: "error",
          error: errorData.error || "Failed to transcribe audio",
        });

        if (
          response.status === 403 &&
          errorData.error === "FREE_TIER_LIMIT_REACHED"
        ) {
          openUpgradeModal();
          return;
        } else if (response.status === 413) {
          throw new Error(
            `File too large: ${errorData.error || "Audio file exceeds 25MB limit"}`
          );
        } else if (response.status === 402) {
          throw new Error("Insufficient credits to process audio");
        } else if (response.status === 400) {
          throw new Error(errorData.error || "Invalid audio file format");
        } else {
          throw new Error(
            errorData.error || "Failed to transcribe audio"
          );
        }
      }
    } catch (error) {
      console.error("Transcription error:", error);
      const normalizedError = normalizeS3UploadError(error);
      // Use local tempId (not currentTempId which is stale due to async setState)
      updateLoadingNote(tempId, {
        stage: "error",
        error: normalizedError,
      });
      toast.error("Failed to transcribe audio", {
        description: normalizedError,
        duration: 5000,
      });
    } finally {
      // Don't remove loading note in finally — let error state show if there was an error
      // Successful path already called removeLoadingNote above
      setIsProcessing(false);
    }
  };

  const selectWrapperClass =
    "flex items-center gap-3 h-12 rounded-xl border border-primary/25 bg-primary/[0.06] dark:bg-primary/[0.12] transition-[border-color,box-shadow] focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:ring-offset-2 focus-within:ring-offset-card overflow-hidden pl-3 pr-1";
  const selectTriggerClass =
    "!h-12 flex-1 min-w-0 w-full rounded-none border-0 bg-transparent shadow-none pl-3 pr-9 py-0 text-sm font-medium text-foreground text-left cursor-pointer hover:bg-transparent focus:ring-0 focus-visible:ring-0 data-[placeholder]:text-muted-foreground [&_svg]:text-primary/90 [&_svg]:size-4";

  return (
    <div className="w-full max-w-[580px] rounded-2xl border border-border bg-card px-6 py-6 shadow-lg dark:shadow-none dark:bg-neutral-900/95 dark:border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HugeiconsIcon icon={Upload01Icon} className="size-5" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground truncate">
            Upload audio
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

      {/* Upload zone */}
      <div className="mb-8">
        <input
          ref={fileInputRef}
          type="file"
          accept=".wav,.mp3,.aiff,.aac,.ogg,.flac,.m4a,.webm,.mp4"
          onChange={handleFileUpload}
          className="hidden"
          id="audio-file-input"
        />
        <label
          htmlFor="audio-file-input"
          className="flex flex-col items-center justify-center w-full min-h-[140px] rounded-xl border-2 border-dashed border-primary/30 bg-primary/4 dark:bg-primary/8 p-8 cursor-pointer hover:border-primary/50 hover:bg-primary/8 dark:hover:bg-primary/12 transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:ring-offset-2 focus-within:ring-offset-card"
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary mb-4">
            <HugeiconsIcon icon={Upload01Icon} className="size-6" />
          </div>
          <p className="text-sm font-medium text-foreground text-center">
            {audioBlob
              ? `${fileName || "Audio file"}`
              : "Drag audio here, or click to upload"}
          </p>
          {audioBlob && (
            <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
              {(audioBlob.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
          <span className="text-xs text-muted-foreground mt-1">
            MP3, WAV, FLAC, M4A, OGG, WebM, AAC · max 25MB
          </span>
        </label>
      </div>

      {/* Form fields — premium selects */}
      <div className="space-y-5 mb-8">
        <div className="space-y-2">
          <label
            className="block text-sm font-medium text-foreground"
            id="upload-audio-language-label"
          >
            Audio language
          </label>
          <div className={selectWrapperClass}>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <HugeiconsIcon icon={Mic01Icon} className="size-4" />
            </div>
            <Select
              value={audioLanguage}
              onValueChange={setAudioLanguage}
              disabled={isProcessing}
            >
              <SelectTrigger
                className={selectTriggerClass}
                aria-labelledby="upload-audio-language-label"
              >
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent
                className="bg-popover text-popover-foreground border-border dark:bg-neutral-900 dark:border-neutral-800 min-w-(--radix-select-trigger-width)"
                position="popper"
                align="start"
              >
                <SelectItem value="English" className="cursor-pointer">
                  English
                </SelectItem>
                <SelectItem value="Spanish" className="cursor-pointer">
                  Spanish
                </SelectItem>
                <SelectItem value="French" className="cursor-pointer">
                  French
                </SelectItem>
                <SelectItem value="German" className="cursor-pointer">
                  German
                </SelectItem>
                <SelectItem value="Chinese" className="cursor-pointer">
                  Chinese
                </SelectItem>
                <SelectItem value="Japanese" className="cursor-pointer">
                  Japanese
                </SelectItem>
                <SelectItem value="Korean" className="cursor-pointer">
                  Korean
                </SelectItem>
                <SelectItem value="Arabic" className="cursor-pointer">
                  Arabic
                </SelectItem>
                <SelectItem value="Hindi" className="cursor-pointer">
                  Hindi
                </SelectItem>
                <SelectItem value="Portuguese" className="cursor-pointer">
                  Portuguese
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label
            className="block text-sm font-medium text-foreground"
            id="upload-folder-label"
          >
            Folder
          </label>
          <div className={selectWrapperClass}>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <HugeiconsIcon icon={Folder01Icon} className="size-4" />
            </div>
            <Select value={folder} onValueChange={setFolder} disabled={isProcessing}>
              <SelectTrigger
                className={selectTriggerClass}
                aria-labelledby="upload-folder-label"
              >
                <SelectValue placeholder="Select folder" />
              </SelectTrigger>
              <SelectContent
                className="bg-popover text-popover-foreground border-border dark:bg-neutral-900 dark:border-neutral-800 min-w-(--radix-select-trigger-width)"
                position="popper"
                align="start"
              >
                <SelectItem value="All notes" className="cursor-pointer">
                  All notes
                </SelectItem>
                <SelectItem value="Work" className="cursor-pointer">
                  Work
                </SelectItem>
                <SelectItem value="Personal" className="cursor-pointer">
                  Personal
                </SelectItem>
                <SelectItem value="Projects" className="cursor-pointer">
                  Projects
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Generate Notes */}
      <button
        type="button"
        onClick={transcribeAudio}
        disabled={isProcessing || !audioBlob}
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
