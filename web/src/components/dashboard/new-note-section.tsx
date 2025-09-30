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
import { CloudUpload } from "lucide-react";
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

const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin-ext", "vietnamese"],
});

const inter = Inter({ subsets: ["latin"] });

export function NewNoteSection() {
  const { refreshNotes } = useDashboardRefresh();
  const [showPDFDialog, setShowPDFDialog] = useState(false);
  const [showAudioDialog, setShowAudioDialog] = useState(false);
  const [showRecordAudioDialog, setShowRecordAudioDialog] = useState(false);
  const [showYouTubeDialog, setShowYouTubeDialog] = useState(false);
  const [showWebpageDialog, setShowWebpageDialog] = useState(false);

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
    // Refresh dashboard if a note was created
    if (result.note?.id) {
      refreshNotes();
    }
  };

  const handleCloseWebpageDialog = () => {
    setShowWebpageDialog(false);
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
      alert(
        "Audio transcribed successfully, but note creation failed: " +
          (result.note.message || "Unknown error")
      );
    } else if (result.note?.id) {
      // Refresh dashboard if a note was created successfully
      refreshNotes();
    }
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
      alert(
        "Audio recorded and transcribed successfully, but note creation failed: " +
          (result.note.message || "Unknown error")
      );
    } else if (result.note?.id) {
      // Refresh dashboard if a note was created successfully
      refreshNotes();
    }
  };

  const handlePDFProcessComplete = (result: ProcessPDFResult) => {
    console.log("PDF processing completed:", result);
    setShowPDFDialog(false);
    // Refresh dashboard if a note was created successfully
    if (result.note && 'id' in result.note) {
      refreshNotes();
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
    // Refresh dashboard if a note was created
    if (result.note?.id) {
      refreshNotes();
    }
  };

  const handleCloseYouTubeDialog = () => {
    setShowYouTubeDialog(false);
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
        {/* YouTube Video Links */}
        <Dialog open={showYouTubeDialog} onOpenChange={setShowYouTubeDialog}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-24 px-6 py-6 w-full flex items-center justify-start gap-6 bg-card dark:bg-card border border-border hover:bg-muted/50 cursor-pointer hover:border-primary/20 rounded-2xl transition-all duration-200 group hover:shadow-lg"
              onClick={async () => {
                const hasCredits = await checkCreditsAndRedirect();
                if (hasCredits) {
                  setShowYouTubeDialog(true);
                }
              }}
            >
              <div className="size-12 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                <Image src="/youtube.png" width={40} height={40} className="size-10" alt="YouTube" />
              </div>
              <div className="flex flex-col items-start">
                <div className="font-semibold text-lg leading-6 text-foreground">
                  YouTube Links
                </div>
                <div className="font-medium text-sm leading-5 text-muted-foreground">
                  Extract from videos
                </div>
              </div>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle
                className={`text-left ${jakarta.className}`}
              >
                YouTube Transcript & Notes
              </DialogTitle>
              <DialogDescription
                className={`${jakarta.className}`}
              >
                Extract transcript from YouTube videos and generate AI-powered
                notes automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="pt-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <YouTubeProcessor
                onProcessComplete={handleYouTubeTranscriptComplete}
                onClose={handleCloseYouTubeDialog}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Record Audio */}
        <Dialog
          open={showRecordAudioDialog}
          onOpenChange={setShowRecordAudioDialog}
        >
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-24 px-6 py-6 w-full flex items-center justify-start gap-6 bg-card dark:bg-card border border-border hover:bg-muted/50 cursor-pointer hover:border-primary/20 rounded-2xl transition-all duration-200 group hover:shadow-lg"
              onClick={async () => {
                const hasCredits = await checkCreditsAndRedirect();
                if (hasCredits) {
                  setShowRecordAudioDialog(true);
                }
              }}
            >
              <div className="size-12 border border-border rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200 group-hover:border-red-400">
                <div className="size-5 rounded-full bg-red-500 group-hover:bg-red-600 transition-colors duration-200" />
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
          </DialogTrigger>
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
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* PDF */}
        <Dialog open={showPDFDialog} onOpenChange={setShowPDFDialog}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-24 px-6 py-6 w-full flex items-center justify-start gap-6 bg-card dark:bg-card border border-border hover:bg-muted/50 cursor-pointer hover:border-primary/20 rounded-2xl transition-all duration-200 group hover:shadow-lg"
              onClick={async () => {
                const hasCredits = await checkCreditsAndRedirect();
                if (hasCredits) {
                  setShowPDFDialog(true);
                }
              }}
            >
              <div className="size-12 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                <Image src="/pdf.png" width={40} height={40} className="size-10" alt="PDF" />
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
          </DialogTrigger>
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
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-24 px-6 py-6 w-full flex items-center justify-start gap-6 bg-card dark:bg-card border border-border hover:bg-muted/50 cursor-pointer hover:border-primary/20 rounded-2xl transition-all duration-200 group hover:shadow-lg"
              onClick={async () => {
                const hasCredits = await checkCreditsAndRedirect();
                if (hasCredits) {
                  setShowAudioDialog(true);
                }
              }}
            >
              <div className="size-12 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                <CloudUpload className="size-10 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
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
          </DialogTrigger>
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
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Webpage URL Dialog (Hidden in DOM) */}
      <Dialog open={showWebpageDialog} onOpenChange={setShowWebpageDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle
              className={`text-left ${jakarta.className}`}
            >
              Process Webpage & Generate Notes
            </DialogTitle>
            <DialogDescription
              className={`${jakarta.className}`}
            >
              Extract content from any webpage and generate comprehensive
              AI-powered educational notes.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <WebpageProcessor
              onProcessComplete={handleWebpageProcessComplete}
              onClose={handleCloseWebpageDialog}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
