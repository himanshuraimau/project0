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
import { Link2, FileText, Upload, Mic, Globe, CloudUpload } from "lucide-react";
import { SimplePDFProcessor } from "@/components/pdf";
import { checkCreditsAndRedirect } from "@/lib/client/credits-api";
import { AudioRecorder, RecordAudio } from "@/components/audio";
import { YouTubeProcessor } from "@/components/transcript";
import { WebpageProcessor } from "@/components/webpage";
import { Inter } from "next/font/google";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin-ext", "vietnamese"],
});

const inter = Inter({ subsets: ["latin"] });

export function NewNoteSection() {
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
    }
  };

  const handlePDFProcessComplete = () => {
    setShowPDFDialog(false);
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
  };

  const handleCloseYouTubeDialog = () => {
    setShowYouTubeDialog(false);
  };

  return (
    <div className={`w-full ${inter.className}`}>
      <div className="mb-8">
        <h2
          className={`text-xl leading-8 font-semibold text-stone-900 dark:text-stone-100 mb-2 ${jakarta.className}`}
        >
          New Note
        </h2>
        <p
          className={`text-stone-600 text-sm font-medium leading-6 dark:text-stone-400 ${jakarta.className}`}
        >
          Record audio, upload files, or process YouTube videos and websites
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* YouTube Video Links */}
        <Dialog open={showYouTubeDialog} onOpenChange={setShowYouTubeDialog}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-20 px-6 py-4 w-full flex items-center justify-start gap-4 bg-white dark:bg-stone-900/50 border border-stone-100 dark:border-stone-900 dark:hover:bg-stone-800/80  hover:bg-stone-100 cursor-pointer hover:border-stone-300 rounded-lg transition-all duration-200 group"
              onClick={async () => {
                const hasCredits = await checkCreditsAndRedirect();
                if (hasCredits) {
                  setShowYouTubeDialog(true);
                }
              }}
            >
              <div className="size-10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                <img src="/youtube.png" className="size-8" alt="YouTube" />
              </div>
              <div className="flex flex-col items-start">
                <div className="font-semibold text-base leading-6 text-stone-900 dark:text-stone-100">
                  YouTube Links
                </div>
                <div className="font-medium text-sm leading-5 text-stone-500 dark:text-stone-400">
                  Extract from videos
                </div>
              </div>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-900 shadow-2xl">
            <DialogHeader className="border-b border-stone-100 dark:border-stone-800 pb-4">
              <DialogTitle
                className={`text-left text-xl font-semibold text-stone-900 dark:text-stone-100 ${jakarta.className}`}
              >
                YouTube Transcript & Notes
              </DialogTitle>
              <DialogDescription
                className={`text-stone-600 dark:text-stone-400 mt-1 ${jakarta.className}`}
              >
                Extract transcript from YouTube videos and generate AI-powered
                notes automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 overflow-y-auto max-h-[calc(85vh-140px)]">
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
              className="h-20 px-6 py-4 w-full flex items-center justify-start gap-4 bg-white dark:bg-stone-900/50 border border-stone-100 dark:border-stone-900 dark:hover:bg-stone-800/80  hover:bg-stone-100 cursor-pointer hover:border-stone-300 rounded-lg transition-all duration-200 group"
              onClick={async () => {
                const hasCredits = await checkCreditsAndRedirect();
                if (hasCredits) {
                  setShowRecordAudioDialog(true);
                }
              }}
            >
              <div className="size-10 border border-stone-300 dark:border-stone-700 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200 group-hover:border-red-400 dark:group-hover:border-red-500">
                <div className="size-4 rounded-full bg-red-500 group-hover:bg-red-600 transition-colors duration-200" />
              </div>
              <div className="flex flex-col items-start">
                <div className="font-semibold text-base leading-6 text-stone-900 dark:text-stone-100">
                  Record Audio
                </div>
                <div className="font-medium text-sm leading-5 text-stone-500 dark:text-stone-400">
                  Live recording
                </div>
              </div>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl">
            <DialogHeader className="border-b border-stone-100 dark:border-stone-800 pb-4">
              <DialogTitle
                className={`text-left text-xl font-semibold text-stone-900 dark:text-stone-100 ${jakarta.className}`}
              >
                Record Audio & Generate Notes
              </DialogTitle>
              <DialogDescription
                className={`text-stone-600 dark:text-stone-400 mt-1 ${jakarta.className}`}
              >
                Record audio content and automatically generate AI-powered notes
                from the transcription.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 overflow-y-auto max-h-[calc(85vh-140px)]">
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
              className="h-20 px-6 py-4 w-full flex items-center justify-start gap-4 bg-white dark:bg-stone-900/50 border border-stone-100 dark:border-stone-900 dark:hover:bg-stone-800/80  hover:bg-stone-100 cursor-pointer hover:border-stone-300 rounded-lg transition-all duration-200 group"
              onClick={async () => {
                const hasCredits = await checkCreditsAndRedirect();
                if (hasCredits) {
                  setShowPDFDialog(true);
                }
              }}
            >
              <div className="size-10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                <img src="/pdf.png" className="size-8" alt="PDF" />
              </div>
              <div className="flex flex-col items-start">
                <div className="font-semibold text-base leading-6 text-stone-900 dark:text-stone-100">
                  PDF Documents
                </div>
                <div className="font-medium text-sm leading-5 text-stone-500 dark:text-stone-400">
                  Upload & extract
                </div>
              </div>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 shadow-2xl">
            <DialogHeader className="border-b border-stone-100 dark:border-stone-800 pb-4">
              <DialogTitle
                className={`text-left text-xl font-semibold text-stone-900 dark:text-stone-100 ${jakarta.className}`}
              >
                Upload PDF & Generate Notes
              </DialogTitle>
              <DialogDescription
                className={`text-stone-600 dark:text-stone-400 mt-1 ${jakarta.className}`}
              >
                Upload PDF documents and extract content to generate
                comprehensive AI-powered notes.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 overflow-y-auto max-h-[calc(85vh-140px)]">
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
              className="h-20 px-6 py-4 w-full flex items-center justify-start gap-4 bg-white dark:bg-stone-900/50 border border-stone-100 dark:border-stone-900 dark:hover:bg-stone-800/80  hover:bg-stone-100 cursor-pointer hover:border-stone-300 rounded-lg transition-all duration-200 group"
              onClick={async () => {
                const hasCredits = await checkCreditsAndRedirect();
                if (hasCredits) {
                  setShowAudioDialog(true);
                }
              }}
            >
              <div className="size-10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                <CloudUpload className="size-8 text-stone-600 dark:text-stone-400 group-hover:text-stone-800 dark:group-hover:text-stone-300 transition-colors duration-200" />
              </div>
              <div className="flex flex-col items-start">
                <div className="font-semibold text-base leading-6 text-stone-900 dark:text-stone-100">
                  Upload Audio
                </div>
                <div className="font-medium text-sm leading-5 text-stone-500 dark:text-stone-400">
                  From your device
                </div>
              </div>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 shadow-2xl">
            <DialogHeader className="border-b border-stone-100 dark:border-stone-800 pb-4">
              <DialogTitle
                className={`text-left text-xl font-semibold text-stone-900 dark:text-stone-100 ${jakarta.className}`}
              >
                Upload Audio File & Generate Notes
              </DialogTitle>
              <DialogDescription
                className={`text-stone-600 dark:text-stone-400 mt-1 ${jakarta.className}`}
              >
                Upload audio files from your device and automatically generate
                AI-powered notes from the transcription.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 overflow-y-auto max-h-[calc(85vh-140px)]">
              <AudioRecorder
                onTranscriptionComplete={handleAudioTranscriptionComplete}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Webpage URL Dialog (Hidden in DOM) */}
      <Dialog open={showWebpageDialog} onOpenChange={setShowWebpageDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden bg-white dark:bg-stone-950 border border-stone-100 dark:border-stone-900 shadow-2xl">
          <DialogHeader className="border-b border-stone-100 dark:border-stone-800 pb-4">
            <DialogTitle
              className={`text-left text-xl font-semibold text-stone-900 dark:text-stone-100 ${jakarta.className}`}
            >
              Process Webpage & Generate Notes
            </DialogTitle>
            <DialogDescription
              className={`text-stone-600 dark:text-stone-400 mt-1 ${jakarta.className}`}
            >
              Extract content from any webpage and generate comprehensive
              AI-powered educational notes.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 overflow-y-auto max-h-[calc(85vh-140px)]">
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
