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
  weight: "600", // e.g., SemiBold
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
    // You could add a callback here to refresh the notes section or show a success message
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

    // Handle error case
    if (result.note?.error) {
      // Show an alert
      alert(
        "Audio transcribed successfully, but note creation failed: " +
          (result.note.message || "Unknown error")
      );
    } else {
      // Regular success case - you could add a callback here to refresh the notes section or show a success message
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

    // Handle error case
    if (result.note?.error) {
      // Show an alert
      alert(
        "Audio recorded and transcribed successfully, but note creation failed: " +
          (result.note.message || "Unknown error")
      );
    } else {
      // Regular success case - you could add a callback here to refresh the notes section or show a success message
    }
  };

  const handlePDFProcessComplete = () => {
    // PDF processed successfully, close dialog and potentially refresh notes
    setShowPDFDialog(false);
    // You could add a callback here to refresh the notes section
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
    // You could add a callback here to refresh the notes section or show a success message
  };

  const handleCloseYouTubeDialog = () => {
    setShowYouTubeDialog(false);
  };

  return (
    <div className={`w-full max-w-6xl mx-auto ${inter.className}`}>
      <div className="mb-[36px]">
        <h2 className={`text-2xl leading-8 font-semibold text-stone-900 dark:text-stone-100 mb-[6px] ${jakarta.className}`}>
          New Note
        </h2>
        <p className={`text-stone-600 text-[16px] font-medium leading-6 dark:text-stone-400 ${jakarta.className}`}>
          Record audio, or upload audio, use PDF or upload youtube or website
          link
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* YouTube Video Links */}
        <Dialog open={showYouTubeDialog} onOpenChange={setShowYouTubeDialog}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-24 px-6 py-5 w-[460px] flex items-center justify-start gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-sm transition-all duration-200"
              onClick={async () => {
                const hasCredits = await checkCreditsAndRedirect();
                if (hasCredits) {
                  setShowYouTubeDialog(true);
                }
              }}
            >
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <Link2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex flex-col items-start">
                <div className="font-semibold text-lg leading-[28px] text-stone-900 dark:text-stone-100">
                  Youtube video links
                </div>
                <div className="font-medium leading-[24px] text-stone-500 dark:text-stone-400">
                  upload youtube videos
                </div>
              </div>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-left">
                YouTube Transcript & Notes
              </DialogTitle>
              <DialogDescription>
                Extract transcript from YouTube videos and generate AI-powered
                notes.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
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
              className="h-24 px-6 py-5 w-[460px] flex items-center justify-start gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-sm transition-all duration-200"
              onClick={async () => {
                const hasCredits = await checkCreditsAndRedirect();
                if (hasCredits) {
                  setShowRecordAudioDialog(true);
                }
              }}
            >
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <Mic className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex flex-col items-start">
                <div className="font-semibold text-lg leading-[28px] text-stone-900 dark:text-stone-100">
                  Record Audio
                </div>
                <div className="font-medium leading-[24px] text-stone-500 dark:text-stone-400">
                  Record audio, or upload
                </div>
              </div>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-left">
                Record Audio & Generate Notes
              </DialogTitle>
              <DialogDescription>
                Record audio content and automatically generate AI-powered notes
                from the transcription.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
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
              className="h-24 px-6 py-5 w-[460px] flex items-center justify-start gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-sm transition-all duration-200"
              onClick={async () => {
                const hasCredits = await checkCreditsAndRedirect();
                if (hasCredits) {
                  setShowPDFDialog(true);
                }
              }}
            >
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex flex-col items-start">
                <div className="font-semibold text-lg leading-[28px] text-stone-900 dark:text-stone-100">
                  PDF
                </div>
                <div className="font-medium leading-[24px] text-stone-500 dark:text-stone-400">
                  Record audio, or upload
                </div>
              </div>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-left">
                Upload PDF & Generate Notes
              </DialogTitle>
              <DialogDescription>
                Upload PDF documents and extract content to generate AI-powered
                notes.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
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
              className="h-24 px-6 py-5 w-[460px] flex items-center justify-start gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-sm transition-all duration-200"
              onClick={async () => {
                const hasCredits = await checkCreditsAndRedirect();
                if (hasCredits) {
                  setShowAudioDialog(true);
                }
              }}
            >
              <div className="size-[36px] rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
                {/* <Upload className="h-5 w-5 text-stone-600 dark:text-stone-400" /> */}
                <CloudUpload/>
              </div>
              <div className="flex flex-col items-start">
                <div className="font-semibold text-lg leading-[28px] text-stone-900 dark:text-stone-100">
                  Upload Audio
                </div>
                <div className="font-medium leading-[24px] text-stone-500 dark:text-stone-400">
                  Record audio, or upload
                </div>
              </div>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-left">
                Upload Audio File & Generate Notes
              </DialogTitle>
              <DialogDescription>
                Upload audio files and automatically generate AI-powered notes
                from the transcription.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <AudioRecorder
                onTranscriptionComplete={handleAudioTranscriptionComplete}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Webpage URL Dialog (Hidden in DOM) */}
      <Dialog open={showWebpageDialog} onOpenChange={setShowWebpageDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-left">
              Process Webpage & Generate Notes
            </DialogTitle>
            <DialogDescription>
              Extract content from any webpage and generate AI-powered
              educational notes.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
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
