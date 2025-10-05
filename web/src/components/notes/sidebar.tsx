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
  Mic,
  Brain,
  Menu,
  ChevronLeft,
  Loader2,
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
      title: "Generate Quiz",
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
    {
      title: "Mind Map",
      icon: Brain,
      onClick: onGenerateMindmap,
      isActive: showMindmap,
      disabled: mindmapLoading || false,
      loading: mindmapLoading || false,
      description: "Visual mind map",
    },
    {
      title: "Podcast",
      icon: Mic,
      onClick: onGeneratePodcast,
      isActive: showPodcast,
      disabled: podcastLoading || false,
      loading: podcastLoading || false,
      description: "Generate audio podcast",
    },
  ];

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "h-screen bg-white dark:bg-stone-950",
        className
      )}
    >

      <SidebarContent
        className={cn(
          "flex-1 bg-white dark:bg-stone-900/50",
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
                  item.title === "Flashcards" ||
                  item.title === "Podcast";

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
                        "flex items-center rounded-xl cursor-pointer transition-all duration-200 group relative overflow-hidden",
                        isCollapsed
                          ? "w-14 h-14 justify-center hover:w-16 hover:h-16"
                          : "w-full px-5 py-5",
                        item.isActive
                          ? " text-accent-foreground bg-accent/10 dark:bg-accent/20 border border-accent/20"
                          : item.disabled
                          ? "text-stone-400 dark:text-stone-600 cursor-not-allowed opacity-60"
                          : "text-stone-600 dark:text-stone-300 hover:bg-accent/5 dark:hover:bg-accent/10 hover:text-accent hover:border-accent/20 hover:shadow-sm hover:scale-[1.01] transition-all duration-200",
                        isGenerative && !item.disabled && !item.isActive
                          ? ""
                          : ""
                      )}
                      title={isCollapsed ? item.title : undefined}
                    >
                      <div
                        className={cn(
                          "flex items-center w-full",
                          isCollapsed ? "justify-center" : "gap-4"
                        )}
                      >
                        {item.loading ? (
                          <Loader2 className="size-6 animate-spin flex-shrink-0" />
                        ) : (
                          <Icon
                            className={cn(
                              "size-6 flex-shrink-0 transition-transform duration-200",
                              item.isActive
                                ? "scale-110"
                                : "group-hover:scale-105"
                            )}
                          />
                        )}

                        {!isCollapsed && (
                          <div className="flex flex-col items-start flex-1 min-w-0">
                            <span
                              className={cn(
                                "text-base leading-tight truncate",
                                jakarta.className,
                                item.loading ? "opacity-70" : ""
                              )}
                            >
                              {item.title}
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
                      "flex items-center rounded-xl transition-all cursor-pointer duration-200 group relative overflow-hidden border-none",
                      isCollapsed
                        ? "w-12 h-12 justify-center hover:w-14 hover:h-14"
                        : "w-full px-4 py-5",
                      "text-red-600  dark:bg-red-950/20 hover:text-red-600"
                    )}
                    title={isCollapsed ? "Delete Notes" : undefined}
                  >
                    <div
                      className={cn(
                        "flex items-center w-full",
                        isCollapsed ? "justify-center" : "gap-3"
                      )}
                    >
                      <Trash2 className="size-5 flex-shrink-0 group-hover:scale-105 transition-transform duration-200" />
                      {!isCollapsed && (
                        <div className="flex flex-col items-start flex-1">
                          <span
                            className={cn(
                              "font-medium leading-tight",
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
