"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  FileText,
  HelpCircle,
  Layers,
  MessageCircle,
  Trash2,
  FileIcon,
  Mic,
  Brain,
} from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface NotesSidebarProps {
  className?: string;
  showTranscript: boolean;
  showQuiz: boolean;
  showChat: boolean;
  showFlashcards: boolean;
  showPodcast: boolean;
  showMindmap: boolean;
  onShowNotes: () => void;
  onShowTranscript: () => void;
  onGenerateQuiz: () => void;
  onChatWithNote: () => void;
  onGenerateFlashcard: () => void;
  onGeneratePodcast: () => void;
  onGenerateMindmap: () => void;
  onDeleteNote: () => void;
  quizLoading?: boolean;
  flashcardsLoading?: boolean;
  podcastLoading?: boolean;
  mindmapLoading?: boolean;
}

export function NotesSidebar({
  className,
  showTranscript,
  showQuiz,
  showChat,
  showFlashcards,
  showPodcast,
  showMindmap,
  onShowNotes,
  onShowTranscript,
  onGenerateQuiz,
  onChatWithNote,
  onGenerateFlashcard,
  onGeneratePodcast,
  onGenerateMindmap,
  onDeleteNote,
  quizLoading,
  flashcardsLoading,
  podcastLoading,
  mindmapLoading,
}: NotesSidebarProps) {
  const menuItems = [
    {
      title: "Notes",
      icon: FileIcon,
      onClick: onShowNotes,
      isActive: !showTranscript && !showQuiz && !showChat && !showFlashcards && !showPodcast && !showMindmap,
      disabled: false,
    },
    {
      title: "Transcript",
      icon: FileText,
      onClick: onShowTranscript,
      isActive: showTranscript,
      disabled: false,
    },
    {
      title: "Generate Quiz",
      icon: HelpCircle,
      onClick: onGenerateQuiz,
      isActive: showQuiz,
      disabled: quizLoading || false,
    },
    {
      title: "Chat with Note",
      icon: MessageCircle,
      onClick: onChatWithNote,
      isActive: showChat,
      disabled: false,
    },
    {
      title: "Flashcard",
      icon: Layers,
      onClick: onGenerateFlashcard,
      isActive: showFlashcards,
      disabled: flashcardsLoading || false,
    },
    {
      title: "Generate Mindmap",
      icon: Brain,
      onClick: onGenerateMindmap,
      isActive: showMindmap,
      disabled: mindmapLoading || false,
    },
    {
      title: "Generate Podcast",
      icon: Mic,
      onClick: onGeneratePodcast,
      isActive: showPodcast,
      disabled: podcastLoading || false,
    },
  ];

  return (
    <Sidebar
      className={cn(
        "border-r h-screen w-[280px] border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950",
        className
      )}
    >
      <SidebarHeader className="border-b py-5 border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center justify-center size-8 rounded-lg bg-stone-900 dark:bg-stone-100">
            <FileIcon className="size-5 text-stone-50 dark:text-stone-900" />
          </div>
          <span className="text-lg leading-[28px] font-semibold text-stone-900 dark:text-stone-100">
            Notes
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 pt-4 px-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={item.onClick}
                      isActive={item.isActive}
                      disabled={item.disabled}
                      className={cn(
                        "w-full flex items-center px-4 py-3 text-[16px] rounded-lg transition-colors duration-200",
                        item.isActive
                          ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900"
                          : "text-stone-700 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                      )}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Icon className="size-5 flex-shrink-0" />
                        <span className="leading-[24px]">{item.title}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              <SidebarMenuItem>
                <AlertDialogTrigger asChild>
                  <SidebarMenuButton
                    className="w-full flex items-center px-4 py-3 text-[16px] rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 transition-colors duration-200 mt-4"
                    onClick={onDeleteNote}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Trash2 className="size-5 flex-shrink-0" />
                      <span className="leading-[24px] font-medium">Delete Notes</span>
                    </div>
                  </SidebarMenuButton>
                </AlertDialogTrigger>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto w-full px-5 py-4 border-t border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
        <div className="mx-auto flex items-center gap-3 bg-stone-50 px-5 py-2 rounded-lg shadow-sm hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-800 transition-colors duration-200">
          <span className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            Unlimited Notes
          </span>
          <span className="text-stone-600 text-2xl dark:text-stone-400">⚡</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
