"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  FileText,
  HelpCircle,
  Layers,
  MessageCircle,
  Trash2,
  FileIcon,
  Brain,
  Menu,
  ChevronLeft,
  Loader2,
  CheckCircle,
  Mic,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

interface NotesSidebarProps {
  className?: string;
  noteId?: string;
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
  noteId,
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
  ...props
}: NotesSidebarProps & React.HTMLAttributes<HTMLDivElement>) {
  const { state, toggleSidebar } = useSidebar();
  const router = useRouter();
  const isCollapsed = state === "collapsed";

  const menuItems = [
    {
      title: "Notes",
      icon: FileIcon,
      onClick: onShowNotes,
      isActive:
        !showTranscript &&
        !showQuiz &&
        !showChat &&
        !showFlashcards &&
        !showPodcast &&
        !showMindmap,
      disabled: false,
      loading: false,
      description: "View your notes",
    },
    {
      title: "Transcript",
      icon: FileText,
      onClick: onShowTranscript,
      isActive: showTranscript,
      disabled: false,
      loading: false,
      description: "Audio transcript",
    },
    {
      title: "Quiz",
      icon: HelpCircle,
      onClick: onGenerateQuiz,
      isActive: showQuiz,
      disabled: quizLoading || false,
      loading: quizLoading || false,
      description: "Create quiz from notes",
    },
    {
      title: "Chat with Note",
      icon: MessageCircle,
      onClick: onChatWithNote,
      isActive: showChat,
      disabled: false,
      loading: false,
      description: "Ask questions about content",
    },
    {
      title: "Flashcards",
      icon: Layers,
      onClick: onGenerateFlashcard,
      isActive: showFlashcards,
      disabled: flashcardsLoading || false,
      loading: flashcardsLoading || false,
      description: "Study with flashcards",
    },
    // {
    //   title: "Podcast",
    //   icon: Mic,
    //   onClick: onGeneratePodcast,
    //   isActive: showPodcast,
    //   disabled: podcastLoading || false,
    //   loading: podcastLoading || false,
    //   description: "Generate audio podcast",
    // },
    {
      title: "Mind Map",
      icon: Brain,
      onClick: onGenerateMindmap,
      isActive: showMindmap,
      disabled: mindmapLoading || false,
      loading: mindmapLoading || false,
      description: "Visual mind map",
    },

  ];

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "h-screen ml-[5vw] mt-16",
        className
      )}
      role="navigation"
      aria-label="Note features and actions"
      {...props}
    >

      <SidebarContent
        className={cn(
          "flex-1",
          isCollapsed ? "px-2 flex flex-col items-center" : "px-3"
        )}
      >
        <SidebarGroup
          className={isCollapsed ? "w-full flex flex-col items-center" : ""}
        >
          <SidebarGroupContent>
            <SidebarMenu
              className={cn(isCollapsed && "flex flex-col items-center w-full")}
            >
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const isGenerative =
                  item.title.toLowerCase().includes("generate") ||
                  item.title === "Flashcards";

                return (
                  <SidebarMenuItem
                    key={item.title}
                    className={cn(
                      isCollapsed ? "flex justify-center w-full" : "",
                      index > 0 && index < menuItems.length && !isCollapsed
                        ? "relative"
                        : ""
                    )}
                  >
                    <SidebarMenuButton
                      onClick={item.onClick}
                      isActive={item.isActive}
                      disabled={item.disabled}
                      className={cn(
                        "flex items-center rounded-xl cursor-pointer group relative overflow-hidden dark:hover:bg-[#0a0b0d]",
                        isCollapsed
                          ? "w-16 h-16 justify-center"
                          : "w-full px-5 py-6",
                        item.isActive
                          ? ""
                          : item.disabled
                          ? "text-stone-400 dark:text-stone-600 cursor-not-allowed opacity-60"
                          : "text-stone-600 dark:text-stone-300",
                        isGenerative && !item.disabled && !item.isActive
                          ? ""
                          : ""
                      )}
                      title={isCollapsed ? item.title : undefined}
                      aria-label={`${item.title}${item.loading ? ' (loading)' : ''}${item.isActive ? ' (active)' : ''}`}
                      aria-current={item.isActive ? 'page' : undefined}
                      aria-describedby={isCollapsed ? undefined : `${item.title.toLowerCase().replace(/\s+/g, '-')}-description`}
                    >
                      <div
                        className={cn(
                          "flex items-center w-full",
                          isCollapsed ? "justify-center" : "gap-4"
                        )}
                      >
                        {item.loading ? (
                          <Loader2 className="size-7 animate-spin flex-shrink-0" />
                        ) : (
                          <Icon
                            className={cn(
                              "size-7 flex-shrink-0",
                              item.isActive
                                ? "scale-110"
                                : ""
                            )}
                          />
                        )}

                        {!isCollapsed && (
                          <div className="flex flex-col items-start flex-1 min-w-0">
                            <span
                              className={cn(
                                "text-[1.1rem] leading-tight truncate font-medium",
                                jakarta.className,
                                item.loading ? "opacity-70" : ""
                              )}
                            >
                              {item.title}
                            </span>
                            <span 
                              id={`${item.title.toLowerCase().replace(/\s+/g, '-')}-description`}
                              className="sr-only"
                            >
                              {item.description}
                            </span>
                          </div>
                        )}

                        {/* Loading indicator */}
                        {!isCollapsed && item.loading && (
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-current rounded-full animate-pulse opacity-60"></div>
                          </div>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              {/* Separator */}
              <div className={`my-2.5`} />

              {/* Delete button */}
              <SidebarMenuItem
                className={isCollapsed ? "flex justify-center w-full" : ""}
              >
                <AlertDialogTrigger asChild>
                  <SidebarMenuButton
                    className={cn(
                      "flex items-center rounded-xl cursor-pointer group relative overflow-hidden border-none dark:hover:bg-[#0a0b0d]",
                      isCollapsed
                        ? "w-14 h-14 justify-center"
                        : "w-full px-4 py-6",
                      "text-red-600 hover:text-red-500"
                    )}
                    title={isCollapsed ? "Delete Notes" : undefined}
                    aria-label="Delete note permanently"
                    role="button"
                  >
                    <div
                      className={cn(
                        "flex items-center w-full",
                        isCollapsed ? "justify-center" : "gap-3"
                      )}
                    >
                      <Trash2 className="size-7 flex-shrink-0" />
                      {!isCollapsed && (
                        <div className="flex flex-col items-start flex-1">
                          <span
                            className={cn(
                              "text-lg font-medium leading-tight",
                              jakarta.className
                            )}
                          >
                            Delete Notes
                          </span>
                        </div>
                      )}
                    </div>
                  </SidebarMenuButton>
                </AlertDialogTrigger>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
