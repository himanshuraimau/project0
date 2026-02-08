"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  CloudUpload,
  FileText,
  Globe,
  Link,
  Mic,
  Upload,
  Video,
  X,
  StopCircle,
  Trash2,
  Play,
  Save,
  Sparkles,
  Pin,
  ChevronDown,
} from "lucide-react";
import { UploadTextModal } from "@/components/pdf";
import { ProcessPDFResult } from "@/lib/types";
import { AudioRecorder, AudioUploadModal } from "@/components/audio";
import { AddLinkModal } from "@/components/link";
import { Inter } from "next/font/google";
import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";
import { toast } from "sonner";

const inter = Inter({ subsets: ["latin"] });

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

function AudioRecorderModal({ onClose, onTranscriptionComplete }: AudioRecorderModalProps) {
  const { addLoadingNote, updateLoadingNote, removeLoadingNote, triggerRefresh } = useDashboardRefresh();
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [audioLanguage, setAudioLanguage] = useState("English");
  const [folder, setFolder] = useState("All notes");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTempId, setCurrentTempId] = useState<string | null>(null);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const mimeTypeRef = React.useRef<string>("audio/webm");
  const recordingTimerRef = React.useRef<NodeJS.Timeout | null>(null);

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
          description: "Your browser doesn't support audio recording. Please try a different browser.",
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
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeTypeRef.current,
        });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecordingState("recording");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording", {
        description: "Please ensure microphone access is granted and try again.",
        duration: 5000,
      });
    }
  };

  const handleStop = () => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.stop();
      setRecordingState("paused");
    }
  };

  const handleResume = () => {
    // For resume, we need to start a new recording session
    handleStartRecording();
  };

  const handleDelete = () => {
    setRecordingState("idle");
    setSeconds(0);
    setAudioBlob(null);
    audioChunksRef.current = [];
  };

  const handleSave = () => {
    // This would save without generating notes
    console.log("Saving recording...");
  };

  const handleGenerateNotes = async () => {
    if (!audioBlob) {
      toast.error("No audio recorded", {
        description: "Please record audio first before generating notes.",
        duration: 4000,
      });
      return;
    }

    const maxFileSize = 25 * 1024 * 1024; // 25MB
    if (audioBlob.size > maxFileSize) {
      toast.error("Recording too large!", {
        description: `Maximum size is 25MB. Your recording is ${(
          audioBlob.size / 1024 / 1024
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
      updateLoadingNote(tempId, { stage: "processing" });

      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("fileName", `recording-${Date.now()}`);

      const response = await fetch("/api/audio/transcribe", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();

        // Extract data from API response
        const responseData = result.data || result;

        // Update loading note with transcript ID and stage
        if (responseData.transcript?.id) {
          updateLoadingNote(tempId, { 
            transcriptId: responseData.transcript.id,
            stage: "generating"
          });
        }

        // If note was generated, update with note ID
        if (responseData.note?.id) {
          updateLoadingNote(tempId, { 
            noteId: responseData.note.id,
            stage: "completed"
          });
        }

        if (currentTempId) {
          removeLoadingNote(currentTempId);
          setCurrentTempId(null);
        }

        await new Promise((resolve) => setTimeout(resolve, 200));

        onTranscriptionComplete({
          transcript: {
            ...responseData.transcript,
            id: responseData.transcript?.id || tempId,
          },
          note: responseData.note || {},
        });

        // Trigger refresh to update note counter immediately
        triggerRefresh();

        setAudioBlob(null);
        setSeconds(0);
        setRecordingState("idle");
      } else {
        const errorData = await response.json();
        updateLoadingNote(tempId, { 
          stage: "error",
          error: errorData.error || "Failed to transcribe audio"
        });
        throw new Error(errorData.error || "Failed to transcribe audio");
      }
    } catch (error) {
      console.error("Transcription error:", error);
      if (currentTempId) {
        updateLoadingNote(currentTempId, { 
          stage: "error",
          error: error instanceof Error ? error.message : "Failed to transcribe audio"
        });
      }
      toast.error("Failed to transcribe audio", {
        description: error instanceof Error ? error.message : "Please try again or contact support if the issue persists.",
        duration: 5000,
      });
    } finally {
      if (currentTempId) {
        removeLoadingNote(currentTempId);
        setCurrentTempId(null);
      }
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-[664px] bg-white dark:bg-zinc-900 rounded-[29px] px-6 py-11">
      {/* Header */}
      <div className="flex items-center justify-between mb-20">
        <h2 className="text-[24px] font-bold text-[#101828] dark:text-white leading-[30px]">Record audio</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors w-9 h-[33px]"
        >
          <X size={36} className="text-[#99A1AF]" strokeWidth={2.5} />
        </button>
      </div>

      {/* Dynamic Recording Area */}
      <div className="mb-8">
        {recordingState === "idle" && (
          <button
            onClick={handleStartRecording}
            disabled={isProcessing}
            className="w-[330px] h-12 mx-auto bg-gradient-to-r from-[#FF6467] to-[#FB64B6] text-white font-bold rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Mic size={26} />
            <span className="text-[19px] leading-5">Start recording</span>
          </button>
        )}

        {recordingState === "recording" && (
          <div className="space-y-[21px] flex flex-col items-center">
            <div className="w-[330px] h-12 bg-gradient-to-r from-[#FF6467] to-[#FB64B6] text-white rounded-2xl flex items-center justify-center gap-3">
              <Mic size={20} />
              <span className="font-bold text-[19px] leading-5">{formatTime(seconds)}</span>
            </div>
            <button
              onClick={handleStop}
              className="w-[330px] h-12 bg-[#8F8F8F] text-white font-bold rounded-2xl hover:bg-[#7a7a7a] transition-colors"
            >
              <span className="text-[19px] leading-6">Stop</span>
            </button>
          </div>
        )}

        {recordingState === "paused" && (
          <div className="space-y-3 flex flex-col items-center">
            <div className="w-[330px] h-12 bg-gradient-to-r from-[#FF6467] to-[#FB64B6] text-white rounded-2xl flex items-center justify-center gap-3">
              <Mic size={20} />
              <span className="font-bold text-[19px] leading-5">{formatTime(seconds)}</span>
            </div>
            <div className="flex gap-3 w-[330px]">
              <button
                onClick={handleDelete}
                className="flex-1 h-12 bg-[#FFE2E2] text-[#FB2C36] rounded-2xl hover:bg-[#ffd0d0] transition-colors flex items-center justify-center"
              >
                <span className="text-[16px] leading-6">Delete</span>
              </button>
              <button
                onClick={handleResume}
                className="flex-1 h-12 bg-[#FB2C36] text-white rounded-2xl hover:bg-[#e02832] transition-colors flex items-center justify-center"
              >
                <span className="text-[16px] leading-6">Resume</span>
              </button>
              <button
                onClick={handleSave}
                className="flex-1 h-12 bg-[#8F8F8F] text-white rounded-2xl hover:bg-[#7a7a7a] transition-colors flex items-center justify-center"
              >
                <span className="text-[16px] leading-6">Save</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Fields */}
      <div className="space-y-6 mb-[63px]">
        <div>
          <label className="block text-[19px] font-bold text-[#364153] dark:text-gray-300 mb-[14px] leading-5">
            Audio language
          </label>
          <div className="relative">
            <select
              value={audioLanguage}
              onChange={(e) => setAudioLanguage(e.target.value)}
              className="w-full h-[53px] px-3 pr-10 bg-white dark:bg-zinc-800 border-[1.5px] border-[#D4D4D4] dark:border-zinc-700 rounded-[10px] appearance-none text-[16px] text-[#0A0A0A] dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-pink-500 focus:border-transparent"
            >
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
              <option>Chinese</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#717182] opacity-50 pointer-events-none"
              strokeWidth={1.33}
            />
          </div>
        </div>

        <div>
          <label className="block text-[19px] font-bold text-[#364153] dark:text-gray-300 mb-2 leading-5">
            Folder
          </label>
          <div className="relative">
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="w-full h-[53px] px-3 pr-10 bg-white dark:bg-zinc-800 border-[1.5px] border-[#E2E2E2] dark:border-zinc-700 rounded-[10px] appearance-none text-[16px] font-bold text-[#0A0A0A] dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-pink-500 focus:border-transparent"
            >
              <option>📁 All notes</option>
              <option>📁 Work</option>
              <option>📁 Personal</option>
              <option>📁 Projects</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#717182] opacity-50 pointer-events-none"
              strokeWidth={1.33}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <button
        onClick={handleGenerateNotes}
        disabled={isProcessing || !audioBlob}
        className="w-full max-w-[406px] h-[51px] mx-auto bg-black dark:bg-white text-white dark:text-black font-bold rounded-[15px] hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Sparkles size={20} />
        <span className="text-[21px] leading-5">{isProcessing ? "Processing..." : "Generate Notes"}</span>
      </button>
    </div>
  );
}


export function NewNoteSection() {
  const { refreshNotes, addLoadingNote, removeLoadingNote, triggerRefresh } =
    useDashboardRefresh();
  const [showTextDialog, setShowTextDialog] = useState(false);
  const [showAudioDialog, setShowAudioDialog] = useState(false);
  const [showRecordAudioDialog, setShowRecordAudioDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  const handleLinkProcessComplete = (result: any) => {
    setShowLinkDialog(false);

    // Show success toast
    if (result.note?.id) {
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
      toast.error("🎵 Audio transcribed but note creation failed", {
        description: result.note.message || "Unknown error occurred",
        duration: 5000,
      });
    } else if (result.note?.id) {
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
      toast.error("🎤 Audio recorded but note creation failed", {
        description: result.note.message || "Unknown error occurred",
        duration: 5000,
      });
    } else if (result.note?.id) {
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



  return (
    <div className={`w-full ${inter.className}`}>
      <div className="flex gap-1.5 flex-col">
        <h2
          className={`dark:text-white text-black text-[20px] font-medium leading-[24px]`}
        >
          New Note
        </h2>
        <p className={`text-[15px] tracking-[-3%] text-[#787878]`}>
          Record audio, upload files, or process YouTube videos and websites
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mt-8">
        <Dialog
          open={showRecordAudioDialog}
          onOpenChange={setShowRecordAudioDialog}
        >
          <button
            className="gradient-element px-8 h-[76px] rounded-[16px] cursor-pointer w-full"
            onClick={() => setShowRecordAudioDialog(true)}
          >
            <div className="flex items-center justify-between w-full min-w-0">
              <div className="flex gap-6 items-center">
                <div className="text-[18px] leading-5 text-white font-medium">
                  Record Audio
                </div>
                <Mic className="text-white" size={20} />
              </div>
            </div>
          </button>
          <DialogContent hideCloseButton className="max-w-[664px] bg-white dark:bg-white border-none shadow-2xl rounded-[29px] p-0 overflow-hidden">
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
            className="px-8 h-[76px] rounded-[16px] cursor-pointer bg-[#F1F1F1] dark:bg-[#1A1A1A] border border-neutral-100 dark:border-[hsl(0,0%,12%)] w-full"
            onClick={() => setShowAudioDialog(true)}
          >
            <div className="flex items-center justify-between w-full min-w-0">
              <div className="flex gap-6 items-center">
                <div className="text-[18px] leading-5 text-black dark:text-white font-medium">
                  Upload Audio
                </div>
                <Upload size={20} />
              </div>
            </div>
          </button>
          <DialogContent hideCloseButton className="max-w-[650px] bg-white dark:bg-white border-none shadow-2xl rounded-2xl p-0 overflow-hidden">
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
            className="px-8 h-[76px] rounded-[16px] cursor-pointer bg-[#F1F1F1] dark:bg-[#1A1A1A] border border-neutral-100 dark:border-[hsl(0,0%,12%)] w-full"
            onClick={() => setShowTextDialog(true)}
          >
            <div className="flex items-center justify-between w-full min-w-0">
              <div className="flex gap-6 items-center">
                <div className="text-[18px] leading-5 text-black dark:text-white font-medium">
                  Upload PDF or Add Text
                </div>
                <FileText size={20} />
              </div>
            </div>
          </button>
          <DialogContent hideCloseButton className="max-w-[600px] bg-transparent border-none shadow-none p-0 overflow-hidden">
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
            className="px-8 h-[76px] rounded-[16px] cursor-pointer bg-[#F1F1F1] dark:bg-[#1A1A1A] border border-neutral-100 dark:border-[hsl(0,0%,12%)] w-full"
            onClick={() => setShowLinkDialog(true)}
          >
            <div className="flex items-center justify-between w-full min-w-0">
              <div className="flex gap-6 items-center">
                <div className="text-[18px] leading-5 text-black dark:text-white font-medium">
                  Youtube Video or Web Links
                </div>
                <Video size={20} />
              </div>
            </div>
          </button>
          <DialogContent hideCloseButton className="max-w-[600px] bg-transparent border-none shadow-none p-0 overflow-hidden">
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
    </div>
  );
}
