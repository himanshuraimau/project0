"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { 
  FileText, 
  HelpCircle, 
  Layers, 
  MessageCircle,
  Trash2,
  FileIcon
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

interface NotesSidebarProps {
  className?: string
  showTranscript: boolean
  showQuiz: boolean
  showChat: boolean
  showFlashcards: boolean
  onShowTranscript: () => void
  onGenerateQuiz: () => void
  onChatWithNote: () => void
  onGenerateFlashcard: () => void
  onDeleteNote: () => void
  quizLoading?: boolean
  flashcardsLoading?: boolean
}

export function NotesSidebar({ 
  className,
  showTranscript,
  showQuiz,
  showChat,
  showFlashcards,
  onShowTranscript,
  onGenerateQuiz,
  onChatWithNote,
  onGenerateFlashcard,
  onDeleteNote,
  quizLoading,
  flashcardsLoading
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
            <SidebarMenuButton>
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
          
          {/* Delete Notes */}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onDeleteNote} variant="default">
              <Trash2 className="h-4 w-4" />
              {open && <span className="ml-3">Delete Notes</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </UISidebar>
  )
}
