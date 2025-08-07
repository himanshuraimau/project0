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
import { PDFUploader } from "@/components/pdf"

export function NewNoteSection() {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'stopped'>('idle')
  const [recordingTime, setRecordingTime] = useState(0)
  const [webLink, setWebLink] = useState("")

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

  const handleSelectAudioFile = () => {
    // TODO: Implement audio file selection
    console.log("Selecting audio file")
  }

  return (
    <Card className="rounded-3xl border-0 p-8 shadow-xl bg-card">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">New Note</h2>
        <p className="text-muted-foreground">Choose your input method to create a new note</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Record Audio Modal */}
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 rounded-2xl transition-all duration-300"
            >
              <Mic className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Record Audio</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-left">Record audio</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Audio Language</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      English
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>English</DropdownMenuItem>
                    <DropdownMenuItem>Spanish</DropdownMenuItem>
                    <DropdownMenuItem>French</DropdownMenuItem>
                    <DropdownMenuItem>German</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {recordingState === 'recording' && (
                <div className="text-center">
                  <div className="text-2xl font-mono text-primary mb-4">
                    {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse mx-auto mb-4"></div>
                </div>
              )}

              <div className="flex gap-3">
                {recordingState === 'idle' && (
                  <>
                    <Button onClick={handleStartRecording} className="flex-1">
                      <Play className="h-4 w-4 mr-2" />
                      Start Recording
                    </Button>
                    <Button variant="outline" className="flex-1">
                      More Note Options
                    </Button>
                  </>
                )}

                {recordingState === 'recording' && (
                  <>
                    <Button onClick={handleStopRecording} variant="destructive" className="flex-1">
                      <Square className="h-4 w-4 mr-2" />
                      Stop Recording
                    </Button>
                    <Button variant="outline" className="flex-1">
                      More Note Options
                    </Button>
                  </>
                )}

                {recordingState === 'stopped' && (
                  <div className="flex gap-2 w-full">
                    <Button onClick={handleDeleteRecording} variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleResumeRecording} variant="outline" className="flex-1">
                      Resume
                    </Button>
                    <Button onClick={handleSaveRecording} className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 border-2 border-accent/20 hover:border-accent hover:bg-accent/5 rounded-2xl transition-all duration-300"
            >
              <FileText className="h-6 w-6 text-accent-foreground" />
              <span className="text-sm font-medium">Upload PDF/Text</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-left">Upload PDF</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <PDFUploader />
            </div>
          </DialogContent>
        </Dialog>

        {/* Upload Audio Modal */}
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 rounded-2xl transition-all duration-300"
            >
              <Upload className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Upload Audio</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-left">Upload an audio file</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Audio Language</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      English
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>English</DropdownMenuItem>
                    <DropdownMenuItem>Spanish</DropdownMenuItem>
                    <DropdownMenuItem>French</DropdownMenuItem>
                    <DropdownMenuItem>German</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSelectAudioFile} className="flex-1">
                  Select Audio File
                </Button>
                <Button variant="outline" className="flex-1">
                  More Note Options
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  )
}
