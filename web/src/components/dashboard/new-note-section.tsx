"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Mic
} from "lucide-react"
import { SimplePDFProcessor, PDFUploader } from "@/components/pdf"
import { checkCreditsAndRedirect } from "@/lib/client/credits-api"
import { cn } from "@/lib/utils"
import { AudioRecorder, RecordAudio } from "@/components/audio"
import { YouTubeProcessor } from "@/components/transcript"
import { GenerateCourseCard } from "@/components/course/GenerateCourseCard"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export function NewNoteSection() {
  const [showPDFDialog, setShowPDFDialog] = useState(false);
  const [showAudioDialog, setShowAudioDialog] = useState(false);
  const [showRecordAudioDialog, setShowRecordAudioDialog] = useState(false);
  const [showYouTubeDialog, setShowYouTubeDialog] = useState(false);
  const [recordingState, setRecordingState] = useState<
    "idle" | "recording" | "stopped"
  >("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [webLink, setWebLink] = useState("");
  const [showWebLinkDialog, setShowWebLinkDialog] = useState(false);

  const handleStartRecording = () => {
    setRecordingState("recording");
    // TODO: Implement actual recording logic
  };

  const handleStopRecording = () => {
    setRecordingState("stopped");
    // TODO: Stop recording
  };

  const handleResumeRecording = () => {
    setRecordingState("recording");
    // TODO: Resume recording
  };

  const handleDeleteRecording = () => {
    setRecordingState("idle");
    setRecordingTime(0);
    // TODO: Delete recording
  };

  const handleSaveRecording = () => {
    // TODO: Save recording and create note
    setRecordingState("idle");
    setRecordingTime(0);
  };

  const handleSummarizeLink = async () => {
    // Check credits before proceeding
    const hasCredits = await checkCreditsAndRedirect();
    if (!hasCredits) {
      return;
    }
    
    // TODO: Implement link summarization
    console.log("Summarizing link:", webLink);
    setWebLink("");
    setShowWebLinkDialog(false);
  };
  const handleWebLinkDialogClose = () => {
    setShowWebLinkDialog(false);
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

  const handlePDFProcessComplete = (result: any) => {
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
        {/* Generate Course */}
        <GenerateCourseCard />

        {/* Record Audio */}
        <Dialog
          open={showRecordAudioDialog}
          onOpenChange={setShowRecordAudioDialog}
        >
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              className="h-20 w-full flex items-center justify-start gap-4 p-6 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl transition-all duration-200"
              onClick={async () => {
                const hasCredits = await checkCreditsAndRedirect();
                if (hasCredits) {
                  setShowRecordAudioDialog(true);
                }
              }}
            >
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <Mic className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 dark:text-white">
                  Record Audio
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
                Record audio content and automatically generate AI-powered notes from the transcription.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <RecordAudio
                onTranscriptionComplete={handleRecordAudioComplete}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* YouTube Video Link */}
        <Dialog open={showYouTubeDialog} onOpenChange={setShowYouTubeDialog}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2 border-2 border-secondary/20 hover:border-secondary hover:bg-secondary/5 rounded-2xl transition-all duration-300"
              onClick={async () => {
                const hasCredits = await checkCreditsAndRedirect();
                if (hasCredits) {
                  setShowYouTubeDialog(true);
                }
              }}
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Link2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 dark:text-white">
                  YouTube Video Link
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
                Extract transcript from YouTube videos and generate AI-powered notes.
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

        {/* Upload PDF */}
        <Dialog open={showPDFDialog} onOpenChange={setShowPDFDialog}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 border-2 border-accent/20 hover:border-accent hover:bg-accent/5 rounded-2xl transition-all duration-300"
              onClick={async () => {
                const hasCredits = await checkCreditsAndRedirect();
                if (hasCredits) {
                  setShowPDFDialog(true);
                }
              }}
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                <FileText className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 dark:text-white">
                  Upload PDF
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
                Upload PDF documents and extract content to generate AI-powered notes.
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

        {/* Record Audio Modal */}
        <Dialog open={showRecordAudioDialog} onOpenChange={setShowRecordAudioDialog}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 border-2 border-destructive/20 hover:border-destructive hover:bg-destructive/5 rounded-2xl transition-all duration-300"
              onClick={async () => {
                const hasCredits = await checkCreditsAndRedirect();
                if (hasCredits) {
                  setShowRecordAudioDialog(true);
                }
              }}
            >
              <Mic className="h-6 w-6 text-destructive" />
              <span className="text-sm font-medium">Record Audio</span>
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
              <RecordAudio
                onTranscriptionComplete={handleRecordAudioComplete}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Audio Transcription Modal */}
        <Dialog open={showAudioDialog} onOpenChange={setShowAudioDialog}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 rounded-2xl transition-all duration-300"
              onClick={async () => {
                const hasCredits = await checkCreditsAndRedirect();
                if (hasCredits) {
                  setShowAudioDialog(true);
                }
              }}
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                <Upload className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 dark:text-white">
                  Upload Audio
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
