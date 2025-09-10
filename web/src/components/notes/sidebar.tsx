"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { 
  FileText, 
  HelpCircle, 
  Layers, 
  MessageCircle,
  Trash2,
  FileIcon,
  Mic
} from "lucide-react"

import {
  Sidebar as UISidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarCollapseTrigger,
  useSidebar
} from "@/components/ui/sidebar"
import { AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface NotesSidebarProps {
  className?: string
  showTranscript: boolean
  showQuiz: boolean
  showChat: boolean
  showFlashcards: boolean
  showPodcast: boolean
  onShowNotes: () => void
  onShowTranscript: () => void
  onGenerateQuiz: () => void
  onChatWithNote: () => void
  onGenerateFlashcard: () => void
  onGeneratePodcast: () => void
  onDeleteNote: () => void
  quizLoading?: boolean
  flashcardsLoading?: boolean
  podcastLoading?: boolean
}

export function NotesSidebar({ 
  className,
  showTranscript,
  showQuiz,
  showChat,
  showFlashcards,
  showPodcast,
  onShowNotes,
  onShowTranscript,
  onGenerateQuiz,
  onChatWithNote,
  onGenerateFlashcard,
  onGeneratePodcast,
  onDeleteNote,
  quizLoading,
  flashcardsLoading,
  podcastLoading
}: NotesSidebarProps) {
  const { open } = useSidebar()

  return (
    <UISidebar className={cn("z-30 bg-background", className)}>
      <SidebarHeader className="flex justify-between items-center">
        <div className="flex items-center">
          {open && <span className="font-semibold">Notes</span>}
        </div>
        <SidebarCollapseTrigger />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {/* Notes */}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onShowNotes} active={!showTranscript && !showQuiz && !showChat && !showFlashcards && !showPodcast}>
              <FileIcon className="h-4 w-4" />
              {open && <span className="ml-3">Notes</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {/* Transcript */}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onShowTranscript} active={showTranscript}>
              <FileText className="h-4 w-4" />
              {open && <span className="ml-3">Transcript</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {/* Generate Quiz */}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onGenerateQuiz} active={showQuiz} disabled={quizLoading}>
              <HelpCircle className="h-4 w-4" />
              {open && <span className="ml-3">Generate Quiz</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {/* Chat with Note */}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onChatWithNote} active={showChat}>
              <MessageCircle className="h-4 w-4 text-primary" />
              {open && <span className="ml-3">Chat with Note</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {/* Flashcard */}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onGenerateFlashcard} active={showFlashcards} disabled={flashcardsLoading}>
              <Layers className="h-4 w-4" />
              {open && <span className="ml-3">Flashcard</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {/* Generate Podcast */}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onGeneratePodcast} active={showPodcast} disabled={podcastLoading}>
              <Mic className="h-4 w-4" />
              {open && <span className="ml-3">Generate Podcast</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {/* Delete Notes */}
          <SidebarMenuItem>
            <AlertDialogTrigger asChild>
              <SidebarMenuButton 
                variant="default"
                className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 mt-4"
              >
                <Trash2 className="h-4 w-4" />
                {open && <span className="ml-3 font-medium">Delete Notes</span>}
              </SidebarMenuButton>
            </AlertDialogTrigger>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </UISidebar>
  )
}
