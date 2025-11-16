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
import {
  CloudUpload,
  FileText,
  Globe,
  Link,
  Mic,
  Upload,
  Video,
} from "lucide-react";
import { SimplePDFProcessor } from "@/components/pdf";
import { ProcessPDFResult } from "@/lib/types";
import { AudioRecorder, RecordAudio } from "@/components/audio";
import { YouTubeProcessor } from "@/components/transcript";
import { WebpageProcessor } from "@/components/webpage";
import { Inter } from "next/font/google";
import { Plus_Jakarta_Sans } from "next/font/google";
import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";
import { toast } from "sonner";

const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin-ext", "vietnamese"],
});

const inter = Inter({ subsets: ["latin"] });

export function NewNoteSection() {
  const { refreshNotes, addLoadingNote, removeLoadingNote } =
    useDashboardRefresh();
  const [showPDFDialog, setShowPDFDialog] = useState(false);
  const [showAudioDialog, setShowAudioDialog] = useState(false);
  const [showRecordAudioDialog, setShowRecordAudioDialog] = useState(false);
  const [showYouTubeDialog, setShowYouTubeDialog] = useState(false);
  const [showWebpageDialog, setShowWebpageDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkType, setLinkType] = useState<"youtube" | "webpage">("youtube");

  const handleWebpageProcessComplete = (result: {
    transcript: {
      id: string;
      title: string;
      content: string;
      url: string;
      originalName: string;
    };
    note?: { id: string; title: string; content: string };
  }) => {
    setShowWebpageDialog(false);
    setShowLinkDialog(false);

    // Show success toast
    if (result.note?.id) {
      toast.success("🌐 Webpage processed successfully! Notes generated.", {
        description: `Extracted content from "${result.transcript.title}"`,
        duration: 4000,
      });
      // Refresh notes immediately - shimmer should already be removed by processor
      refreshNotes();
    } else {
      toast.success("🌐 Webpage content extracted successfully!", {
        description: "Content saved as transcript",
        duration: 4000,
      });
    }
  };

  const handleCloseWebpageDialog = () => {
    setShowWebpageDialog(false);
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
  };

  const handleYouTubeTranscriptComplete = (result: {
    transcript: { id: string; content: string; originalName: string };
    note?: { id: string; title: string; content: string };
  }) => {
    setShowYouTubeDialog(false);
    setShowLinkDialog(false);

    // Show success toast
    if (result.note?.id) {
      toast.success(
        "🎥 YouTube video processed successfully! Notes generated.",
        {
          description: `Extracted content from "${result.transcript.originalName}"`,
          duration: 4000,
        }
      );
      // Refresh notes immediately - shimmer should already be removed by processor
      refreshNotes();
    } else {
      toast.success("🎥 YouTube transcript extracted successfully!", {
        description: "Content saved as transcript",
        duration: 4000,
      });
    }
  };

  const handleCloseYouTubeDialog = () => {
    setShowYouTubeDialog(false);
    setShowLinkDialog(false);
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

      <div className="flex gap-6 mt-8">
        <Dialog
          open={showRecordAudioDialog}
          onOpenChange={setShowRecordAudioDialog}
        >
          <button
            className="gradient-element px-8 h-[76px] rounded-[16px] cursor-pointer"
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
          <DialogContent className="max-w-2xl bg-white dark:bg-[#1A1A1A] border-neutral-200 dark:border-[#1F1F1F] max-h-[90vh] overflow-hidden">
            <DialogHeader className="">
              <h1 className="text-black dark:text-white text-[20px] font-medium leading-[30px]">
                Record Audio & Generate Notes
              </h1>
              <p className="-mt-2 text-[#787878] text-[15px] tracking-[-3%]">
                Record audio content and automatically generate AI-powered notes
                from the transcription.
              </p>
            </DialogHeader>
            <div className=" overflow-y-auto max-h-[calc(90vh-120px)]">
              <RecordAudio
                onTranscriptionComplete={handleRecordAudioComplete}
                onClose={handleCloseRecordAudioDialog}
              />
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showAudioDialog} onOpenChange={setShowAudioDialog}>
          <button
            className="px-8 h-[76px] rounded-[16px] cursor-pointer bg-[#F1F1F1] dark:bg-[#1A1A1A] border border-neutral-100 dark:border-[hsl(0,0%,12%)]"
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className={`text-left ${jakarta.className}`}>
                Upload Audio File & Generate Notes
              </DialogTitle>
              <DialogDescription className={`${jakarta.className}`}>
                Upload audio files from your device and automatically generate
                AI-powered notes from the transcription.
              </DialogDescription>
            </DialogHeader>
            <div className="pt-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <AudioRecorder
                onTranscriptionComplete={handleAudioTranscriptionComplete}
                onClose={handleCloseAudioDialog}
              />
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showPDFDialog} onOpenChange={setShowPDFDialog}>
          <button
            className="px-8 h-[76px] rounded-[16px] cursor-pointer bg-[#F1F1F1] dark:bg-[#1A1A1A] border border-neutral-100 dark:border-[hsl(0,0%,12%)]"
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
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
          </DialogContent>
        </Dialog>

        <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
          <button
            className="px-8 h-[76px] rounded-[16px] cursor-pointer bg-[#F1F1F1] dark:bg-[#1A1A1A] border border-neutral-100 dark:border-[hsl(0,0%,12%)]"
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className={`text-left ${jakarta.className}`}>
                Process Links & Generate Notes
              </DialogTitle>
              <DialogDescription className={`${jakarta.className}`}>
                Extract content from YouTube videos or websites and generate
                AI-powered notes.
              </DialogDescription>
            </DialogHeader>
            <div className="pt-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Tab Selector */}
              <div className="flex items-center justify-center mb-6">
                <div className="flex bg-muted rounded-lg p-1">
                  <button
                    onClick={() => setLinkType("youtube")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      linkType === "youtube"
                        ? "bg-background text-foreground "
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    YouTube
                  </button>
                  <button
                    onClick={() => setLinkType("webpage")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      linkType === "webpage"
                        ? "bg-background text-foreground "
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Website
                  </button>
                </div>
              </div>

              {/* Content based on selected tab */}
              {linkType === "youtube" ? (
                <YouTubeProcessor
                  onProcessComplete={handleYouTubeTranscriptComplete}
                  onClose={handleCloseYouTubeDialog}
                />
              ) : (
                <WebpageProcessor
                  onProcessComplete={handleWebpageProcessComplete}
                  onClose={handleCloseWebpageDialog}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
