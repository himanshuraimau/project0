"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Link2, 
  FileText, 
  Upload
} from "lucide-react"
<<<<<<< HEAD
import { SimplePDFProcessor } from "@/components/pdf"
=======
import { checkCreditsAndRedirect } from "@/lib/client/credits-api"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PDFUploader, SimplePDFProcessor } from "@/components/pdf"
>>>>>>> 0a4ad53 (feat credit-exhaustion-v2)
import { AudioRecorder } from "@/components/audio"
import { YouTubeProcessor } from "@/components/transcript"

export function NewNoteSection() {
<<<<<<< HEAD
  const [showPDFDialog, setShowPDFDialog] = useState(false)
  const [showAudioDialog, setShowAudioDialog] = useState(false)
  const [showYouTubeDialog, setShowYouTubeDialog] = useState(false)
=======
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'stopped'>('idle')
  const [recordingTime, setRecordingTime] = useState(0)
  const [webLink, setWebLink] = useState("")
  const [showWebLinkDialog, setShowWebLinkDialog] = useState(false)
  const [showPDFDialog, setShowPDFDialog] = useState(false)
  const [showAudioDialog, setShowAudioDialog] = useState(false)

  const handleStartRecording = () => {
    setRecordingState('recording')
    // TODO: Implement actual recording logic
  }

  const handleStopRecording = () => {
    setRecordingState('stopped')
    // TODO: Stop recording
  }

  const handleResumeRecording = () => {
    setRecordingState('recording')
    // TODO: Resume recording
  }

  const handleDeleteRecording = () => {
    setRecordingState('idle')
    setRecordingTime(0)
    // TODO: Delete recording
  }

  const handleSaveRecording = () => {
    // TODO: Save recording and create note
    setRecordingState('idle')
    setRecordingTime(0)
  }

  const handleSummarizeLink = async () => {
    // Check credits before proceeding
    const hasCredits = await checkCreditsAndRedirect();
    if (!hasCredits) {
      return;
    }
    
    // TODO: Implement link summarization
    console.log("Summarizing link:", webLink)
    setWebLink("")
    setShowWebLinkDialog(false)
  }
>>>>>>> 0a4ad53 (feat credit-exhaustion-v2)

  const handleAudioTranscriptionComplete = (result: {
    transcript: { id: string; content: string };
    note: { 
      id?: string; 
      title?: string; 
      content?: string;
      error?: string;
      message?: string;
      insufficientCredits?: boolean;
      redirectToPricing?: boolean;
      redirectUrl?: string;
    };
  }) => {
    console.log('Audio transcription completed:', result)
    setShowAudioDialog(false)
    
    // Handle insufficient credits case
    if (result.note?.insufficientCredits && result.note?.redirectToPricing) {
      // Show an alert
      alert('Audio transcribed successfully, but note creation requires more credits. Redirecting to pricing page...');
      
      // Redirect to pricing page
      if (typeof window !== 'undefined' && result.note.redirectUrl) {
        setTimeout(() => {
          window.location.href = result.note.redirectUrl || '/pricing';
        }, 1500);
      }
    } else {
      // Regular success case - you could add a callback here to refresh the notes section or show a success message
    }
  }

  const handlePDFProcessComplete = (result: any) => {
    // PDF processed successfully, close dialog and potentially refresh notes
    setShowPDFDialog(false)
    // You could add a callback here to refresh the notes section
  }

  const handleClosePDFDialog = () => {
    setShowPDFDialog(false)
  }

  const handleCloseAudioDialog = () => {
    setShowAudioDialog(false)
  }

  const handleYouTubeTranscriptComplete = (result: {
    transcript: { id: string; content: string; originalName: string };
    note?: { id: string; title: string; content: string };
  }) => {
    console.log('YouTube transcript completed:', result)
    setShowYouTubeDialog(false)
    // You could add a callback here to refresh the notes section or show a success message
  }

  const handleCloseYouTubeDialog = () => {
    setShowYouTubeDialog(false)
  }

  return (
    <Card className="rounded-3xl border-0 p-8 shadow-xl bg-card">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">New Note</h2>
        <p className="text-muted-foreground">Choose your input method to create a new note</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
<<<<<<< HEAD
        {/* YouTube Transcript Modal */}
        <Dialog open={showYouTubeDialog} onOpenChange={setShowYouTubeDialog}>
=======
        {/* Web Link Modal */}
        <Dialog open={showWebLinkDialog} onOpenChange={setShowWebLinkDialog}>
>>>>>>> 0a4ad53 (feat credit-exhaustion-v2)
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 border-2 border-secondary/20 hover:border-secondary hover:bg-secondary/5 rounded-2xl transition-all duration-300"
<<<<<<< HEAD
              onClick={() => setShowYouTubeDialog(true)}
=======
              onClick={async () => {
                const hasCredits = await checkCreditsAndRedirect();
                if (hasCredits) {
                  setShowWebLinkDialog(true);
                }
              }}
>>>>>>> 0a4ad53 (feat credit-exhaustion-v2)
            >
              <Link2 className="h-6 w-6 text-secondary" />
              <span className="text-sm font-medium">YouTube Video</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-left">YouTube Transcript & Notes</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <YouTubeProcessor
                onProcessComplete={handleYouTubeTranscriptComplete}
                onClose={handleCloseYouTubeDialog}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Upload PDF/Text Modal */}
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
              <FileText className="h-6 w-6 text-accent-foreground" />
              <span className="text-sm font-medium">Upload PDF</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-left">Upload PDF & Generate Notes</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <SimplePDFProcessor 
                onProcessComplete={handlePDFProcessComplete}
                onClose={handleClosePDFDialog}
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
              <Upload className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Audio Transcription</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-left">Audio Transcription & Summary</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <AudioRecorder
                onTranscriptionComplete={handleAudioTranscriptionComplete}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  )
}
