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
import { CloudUpload, Globe, Link } from "lucide-react";
import { SimplePDFProcessor } from "@/components/pdf";
import { checkCreditsAndRedirect } from "@/lib/client/credits-api";
import { ProcessPDFResult } from "@/lib/types";
import { AudioRecorder, RecordAudio } from "@/components/audio";
import { YouTubeProcessor } from "@/components/transcript";
import { WebpageProcessor } from "@/components/webpage";
import { Inter } from "next/font/google";
import { Plus_Jakarta_Sans } from "next/font/google";
import Image from "next/image";
import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";
import { toast } from "sonner";

const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin-ext", "vietnamese"],
});

const inter = Inter({ subsets: ["latin"] });

export function NewNoteSection() {
  const { refreshNotes, addLoadingNote, removeLoadingNote } = useDashboardRefresh();
  const [showPDFDialog, setShowPDFDialog] = useState(false);
  const [showAudioDialog, setShowAudioDialog] = useState(false);
  const [showRecordAudioDialog, setShowRecordAudioDialog] = useState(false);
  const [showYouTubeDialog, setShowYouTubeDialog] = useState(false);
  const [showWebpageDialog, setShowWebpageDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkType, setLinkType] = useState<'youtube' | 'webpage'>('youtube');

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
    console.log("Webpage processing completed:", result);
    
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
    console.log("Audio transcription completed:", result);
    
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
    console.log("Record audio completed:", result);
    
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
    console.log("PDF processing completed:", result);
    
    setShowPDFDialog(false);
    
    // Show success toast
    if (result.note && 'id' in result.note) {
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
    console.log("YouTube transcript completed:", result);
    
    setShowYouTubeDialog(false);
    setShowLinkDialog(false);
    
    // Show success toast
    if (result.note?.id) {
      toast.success("🎥 YouTube video processed successfully! Notes generated.", {
        description: `Extracted content from "${result.transcript.originalName}"`,
        duration: 4000,
      });
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
      <div className="mb-8">
        <h2
          className={`text-2xl leading-8 font-semibold text-foreground mb-3 ${jakarta.className}`}
        >
          New Note
        </h2>
        <p
          className={`text-muted-foreground text-base font-medium leading-6 ${jakarta.className}`}
        >
          Record audio, upload files, or process YouTube videos and websites
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
        {/* Link Processor (YouTube + Webpage) */}
        <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
          <Button
            variant="ghost"
            className="neomorphic h-24 px-6 py-6 w-full flex items-center justify-start gap-6 border-0 cursor-pointer rounded-2xl group hover:bg-accent/10 dark:hover:bg-accent/20 transition-all duration-300"
            onClick={() => setShowLinkDialog(true)}
          >
            <div className="neomorphic-icon size-12 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Link className="size-6 text-muted-foreground" />
            </div>
            <div className="flex flex-col items-start">
              <div className="font-semibold text-lg leading-6 text-foreground">
                Process Links
              </div>
              <div className="font-medium text-sm leading-5 text-muted-foreground">
                YouTube & websites
              </div>
            </div>
          </Button>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle
                className={`text-left ${jakarta.className}`}
              >
                Process Links & Generate Notes
              </DialogTitle>
              <DialogDescription
                className={`${jakarta.className}`}
              >
                Extract content from YouTube videos or websites and generate AI-powered notes.
              </DialogDescription>
            </DialogHeader>
            <div className="pt-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Tab Selector */}
              <div className="flex items-center justify-center mb-6">
                <div className="flex bg-muted rounded-lg p-1">
                  <button
                    onClick={() => setLinkType('youtube')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      linkType === 'youtube'
                        ? 'bg-background text-foreground '
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    YouTube
                  </button>
                  <button
                    onClick={() => setLinkType('webpage')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      linkType === 'webpage'
                        ? 'bg-background text-foreground '
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Website
                  </button>
                </div>
              </div>

              {/* Content based on selected tab */}
              {linkType === 'youtube' ? (
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

        {/* Record Audio */}
        <Dialog
          open={showRecordAudioDialog}
          onOpenChange={setShowRecordAudioDialog}
        >
          <Button
            variant="ghost"
            className="neomorphic h-24 px-6 py-6 w-full flex items-center justify-start gap-6 border-0 cursor-pointer rounded-2xl group hover:bg-accent/10 dark:hover:bg-accent/20 transition-all duration-300"
            onClick={() => setShowRecordAudioDialog(true)}
          >
            <div className="neomorphic-record-indicator size-12 rounded-2xl flex items-center justify-center flex-shrink-0">
              <div className="size-5 rounded-full bg-red-500" />
            </div>
            <div className="flex flex-col items-start">
              <div className="font-semibold text-lg leading-6 text-foreground">
                Record Audio
              </div>
              <div className="font-medium text-sm leading-5 text-muted-foreground">
                Live recording
              </div>
            </div>
          </Button>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle
                className={`text-left ${jakarta.className}`}
              >
                Record Audio & Generate Notes
              </DialogTitle>
              <DialogDescription
                className={`${jakarta.className}`}
              >
                Record audio content and automatically generate AI-powered notes
                from the transcription.
              </DialogDescription>
            </DialogHeader>
            <div className="pt-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <RecordAudio
                onTranscriptionComplete={handleRecordAudioComplete}
                onClose={handleCloseRecordAudioDialog}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* PDF */}
        <Dialog open={showPDFDialog} onOpenChange={setShowPDFDialog}>
          <Button
            variant="ghost"
            className="neomorphic h-24 px-6 py-6 w-full flex items-center justify-start gap-6 border-0 cursor-pointer rounded-2xl group hover:bg-accent/10 dark:hover:bg-accent/20 transition-all duration-300"
            onClick={() => setShowPDFDialog(true)}
          >
            <div className="neomorphic-icon size-12 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Image src="/pdf.png" width={36} height={36} className="size-9 transition-transform duration-300 group-hover:scale-110" alt="PDF" />
            </div>
            <div className="flex flex-col items-start">
              <div className="font-semibold text-lg leading-6 text-foreground">
                PDF Documents
              </div>
              <div className="font-medium text-sm leading-5 text-muted-foreground">
                Upload & extract
              </div>
            </div>
          </Button>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle
                className={`text-left ${jakarta.className}`}
              >
                Upload PDF & Generate Notes
              </DialogTitle>
              <DialogDescription
                className={`${jakarta.className}`}
              >
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

        {/* Upload Audio */}
        <Dialog open={showAudioDialog} onOpenChange={setShowAudioDialog}>
          <Button
            variant="ghost"
            className="neomorphic h-24 px-6 py-6 w-full flex items-center justify-start gap-6 border-0 cursor-pointer rounded-2xl group hover:bg-accent/10 dark:hover:bg-accent/20 transition-all duration-300"
            onClick={() => setShowAudioDialog(true)}
          >
            <div className="neomorphic-icon size-12 rounded-2xl flex items-center justify-center flex-shrink-0">
              <CloudUpload className="size-6 text-muted-foreground" />
            </div>
            <div className="flex flex-col items-start">
              <div className="font-semibold text-lg leading-6 text-foreground">
                Upload Audio
              </div>
              <div className="font-medium text-sm leading-5 text-muted-foreground">
                From your device
              </div>
            </div>
          </Button>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle
                className={`text-left ${jakarta.className}`}
              >
                Upload Audio File & Generate Notes
              </DialogTitle>
              <DialogDescription
                className={`${jakarta.className}`}
              >
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
      </div>
    </div>
  );
}
