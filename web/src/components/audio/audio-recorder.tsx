"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, Play, Square } from "lucide-react";
import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";
import { useUpgradeModal } from "@/contexts/upgrade-modal-context";
import { toast } from "sonner";

interface AudioRecorderProps {
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

export default function AudioRecorder({
  onTranscriptionComplete,
  onClose,
}: AudioRecorderProps) {
  const { addLoadingNote, updateLoadingNote, removeLoadingNote, triggerRefresh } = useDashboardRefresh();
  const { openUpgradeModal } = useUpgradeModal();
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTempId, setCurrentTempId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (25MB limit for OpenAI Whisper)
      const maxFileSize = 25 * 1024 * 1024; // 25MB
      if (file.size > maxFileSize) {
        toast.error("File too large!", {
          description: `Maximum size is 25MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB. Please compress or choose a smaller file.`,
          duration: 5000,
        });
        event.target.value = ''; // Clear the input
        return;
      }

      // Check file type
      const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac', 'audio/m4a', 'audio/ogg', 'audio/webm', 'audio/mp4'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Unsupported audio format", {
          description: `Format: ${file.type}. Please use MP3, WAV, FLAC, M4A, OGG, WebM, or MP4.`,
          duration: 5000,
        });
        event.target.value = ''; // Clear the input
        return;
      }

      setAudioBlob(file);
      setFileName(file.name.replace(/\.[^/.]+$/, "")); // Remove extension
    }
  };

  const playAudio = () => {
    if (audioBlob && !isPlaying) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.play();
      setIsPlaying(true);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);

    const tempId = `audio-upload-${Date.now()}`;
    setCurrentTempId(tempId);
    addLoadingNote(tempId, "audio", "uploading");

    await new Promise(resolve => setTimeout(resolve, 300));

    if (onClose) {
      onClose();
    }

    const file = audioBlob instanceof File ? audioBlob : new File([audioBlob], fileName || "uploaded-audio", { type: audioBlob.type });
    const fileDisplayName = fileName || (file.name?.replace(/\.[^/.]+$/, "") ?? "uploaded-audio");

    try {
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

      updateLoadingNote(tempId, { stage: "uploading" });
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "audio/mpeg" },
      });

      if (!putRes.ok) {
        throw new Error("Failed to upload file to storage");
      }

      updateLoadingNote(tempId, { stage: "processing" });
      const response = await fetch("/api/audio/transcribe-from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioUrl: transcribeUrl,
          fileName: fileDisplayName,
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

        await new Promise(resolve => setTimeout(resolve, 200));

        onTranscriptionComplete({
          transcript: {
            ...responseData.transcript,
            id: responseData.transcript?.id || tempId,
          },
          note: responseData.note || {},
        });

        triggerRefresh();

        setAudioBlob(null);
        setFileName("");
        setIsPlaying(false);
      } else {
        const errorData = await response.json();
        updateLoadingNote(tempId, {
          stage: "error",
          error: errorData.error || "Failed to transcribe audio",
        });
        if (response.status === 403 && errorData.error === "FREE_TIER_LIMIT_REACHED") {
          openUpgradeModal();
          return;
        }
        if (response.status === 413) {
          throw new Error(errorData.error || "Audio file exceeds 25MB limit");
        }
        if (response.status === 402) {
          throw new Error("Insufficient credits to process audio");
        }
        if (response.status === 400) {
          throw new Error(errorData.error || "Invalid audio file format");
        }
        throw new Error(errorData.error || "Failed to transcribe audio");
      }
    } catch (error) {
      console.error("Transcription error:", error);
      // Use local tempId (not currentTempId which is stale)
      updateLoadingNote(tempId, {
        stage: "error",
        error: error instanceof Error ? error.message : "Failed to transcribe audio",
      });
      toast.error("Failed to transcribe audio", {
        description: error instanceof Error ? error.message : "Please try again or contact support if the issue persists.",
        duration: 5000,
      });
    } finally {
      // Don't remove loading note in finally — let error state show if there was an error
      // Successful path already called removeLoadingNote above
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-dashed border-accent/30 bg-accent/5 p-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-accent flex items-center justify-center ">
            <Upload className="h-8 w-8 text-accent-foreground" />
          </div>
          
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-foreground">Upload Audio File</h3>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              Upload an audio file to generate transcripts and summaries (25MB limit)
            </p>
            <p className="text-xs text-muted-foreground">
              Supported formats: MP3, WAV, FLAC, M4A, OGG, WebM, MP4
            </p>
          </div>

          <div className="space-y-4 max-w-lg mx-auto">
            <div className="text-left">
              <label
                htmlFor="audio-upload"
                className="block text-sm font-semibold text-foreground mb-3"
              >
                Select Audio File
              </label>
              <Input
                id="audio-upload"
                type="file"
                accept=".wav,.mp3,.aiff,.aac,.ogg,.flac"
                onChange={handleFileUpload}
                className="h-10 rounded-xl border-2 border-border/20 bg-background text-foreground cursor-pointer text-center flex items-center justify-center file:mr-4 file:py-1 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 focus:border-accent/50 transition-colors"
              />
            </div>

            {/* Audio Preview */}
            {audioBlob && (
              <div className="space-y-4 p-6 rounded-xl bg-accent/10 border border-accent/20">
                <div className="text-sm text-muted-foreground text-center">
                  File size: {(audioBlob.size / 1024 / 1024).toFixed(2)}MB 
                  {audioBlob.size > 20 * 1024 * 1024 && (
                    <span className="text-amber-600 dark:text-amber-400 font-medium"> (approaching 25MB limit)</span>
                  )}
                  {audioBlob.size > 25 * 1024 * 1024 && (
                    <span className="text-red-600 dark:text-red-400 font-medium"> (exceeds 25MB limit!)</span>
                  )}
                </div>
                <div className="flex gap-3">
                  {!isPlaying ? (
                    <Button 
                      onClick={playAudio} 
                      variant="outline" 
                      size="sm"
                      className="rounded-xl"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Play
                    </Button>
                  ) : (
                    <Button 
                      onClick={stopAudio} 
                      variant="outline" 
                      size="sm"
                      className="rounded-xl"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="fileName"
                    className="block text-sm font-semibold text-foreground mb-2"
                  >
                    File Name (Optional)
                  </label>
                  <Input
                    id="fileName"
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="Enter a name for this audio"
                    className="h-10 rounded-xl border-2 border-border/20 bg-background text-foreground placeholder:text-muted-foreground focus:border-accent/50 transition-colors"
                  />
                </div>

                <Button
                  onClick={transcribeAudio}
                  disabled={isProcessing}
                  className="w-full h-12 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold "
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Transcribing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mr-2" />
                      Transcribe & Generate Summary
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
