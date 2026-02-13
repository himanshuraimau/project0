"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mic01Icon,
  Upload01Icon,
  File01Icon,
  Link01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  StopIcon,
  Delete01Icon,
  PlayIcon,
  MagicWand01Icon,
  ArrowDown01Icon,
  Loading01Icon,
  Folder01Icon,
} from "@hugeicons/core-free-icons";
import { UploadTextModal } from "@/components/pdf";
import { ProcessPDFResult } from "@/lib/types";
import { AudioRecorder, AudioUploadModal } from "@/components/audio";
import { AddLinkModal } from "@/components/link";
import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/use-subscription";
import { UpgradeModal } from "@/components/subscription/upgrade-modal";

// AudioRecorderModal Component with full recording functionality
type RecordingState = "idle" | "recording" | "paused";

interface AudioRecorderModalProps {
  onClose: () => void;
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
}

function AudioRecorderModal({
  onClose,
  onTranscriptionComplete,
}: AudioRecorderModalProps) {
  const {
    addLoadingNote,
    updateLoadingNote,
    removeLoadingNote,
    triggerRefresh,
  } = useDashboardRefresh();
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [audioLanguage, setAudioLanguage] = useState("English");
  const [folder, setFolder] = useState("All notes");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTempId, setCurrentTempId] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const mimeTypeRef = React.useRef<string>("audio/webm");
  const recordingTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const pendingBlobResolveRef = React.useRef<((blob: Blob) => void) | null>(null);
  const cancellingRef = React.useRef(false);
  const audioPreviewRef = React.useRef<HTMLAudioElement | null>(null);
  const previewUrlRef = React.useRef<string | null>(null);

  // Timer effect
  React.useEffect(() => {
    if (recordingState === "recording" && !recordingTimerRef.current) {
      recordingTimerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (recordingState !== "recording" && recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    };
  }, [recordingState]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleStartRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Recording not supported", {
          description:
            "Your browser doesn't support audio recording. Please try a different browser.",
          duration: 5000,
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      let mimeType = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      }

      mimeTypeRef.current = mimeType;

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setSeconds(0);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Use timeslice so we get chunks during recording (needed for play preview when paused)
      const timesliceMs = 500;
      mediaRecorder.start(timesliceMs);

      mediaRecorder.onstop = () => {
        if (cancellingRef.current) {
          streamRef.current?.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          return;
        }
        const blob = new Blob(audioChunksRef.current, {
          type: mimeTypeRef.current,
        });
        setAudioBlob(blob);
        if (pendingBlobResolveRef.current) {
          pendingBlobResolveRef.current(blob);
          pendingBlobResolveRef.current = null;
        }
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      setRecordingState("recording");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording", {
        description:
          "Please ensure microphone access is granted and try again.",
        duration: 5000,
      });
    }
  };

  const handleStop = () => {
    const mr = mediaRecorderRef.current;
    if (mr && recordingState === "recording") {
      if (typeof mr.pause === "function") {
        if (typeof mr.requestData === "function") mr.requestData();
        mr.pause();
        setRecordingState("paused");
      } else {
        mr.stop();
        setRecordingState("paused");
      }
    }
  };

  const handleResume = () => {
    const mr = mediaRecorderRef.current;
    if (mr && recordingState === "paused") {
      if (typeof mr.resume === "function") {
        mr.resume();
        setRecordingState("recording");
      } else {
        toast.error("Pause/resume not supported in this browser", {
          description:
            "Please record in a single session or switch to a modern browser that supports pause/resume.",
          duration: 5000,
        });
      }
    }
  };

  const handleDelete = () => {
    stopPreviewPlayback();
    const mr = mediaRecorderRef.current;
    if (mr && (recordingState === "recording" || recordingState === "paused")) {
      cancellingRef.current = true;
      mr.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      cancellingRef.current = false;
    }
    setRecordingState("idle");
    setSeconds(0);
    setAudioBlob(null);
    audioChunksRef.current = [];
  };

  const stopPreviewPlayback = () => {
    const audio = audioPreviewRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
    }
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setIsPlayingPreview(false);
  };

  const handlePlayPreview = () => {
    if (isPlayingPreview) {
      stopPreviewPlayback();
      return;
    }
    const chunks = audioChunksRef.current;
    if (chunks.length === 0) {
      toast.error("No audio to play yet", {
        description: "Record for a moment, then stop to listen back.",
        duration: 4000,
      });
      return;
    }
    const blob = new Blob(chunks, { type: mimeTypeRef.current });
    if (blob.size === 0) {
      toast.error("No audio to play yet", {
        description: "Record for a moment, then stop to listen back.",
        duration: 4000,
      });
      return;
    }
    const url = URL.createObjectURL(blob);
    previewUrlRef.current = url;
    const audio = audioPreviewRef.current;
    if (!audio) {
      URL.revokeObjectURL(url);
      previewUrlRef.current = null;
      return;
    }
    audio.src = url;
    audio.play()
      .then(() => setIsPlayingPreview(true))
      .catch((err) => {
        console.error("Preview playback failed:", err);
        URL.revokeObjectURL(url);
        previewUrlRef.current = null;
        toast.error("Playback failed", {
          description: "Your browser may not support playing this format. Try generating notes instead.",
          duration: 5000,
        });
      });
  };

  React.useEffect(() => {
    if (recordingState !== "paused") stopPreviewPlayback();
  }, [recordingState]);

  const handleSave = () => {
    // This would save without generating notes
    console.log("Saving recording...");
  };

  const handleGenerateNotes = async () => {
    let blobToUse: Blob | null = audioBlob;

    if (recordingState === "recording" || recordingState === "paused") {
      const mr = mediaRecorderRef.current;
      if (mr) {
        blobToUse = await new Promise<Blob>((resolve) => {
          pendingBlobResolveRef.current = resolve;
          mr.stop();
        });
      }
    }

    if (!blobToUse) {
      toast.error("No audio recorded", {
        description: "Please record audio first before generating notes.",
        duration: 4000,
      });
      return;
    }

    const maxFileSize = 25 * 1024 * 1024; // 25MB
    if (blobToUse.size > maxFileSize) {
      toast.error("Recording too large!", {
        description: `Maximum size is 25MB. Your recording is ${(
          blobToUse.size /
          1024 /
          1024
        ).toFixed(2)}MB. Please record a shorter audio.`,
        duration: 5000,
      });
      return;
    }

    setIsProcessing(true);

    const tempId = `audio-record-${Date.now()}`;
    setCurrentTempId(tempId);
    addLoadingNote(tempId, "audio-record", "uploading");

    await new Promise((resolve) => setTimeout(resolve, 300));

    onClose();

    try {
      const ext = blobToUse.type?.includes("ogg") ? "ogg" : "webm";
      const fileName = `recording-${Date.now()}.${ext}`;
      const file = new File([blobToUse], fileName, {
        type: blobToUse.type || "audio/webm",
      });

      // 1) Get presigned S3 URLs
      const urlRes = await fetch("/api/audio/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "audio/webm",
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

      // 2) Upload recording directly to S3
      updateLoadingNote(tempId, { stage: "uploading" });
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "audio/webm" },
      });

      if (!putRes.ok) {
        throw new Error("Failed to upload recording to storage");
      }

      // 3) Transcribe from S3 URL
      updateLoadingNote(tempId, { stage: "processing" });
      const response = await fetch("/api/audio/transcribe-from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioUrl: transcribeUrl,
          fileName: `recording-${Date.now()}`,
          folderId: null,
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
        setCurrentTempId(null);

        await new Promise((resolve) => setTimeout(resolve, 200));

        onTranscriptionComplete({
          transcript: {
            ...responseData.transcript,
            id: responseData.transcript?.id || tempId,
          },
          note: responseData.note || {},
        });

        triggerRefresh();

        setAudioBlob(null);
        setSeconds(0);
        setRecordingState("idle");
      } else {
        const errorData = await response.json();
        updateLoadingNote(tempId, {
          stage: "error",
          error: errorData.error || "Failed to transcribe audio",
        });
        throw new Error(errorData.error || "Failed to transcribe audio");
      }
    } catch (error) {
      console.error("Transcription error:", error);
      // Use local tempId (not currentTempId which is stale)
      updateLoadingNote(tempId, {
        stage: "error",
        error:
          error instanceof Error
            ? error.message
            : "Failed to transcribe audio",
      });
      toast.error("Failed to transcribe audio", {
        description:
          error instanceof Error
            ? error.message
            : "Please try again or contact support if the issue persists.",
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
            <HugeiconsIcon icon={Mic01Icon} className="size-5" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground truncate">
            Record audio
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

      {/* Recording area */}
      <div className="mb-8">
        {recordingState === "idle" && (
          <button
            type="button"
            onClick={handleStartRecording}
            disabled={isProcessing}
            className="w-full h-11 rounded-lg bg-red-600 text-white font-medium flex items-center justify-center gap-2.5 cursor-pointer hover:bg-primary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HugeiconsIcon icon={Mic01Icon} className="size-5 shrink-0" />
            <span>Start recording</span>
          </button>
        )}

        {recordingState === "recording" && (
          <div className="space-y-4 flex flex-col items-stretch">
            <div className="h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center gap-2.5">
              <HugeiconsIcon icon={Mic01Icon} className="size-5 shrink-0" />
              <span className="font-semibold text-sm tabular-nums">
                {formatTime(seconds)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleStop}
              className="w-full h-11 rounded-lg bg-muted text-foreground font-medium text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-muted/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <HugeiconsIcon icon={StopIcon} className="size-4 shrink-0" />
              <span>Stop</span>
            </button>
          </div>
        )}

        {recordingState === "paused" && (
          <div className="space-y-4 flex flex-col items-stretch">
            <div className="h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center gap-2.5">
              <HugeiconsIcon icon={Mic01Icon} className="size-5 shrink-0" />
              <span className="font-semibold text-sm tabular-nums">
                {formatTime(seconds)}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={handleDelete}
                className="h-10 rounded-lg bg-destructive/10 text-destructive font-medium text-sm flex items-center justify-center gap-1.5 cursor-pointer hover:bg-destructive/15 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <HugeiconsIcon
                  icon={Delete01Icon}
                  className="size-4 shrink-0"
                />
                <span>Delete</span>
              </button>
              <button
                type="button"
                onClick={handlePlayPreview}
                className="h-10 rounded-lg bg-muted text-foreground font-medium text-sm flex items-center justify-center gap-1.5 cursor-pointer hover:bg-muted/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <HugeiconsIcon
                  icon={isPlayingPreview ? StopIcon : PlayIcon}
                  className="size-4 shrink-0"
                />
                <span>{isPlayingPreview ? "Stop" : "Play"}</span>
              </button>
              <button
                type="button"
                onClick={handleResume}
                className="h-10 rounded-lg bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-1.5 cursor-pointer hover:bg-primary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <HugeiconsIcon icon={PlayIcon} className="size-4 shrink-0" />
                <span>Resume</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="h-10 rounded-lg bg-muted text-foreground font-medium text-sm flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span>Save</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Play to listen to what you&apos;ve recorded so far
            </p>
          </div>
        )}
      </div>

      {/* Hidden audio for preview playback when paused */}
      <audio
        ref={audioPreviewRef}
        className="sr-only"
        aria-hidden
        onEnded={stopPreviewPlayback}
      />

      {/* Form fields — premium select inputs with themed dropdown */}
      <div className="space-y-5 mb-8">
        <div className="space-y-2">
          <label
            className="block text-sm font-medium text-foreground"
            id="audio-language-label"
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
                aria-labelledby="audio-language-label"
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
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <label
            className="block text-sm font-medium text-foreground"
            id="folder-label"
          >
            Folder
          </label>
          <div className={selectWrapperClass}>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <HugeiconsIcon icon={Folder01Icon} className="size-4" />
            </div>
            <Select
              value={folder}
              onValueChange={setFolder}
              disabled={isProcessing}
            >
              <SelectTrigger
                className={selectTriggerClass}
                aria-labelledby="folder-label"
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

      {/* Generate Notes — premium gradient CTA */}
      <button
        type="button"
        onClick={handleGenerateNotes}
        disabled={
          isProcessing ||
          (!audioBlob &&
            recordingState !== "recording" &&
            recordingState !== "paused")
        }
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

export function NewNoteSection() {
  const { refreshNotes, addLoadingNote, removeLoadingNote, triggerRefresh, refreshTrigger } =
    useDashboardRefresh();
  const [showTextDialog, setShowTextDialog] = useState(false);
  const [showAudioDialog, setShowAudioDialog] = useState(false);
  const [showRecordAudioDialog, setShowRecordAudioDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { hasAccess: hasSubscription, loading: subscriptionLoading } =
    useSubscription();
  const [freeNotesRemaining, setFreeNotesRemaining] = useState<number | null>(null);

  // Fetch free tier note status
  const fetchFreeNoteStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/subscription/status?t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (data.features?.freeNotes) {
        setFreeNotesRemaining(data.features.freeNotes.remaining);
      }
    } catch (error) {
      console.error("Error fetching free note status:", error);
    }
  }, []);

  useEffect(() => {
    fetchFreeNoteStatus();
  }, [fetchFreeNoteStatus]);

  // Re-fetch when dashboard refreshes (e.g. after note creation)
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchFreeNoteStatus();
    }
  }, [refreshTrigger, fetchFreeNoteStatus]);

  // Gate premium features behind subscription (audio, link, etc.)
  const handlePremiumFeatureClick = (
    openDialog: (open: boolean) => void,
  ) => {
    if (hasSubscription) {
      openDialog(true);
    } else {
      setShowUpgradeModal(true);
    }
  };

  // Gate Document upload: allow if subscribed OR has free notes remaining
  const handleDocumentUploadClick = () => {
    if (hasSubscription || (freeNotesRemaining !== null && freeNotesRemaining > 0)) {
      setShowTextDialog(true);
    } else {
      setShowUpgradeModal(true);
    }
  };

  const handleLinkProcessComplete = (result: any) => {
    setShowLinkDialog(false);

    // Show success toast
    if (result.note && "id" in result.note) {
      toast.success("🔗 Link processed successfully! Notes generated.", {
        description: "Content extracted and notes created",
        duration: 4000,
      });
      // Immediately trigger counter refresh
      triggerRefresh();
      // Wait a bit longer to ensure database transaction is fully committed
      setTimeout(() => {
        refreshNotes();
      }, 1000);
    } else if (result.note && ("error" in result.note || "modelOverloaded" in result.note)) {
      toast.error("🔗 Note generation failed", {
        description: result.note?.message || "Content was saved but AI notes couldn't be generated. You can retry from the transcript.",
        duration: 6000,
      });
    } else {
      toast.success("🔗 Content extracted successfully!", {
        description: "Content saved as transcript",
        duration: 4000,
      });
    }
  };

  const handleCloseLinkDialog = () => {
    setShowLinkDialog(false);
  };

  const handleAudioTranscriptionComplete = (result: {
    transcript: { id: string; content: string };
    note: {
      id?: string;
      title?: string;
      content?: string;
      error?: string;
      message?: string;
    };
  }) => {
    setShowAudioDialog(false);

    if (result.note?.error) {
      toast.error("🎵 Audio transcribed but note generation failed", {
        description: result.note.message || "Audio was saved. You can retry generating notes from the transcript.",
        duration: 6000,
      });
    } else if (result.note && "id" in result.note) {
      toast.success("🎵 Audio processed successfully! Notes generated.", {
        description: "Audio transcribed and notes created",
        duration: 4000,
      });
      // Immediately trigger counter refresh
      triggerRefresh();
      // Wait a bit longer to ensure database transaction is fully committed
      setTimeout(() => {
        refreshNotes();
      }, 1000);
    } else {
      toast.warning("🎵 Audio transcribed successfully", {
        description: "Audio was saved but notes couldn't be generated. You can retry from the transcript.",
        duration: 5000,
      });
    }
  };

  const handleCloseAudioDialog = () => {
    setShowAudioDialog(false);
  };

  const handleRecordAudioComplete = (result: {
    transcript: { id: string; content: string };
    note: {
      id?: string;
      title?: string;
      content?: string;
      error?: string;
      message?: string;
    };
  }) => {
    setShowRecordAudioDialog(false);

    if (result.note?.error) {
      toast.error("🎤 Audio recorded but note generation failed", {
        description: result.note.message || "Recording was saved. You can retry generating notes from the transcript.",
        duration: 6000,
      });
    } else if (result.note && "id" in result.note) {
      toast.success("🎤 Audio recorded successfully! Notes generated.", {
        description: "Recording transcribed and notes created",
        duration: 4000,
      });
      // Immediately trigger counter refresh
      triggerRefresh();
      // Wait a bit longer to ensure database transaction is fully committed
      setTimeout(() => {
        refreshNotes();
      }, 1000);
    } else {
      toast.warning("🎤 Recording transcribed successfully", {
        description: "Recording was saved but notes couldn't be generated. You can retry from the transcript.",
        duration: 5000,
      });
    }
  };

  const handleCloseRecordAudioDialog = () => {
    setShowRecordAudioDialog(false);
  };

  const handleTextOrPDFProcessComplete = (result: ProcessPDFResult) => {
    setShowTextDialog(false);

    // Show success toast
    if (result.note && "id" in result.note) {
      toast.success("📝 Content processed successfully! Notes generated.", {
        description: "Content converted to AI-powered notes",
        duration: 4000,
      });
      // Immediately trigger counter refresh
      triggerRefresh();
      // Wait a bit longer to ensure database transaction is fully committed
      setTimeout(() => {
        refreshNotes();
      }, 1000);

      // Show upgrade modal for free users after they use their free note
      if (!hasSubscription) {
        setTimeout(() => {
          setShowUpgradeModal(true);
        }, 1500);
      }
    } else if (result.note && ("error" in result.note || "modelOverloaded" in result.note)) {
      // Note generation failed but transcript was saved
      const noteObj = result.note as { message?: string; modelOverloaded?: boolean };
      toast.error("📝 Note generation failed", {
        description: noteObj.message || "Content was saved but AI notes couldn't be generated. You can retry from the transcript.",
        duration: 6000,
      });
    } else {
      toast.success("📝 Content saved successfully!", {
        description: "Content saved as transcript",
        duration: 4000,
      });
    }
  };

  const handleCloseTextDialog = () => {
    setShowTextDialog(false);
  };

  const cardBase =
    "group flex w-full items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 text-left transition-colors hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer";

  const iconWrapperDefault =
    "flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted";
  const iconWrapperPrimary =
    "flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground";

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-xl font-medium tracking-tight text-foreground">
          New Note
        </h2>
        <p className="mt-0.5 text-muted-foreground">
          Record audio, upload files, or process YouTube videos and websites
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <Dialog
          open={showRecordAudioDialog}
          onOpenChange={setShowRecordAudioDialog}
        >
          <button
            type="button"
            className={cardBase}
            onClick={() =>
              handlePremiumFeatureClick(setShowRecordAudioDialog)
            }
          >
            <div className={iconWrapperPrimary}>
              <HugeiconsIcon icon={Mic01Icon} className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-semibold leading-snug text-foreground">
                Record audio
              </div>
              <div className="mt-0.5 text-sm leading-snug text-muted-foreground">
                Record live
              </div>
            </div>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            />
          </button>
          <DialogContent
            hideCloseButton
            className="max-w-[600px] bg-transparent border-none shadow-none p-0 overflow-visible"
          >
            <VisuallyHidden>
              <DialogTitle>Record Audio</DialogTitle>
            </VisuallyHidden>
            <AudioRecorderModal
              onClose={handleCloseRecordAudioDialog}
              onTranscriptionComplete={handleRecordAudioComplete}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showAudioDialog} onOpenChange={setShowAudioDialog}>
          <button
            type="button"
            className={cardBase}
            onClick={() =>
              handlePremiumFeatureClick(setShowAudioDialog)
            }
          >
            <div className={iconWrapperDefault}>
              <HugeiconsIcon
                icon={Upload01Icon}
                className="size-5 text-muted-foreground"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-semibold leading-snug text-foreground">
                Upload audio
              </div>
              <div className="mt-0.5 text-sm leading-snug text-muted-foreground">
                Upload an audio file
              </div>
            </div>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            />
          </button>
          <DialogContent
            hideCloseButton
            className="max-w-[600px] border border-border bg-card rounded-xl shadow-lg p-0 overflow-hidden"
          >
            <VisuallyHidden>
              <DialogTitle>Upload Audio</DialogTitle>
            </VisuallyHidden>
            <AudioUploadModal
              onClose={handleCloseAudioDialog}
              onTranscriptionComplete={handleAudioTranscriptionComplete}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showTextDialog} onOpenChange={setShowTextDialog}>
          <button
            type="button"
            className={cardBase}
            onClick={handleDocumentUploadClick}
          >
            <div className={iconWrapperDefault}>
              <HugeiconsIcon
                icon={File01Icon}
                className="size-5 text-muted-foreground"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-semibold leading-snug text-foreground">
                Document upload
              </div>
              <div className="mt-0.5 text-sm leading-snug text-muted-foreground">
                PDF or paste text
              </div>
            </div>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            />
          </button>
          <DialogContent
            hideCloseButton
            className="max-w-[600px] bg-transparent border-none shadow-none p-0 overflow-hidden"
          >
            <VisuallyHidden>
              <DialogTitle>Upload Text or PDF</DialogTitle>
            </VisuallyHidden>
            <UploadTextModal
              onClose={handleCloseTextDialog}
              onProcessComplete={handleTextOrPDFProcessComplete}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
          <button
            type="button"
            className={cardBase}
            onClick={() =>
              handlePremiumFeatureClick(setShowLinkDialog)
            }
          >
            <div className={iconWrapperDefault}>
              <HugeiconsIcon
                icon={Link01Icon}
                className="size-5 text-muted-foreground"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-semibold leading-snug text-foreground">
                Website link
              </div>
              <div className="mt-0.5 text-sm leading-snug text-muted-foreground">
                YouTube or website link
              </div>
            </div>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            />
          </button>
          <DialogContent
            hideCloseButton
            className="max-w-[600px] bg-transparent border-none shadow-none p-0 overflow-hidden"
          >
            <VisuallyHidden>
              <DialogTitle>Add Link</DialogTitle>
            </VisuallyHidden>
            <AddLinkModal
              onClose={handleCloseLinkDialog}
              onProcessComplete={handleLinkProcessComplete}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Upgrade paywall modal for free users */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
      />
    </div>
  );
}
