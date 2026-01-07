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
import { SimplePDFProcessor, UploadTextModal } from "@/components/pdf";
import { ProcessPDFResult } from "@/lib/types";
import { AudioRecorder, AudioUploadModal } from "@/components/audio";
import { AddLinkModal } from "@/components/link";
import { Inter } from "next/font/google";
import { Plus_Jakarta_Sans } from "next/font/google";
import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";
import { toast } from "sonner";

const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin-ext", "vietnamese"],
});

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
  const { addLoadingNote, removeLoadingNote } = useDashboardRefresh();
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
        alert("Your browser doesn't support audio recording.");
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
      alert("Failed to start recording. Please ensure microphone access is granted.");
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
      alert("Please record audio first!");
      return;
    }

    const maxFileSize = 25 * 1024 * 1024; // 25MB
    if (audioBlob.size > maxFileSize) {
      alert(
        `Recording too large! Maximum size is 25MB. Your recording is ${(
          audioBlob.size / 1024 / 1024
        ).toFixed(2)}MB.`
      );
      return;
    }

    setIsProcessing(true);

    const tempId = `audio-record-${Date.now()}`;
    setCurrentTempId(tempId);
    addLoadingNote(tempId, "audio");

    await new Promise((resolve) => setTimeout(resolve, 300));

    onClose();

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("fileName", `recording-${Date.now()}`);

      const response = await fetch("/api/audio/transcribe", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();

        if (currentTempId) {
          removeLoadingNote(currentTempId);
          setCurrentTempId(null);
        }

        await new Promise((resolve) => setTimeout(resolve, 200));

        onTranscriptionComplete({
          ...result,
          transcript: {
            ...result.transcript,
            id: result.transcript.id || tempId,
          },
        });

        setAudioBlob(null);
        setSeconds(0);
        setRecordingState("idle");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to transcribe audio");
      }
    } catch (error) {
      console.error("Transcription error:", error);
      alert(
        "Failed to transcribe audio. Please try again. Error: " +
        (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      if (currentTempId) {
        removeLoadingNote(currentTempId);
        setCurrentTempId(null);
      }
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Record audio</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Dynamic Recording Area */}
      <div className="mb-8">
        {recordingState === "idle" && (
          <button
            onClick={handleStartRecording}
            disabled={isProcessing}
            className="w-full h-14 bg-gradient-to-r from-[#ff6b6b] to-[#ff8fa3] text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Mic size={20} />
            Start recording
          </button>
        )}

        {recordingState === "recording" && (
          <div className="space-y-3">
            <div className="w-full h-14 bg-gradient-to-r from-[#ff6b6b] to-[#ff8fa3] text-white rounded-xl flex items-center justify-center gap-2">
              <Mic size={24} />
              <span className="font-mono text-lg font-semibold">{formatTime(seconds)}</span>
            </div>
            <button
              onClick={handleStop}
              className="w-full h-14 bg-gray-500 dark:bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors"
            >
              Stop
            </button>
          </div>
        )}

        {recordingState === "paused" && (
          <div className="space-y-3">
            <div className="w-full h-14 bg-gradient-to-r from-[#ff6b6b] to-[#ff8fa3] text-white rounded-xl flex items-center justify-center gap-2">
              <Mic size={24} />
              <span className="font-mono text-lg font-semibold">{formatTime(seconds)}</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 h-14 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Delete
              </button>
              <button
                onClick={handleResume}
                className="flex-1 h-14 bg-gradient-to-r from-[#ff6b6b] to-[#ff8fa3] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Play size={18} />
                Resume
              </button>
              <button
                onClick={handleSave}
                className="flex-1 h-14 bg-gray-500 dark:bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Save
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Fields */}
      <div className="space-y-5 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Audio language
          </label>
          <div className="relative">
            <select
              value={audioLanguage}
              onChange={(e) => setAudioLanguage(e.target.value)}
              className="w-full h-12 px-4 pr-10 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl appearance-none text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-pink-500 focus:border-transparent"
            >
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
              <option>Chinese</option>
            </select>
            <ChevronDown
              size={20}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Folder
          </label>
          <div className="relative">
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="w-full h-12 px-4 pr-10 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl appearance-none text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-pink-500 focus:border-transparent"
            >
              <option>📌 All notes</option>
              <option>📁 Work</option>
              <option>📁 Personal</option>
              <option>📁 Projects</option>
            </select>
            <ChevronDown
              size={20}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <button
        onClick={handleGenerateNotes}
        disabled={isProcessing || !audioBlob}
        className="w-full h-14 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Sparkles size={20} />
        {isProcessing ? "Processing..." : "Generate Notes"}
      </button>
    </div>
  );
}


export function NewNoteSection() {
  const { refreshNotes, addLoadingNote, removeLoadingNote } =
    useDashboardRefresh();
  const [showPDFDialog, setShowPDFDialog] = useState(false);
  const [showAudioDialog, setShowAudioDialog] = useState(false);
  const [showRecordAudioDialog, setShowRecordAudioDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [pdfMode, setPdfMode] = useState<"pdf" | "text">("text");

  const handleLinkProcessComplete = (result: any) => {
    setShowLinkDialog(false);

    // Show success toast
    if (result.note?.id) {
      toast.success("🔗 Link processed successfully! Notes generated.", {
        description: "Content extracted and notes created",
        duration: 4000,
      });
      // Refresh notes immediately
      refreshNotes();
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
      // Refresh notes immediately - shimmer should already be removed by processor
      refreshNotes();
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
      // Refresh notes immediately - shimmer should already be removed by processor
      refreshNotes();
    }
  };

  const handleCloseRecordAudioDialog = () => {
    setShowRecordAudioDialog(false);
  };

  const handlePDFProcessComplete = (result: ProcessPDFResult) => {
    setShowPDFDialog(false);

    // Show success toast
    if (result.note && "id" in result.note) {
      toast.success("📄 PDF processed successfully! Notes generated.", {
        description: "PDF content extracted and notes created",
        duration: 4000,
      });
      // Refresh notes immediately - shimmer should already be removed by processor
      refreshNotes();
    } else {
      toast.success("📄 PDF content extracted successfully!", {
        description: "Content saved as transcript",
        duration: 4000,
      });
    }
  };

  const handleClosePDFDialog = () => {
    setShowPDFDialog(false);
    // Reset to text mode when closing
    setPdfMode("text");
  };

  const handleTextProcessComplete = (result: ProcessPDFResult) => {
    setShowPDFDialog(false);

    // Show success toast
    if (result.note && "id" in result.note) {
      toast.success("📝 Text processed successfully! Notes generated.", {
        description: "Text content converted to AI-powered notes",
        duration: 4000,
      });
      // Refresh notes immediately - shimmer should already be removed by processor
      refreshNotes();
    } else {
      toast.success("📝 Text saved successfully!", {
        description: "Content saved as transcript",
        duration: 4000,
      });
    }
  };

  const handleOpenPDFFromText = () => {
    // When Import PDF is clicked from text modal, switch to PDF mode
    setPdfMode("pdf");
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
          <DialogContent className="max-w-[500px] bg-white dark:bg-white border-none shadow-2xl rounded-2xl p-0 overflow-hidden">
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
          <DialogContent className="max-w-[650px] bg-white dark:bg-white border-none shadow-2xl rounded-2xl p-0 overflow-hidden">
            <VisuallyHidden>
              <DialogTitle>Upload Audio</DialogTitle>
            </VisuallyHidden>
            <AudioUploadModal
              onClose={handleCloseAudioDialog}
              onTranscriptionComplete={handleAudioTranscriptionComplete}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showPDFDialog} onOpenChange={setShowPDFDialog}>
          <button
            className="px-8 h-[76px] rounded-[16px] cursor-pointer bg-[#F1F1F1] dark:bg-[#1A1A1A] border border-neutral-100 dark:border-[hsl(0,0%,12%)] w-full"
            onClick={() => setShowPDFDialog(true)}
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
          <DialogContent className={pdfMode === "text" ? "max-w-[600px] bg-transparent border-none shadow-none p-0 overflow-hidden" : "max-w-4xl max-h-[90vh] overflow-hidden"}>
            {pdfMode === "text" ? (
              <>
                <VisuallyHidden>
                  <DialogTitle>Upload Text</DialogTitle>
                </VisuallyHidden>
                <UploadTextModal
                  onClose={handleClosePDFDialog}
                  onProcessComplete={handleTextProcessComplete}
                  onOpenPDFDialog={handleOpenPDFFromText}
                />
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className={`text-left ${jakarta.className}`}>
                    Upload PDF & Generate Notes
                  </DialogTitle>
                  <DialogDescription className={`${jakarta.className}`}>
                    Upload PDF documents and extract content to generate
                    comprehensive AI-powered notes.
                  </DialogDescription>
                </DialogHeader>
                <div className="pt-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                  <SimplePDFProcessor
                    onProcessComplete={handlePDFProcessComplete}
                    onClose={handleClosePDFDialog}
                  />
                </div>
              </>
            )}
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
          <DialogContent className="max-w-[600px] bg-transparent border-none shadow-none p-0 overflow-hidden">
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
