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
import { Input } from "@/components/ui/input"
import { 
  Mic, 
  Link2, 
  FileText, 
  Upload,
  Play,
  Square,
  Trash2,
  Save,
  ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PDFUploader, SimplePDFProcessor } from "@/components/pdf"
import { AudioRecorder } from "@/components/audio"

export function NewNoteSection() {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'stopped'>('idle')
  const [recordingTime, setRecordingTime] = useState(0)
  const [webLink, setWebLink] = useState("")
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

  const handleSummarizeLink = () => {
    // TODO: Implement link summarization
    console.log("Summarizing link:", webLink)
    setWebLink("")
  }

  const handleAudioTranscriptionComplete = (result: {
    transcript: { id: string; content: string };
    note: { id: string; title: string; content: string };
  }) => {
    console.log('Audio transcription completed:', result)
    setShowAudioDialog(false)
    // You could add a callback here to refresh the notes section or show a success message
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

  return (
    <Card className="rounded-3xl border-0 p-8 shadow-xl bg-card">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">New Note</h2>
        <p className="text-muted-foreground">Choose your input method to create a new note</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Web Link Modal */}
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 border-2 border-secondary/20 hover:border-secondary hover:bg-secondary/5 rounded-2xl transition-all duration-300"
            >
              <Link2 className="h-6 w-6 text-secondary" />
              <span className="text-sm font-medium">Web Link</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-left">Web link</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">URL</label>
                <Input 
                  placeholder="Paste your URL here"
                  value={webLink}
                  onChange={(e) => setWebLink(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Supports YouTube, articles, and most web pages
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSummarizeLink} className="flex-1" disabled={!webLink}>
                  Summarize Link
                </Button>
                <Button variant="outline" className="flex-1">
                  More Note Options
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Upload PDF/Text Modal */}
        <Dialog open={showPDFDialog} onOpenChange={setShowPDFDialog}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 border-2 border-accent/20 hover:border-accent hover:bg-accent/5 rounded-2xl transition-all duration-300"
              onClick={() => setShowPDFDialog(true)}
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
              onClick={() => setShowAudioDialog(true)}
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
