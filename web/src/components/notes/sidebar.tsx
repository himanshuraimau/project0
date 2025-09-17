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
  Menu,
  ChevronLeft,
  PanelLeftClose,
} from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
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
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

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
      collapsible="icon"
      className={cn(
        "border-r h-screen border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950",
        className
      )}
    >
      <SidebarHeader className="border-b py-5 border-stone-200 dark:border-stone-800">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-3 px-4">
            <div className="flex items-center justify-center size-8 rounded-lg bg-stone-900 dark:bg-stone-100">
              <FileIcon className="size-5 text-stone-50 dark:text-stone-900" />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-8 rounded-lg bg-stone-900 dark:bg-stone-100">
                <FileIcon className="size-5 text-stone-50 dark:text-stone-900" />
              </div>
              <span className="text-lg leading-[28px] font-semibold text-stone-900 dark:text-stone-100">
                Notes
              </span>
            </div>
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors"
            >
              <ChevronLeft className="size-6" />
            </button>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className={cn(
        "flex-1",
        isCollapsed ? "px-1 flex flex-col items-center" : "px-4"
      )}>
        <SidebarGroup className={isCollapsed ? "w-full flex flex-col items-center" : ""}>
          <SidebarGroupContent>
            <SidebarMenu className={cn(
              "space-y-2",
              isCollapsed && "flex flex-col items-center w-full"
            )}>
              {/* Collapse button at the top */}
              <SidebarMenuItem className={isCollapsed ? "flex justify-center" : ""}>
                <SidebarMenuButton
                  onClick={toggleSidebar}
                  className={cn(
                    "flex items-center rounded-lg transition-colors duration-200",
                    isCollapsed ? "w-14 h-14 justify-center" : "w-full px-4 py-3 text-[16px]",
                    "text-stone-600 hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-300"
                  )}
                >
                  <div className={cn(
                    "flex items-center w-full",
                    isCollapsed ? "justify-center" : "justify-end"
                  )}>
                    {isCollapsed ? (
                      <Menu className="!size-5 flex-shrink-0" />
                    ) : (
                      <></>
                    )}
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title} className={isCollapsed ? "flex justify-center" : ""}>
                    <SidebarMenuButton
                      onClick={item.onClick}
                      isActive={item.isActive}
                      disabled={item.disabled}
                      className={cn(
                        "flex items-center rounded-lg transition-colors duration-200",
                        isCollapsed ? "w-14 h-14 justify-center" : "w-full px-4 py-3 text-[16px]",
                        item.isActive
                          ? "!bg-gray-200 !text-black dark:!bg-gray-700 dark:!text-white"
                          : "text-stone-700 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                      )}
                    >
                      <div className={cn(
                        "flex items-center w-full",
                        isCollapsed ? "justify-center" : "gap-3"
                      )}>
                        <Icon className="!size-5 flex-shrink-0" />
                        {!isCollapsed && (
                          <span className="leading-[24px]">{item.title}</span>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              <SidebarMenuItem className={isCollapsed ? "flex justify-center" : ""}>
                <AlertDialogTrigger asChild>
                  <SidebarMenuButton
                    className={cn(
                      "flex items-center rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 transition-colors duration-200 mt-4",
                      isCollapsed ? "w-14 h-14 justify-center" : "w-full px-4 py-3 text-[16px]"
                    )}
                    onClick={onDeleteNote}
                  >
                    <div className={cn(
                      "flex items-center w-full",
                      isCollapsed ? "justify-center" : "gap-3"
                    )}>
                      <Trash2 className="!size-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="leading-[24px] font-medium">Delete Notes</span>
                      )}
                    </div>
                  </SidebarMenuButton>
                </AlertDialogTrigger>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="w-full px-5 border-t border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
        <div
          className={cn(
            "flex items-center gap-3 px-5 rounded-lg shadow-sm hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-800 transition-colors duration-200",
            "bg-stone-50",
            isCollapsed ? "mx-auto justify-center w-14" : "mx-auto"
          )}
        >
          <span className="text-stone-600 text-2xl dark:text-stone-400">⚡</span>
          {!isCollapsed && (
            <span className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              Unlimited Notes
            </span>
          )}
        </div>
      </SidebarFooter>

    </Sidebar>
  );
}
