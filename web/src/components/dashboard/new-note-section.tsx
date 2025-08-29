"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Link2, 
  FileText, 
  Upload,
  Mic,
  Globe
} from "lucide-react"
import { SimplePDFProcessor } from "@/components/pdf"
import { checkCreditsAndRedirect } from "@/lib/client/credits-api"
import { AudioRecorder, RecordAudio } from "@/components/audio"
import { YouTubeProcessor } from "@/components/transcript"
import { WebpageProcessor } from "@/components/webpage"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export function NewNoteSection() {
  const [showPDFDialog, setShowPDFDialog] = useState(false);
  const [showAudioDialog, setShowAudioDialog] = useState(false);
  const [showRecordAudioDialog, setShowRecordAudioDialog] = useState(false);
  const [showYouTubeDialog, setShowYouTubeDialog] = useState(false);
  const [showWebpageDialog, setShowWebpageDialog] = useState(false);

  const handleWebpageProcessComplete = (result: {
    transcript: { id: string; title: string; content: string; url: string; originalName: string };
    note?: { id: string; title: string; content: string };
  }) => {
    console.log('Webpage processing completed:', result);
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
    console.log('Audio transcription completed:', result)
    setShowAudioDialog(false)
    
    // Handle error case
    if (result.note?.error) {
      // Show an alert
      alert('Audio transcribed successfully, but note creation failed: ' + (result.note.message || 'Unknown error'));
    } else {
      // Regular success case - you could add a callback here to refresh the notes section or show a success message
    }
  }

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
    console.log('Record audio completed:', result)
    setShowRecordAudioDialog(false)
    
    // Handle error case
    if (result.note?.error) {
      // Show an alert
      alert('Audio recorded and transcribed successfully, but note creation failed: ' + (result.note.message || 'Unknown error'));
    } else {
      // Regular success case - you could add a callback here to refresh the notes section or show a success message
    }
  }

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
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          New Note
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose your input method to create a new note
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Record Audio */}
        <Dialog open={showRecordAudioDialog} onOpenChange={setShowRecordAudioDialog}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-20 w-full flex flex-col items-center justify-center gap-2 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 rounded-2xl font-semibold text-base transition-all duration-200"
              onClick={async () => {
                const hasCredits = await checkCreditsAndRedirect();
                if (hasCredits) {
                  setShowRecordAudioDialog(true);
                }
              }}
            >
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <Mic className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <span>Record Audio</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-left">Record Audio & Generate Notes</DialogTitle>
              <DialogDescription>
                Record audio content and automatically generate AI-powered notes from the transcription.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <RecordAudio onTranscriptionComplete={handleRecordAudioComplete} />
            </div>
          </DialogContent>
        </Dialog>

        {/* YouTube Video Link */}
        <Dialog open={showYouTubeDialog} onOpenChange={setShowYouTubeDialog}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-20 w-full flex flex-col items-center justify-center gap-2 border-2 border-secondary/20 hover:border-secondary hover:bg-secondary/5 rounded-2xl font-semibold text-base transition-all duration-200"
              onClick={async () => {
                const hasCredits = await checkCreditsAndRedirect();
                if (hasCredits) {
                  setShowYouTubeDialog(true);
                }
              }}
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Link2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span>YouTube Video Link</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-left">YouTube Transcript & Notes</DialogTitle>
              <DialogDescription>
                Extract transcript from YouTube videos and generate AI-powered notes.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <YouTubeProcessor onProcessComplete={handleYouTubeTranscriptComplete} onClose={handleCloseYouTubeDialog} />
            </div>
          </DialogContent>
        </Dialog>

        {/* Webpage URL */}
        <Dialog open={showWebpageDialog} onOpenChange={setShowWebpageDialog}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-20 w-full flex flex-col items-center justify-center gap-2 border-2 border-green-200 hover:border-green-400 hover:bg-green-50 dark:border-green-800 dark:hover:border-green-600 dark:hover:bg-green-950 rounded-2xl font-semibold text-base transition-all duration-200"
              onClick={async () => {
                const hasCredits = await checkCreditsAndRedirect();
                if (hasCredits) {
                  setShowWebpageDialog(true);
                }
              }}
            >
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <span>Webpage URL</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-left">Process Webpage & Generate Notes</DialogTitle>
              <DialogDescription>
                Extract content from any webpage and generate AI-powered educational notes.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <WebpageProcessor onProcessComplete={handleWebpageProcessComplete} onClose={handleCloseWebpageDialog} />
            </div>
          </DialogContent>
        </Dialog>

        {/* Upload PDF */}
        <Dialog open={showPDFDialog} onOpenChange={setShowPDFDialog}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-20 w-full flex flex-col items-center justify-center gap-2 border-2 border-accent/20 hover:border-accent hover:bg-accent/5 rounded-2xl font-semibold text-base transition-all duration-200"
              onClick={async () => {
                const hasCredits = await checkCreditsAndRedirect();
                if (hasCredits) {
                  setShowPDFDialog(true);
                }
              }}
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <span>Upload PDF or Text</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-left">Upload PDF & Generate Notes</DialogTitle>
              <DialogDescription>
                Upload PDF documents and extract content to generate AI-powered notes.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <SimplePDFProcessor onProcessComplete={handlePDFProcessComplete} onClose={handleClosePDFDialog} />
            </div>
          </DialogContent>
        </Dialog>



        {/* Audio Transcription Modal */}
        <Dialog open={showAudioDialog} onOpenChange={setShowAudioDialog}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-20 w-full flex flex-col items-center justify-center gap-2 border-2 border-secondary/20 hover:border-secondary hover:bg-secondary/5 rounded-2xl font-semibold text-base transition-all duration-200"
              onClick={async () => {
                const hasCredits = await checkCreditsAndRedirect();
                if (hasCredits) {
                  setShowAudioDialog(true);
                }
              }}
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                <Upload className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <span>Upload Audio</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-left">
                Upload Audio File & Generate Notes
              </DialogTitle>
              <DialogDescription>
                Upload audio files and automatically generate AI-powered notes from the transcription.
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
    </div>
  );
}
