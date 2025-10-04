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
        "border-r h-screen border-stone-200 bg-white dark:border-stone-900 dark:bg-stone-950",
        className
      )}
    >
      <SidebarHeader className="border-b py-4 border-stone-200 dark:border-stone-900 bg-white dark:bg-stone-900/50">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-3 px-3">
            <button
              onClick={toggleSidebar}
              className="cursor-pointer p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1.5 9C1.5 6.23315 1.5 4.84973 2.11036 3.86908C2.33617 3.50627 2.61668 3.1907 2.93918 2.93665C3.81087 2.25 5.04058 2.25 7.5 2.25H10.5C12.9594 2.25 14.1891 2.25 15.0608 2.93665C15.3833 3.1907 15.6638 3.50627 15.8896 3.86908C16.5 4.84973 16.5 6.23315 16.5 9C16.5 11.7668 16.5 13.1503 15.8896 14.1309C15.6638 14.4937 15.3833 14.8093 15.0608 15.0634C14.1891 15.75 12.9594 15.75 10.5 15.75H7.5C5.04058 15.75 3.81087 15.75 2.93918 15.0634C2.61668 14.8093 2.33617 14.4937 2.11036 14.1309C1.5 13.1503 1.5 11.7668 1.5 9Z"
                  stroke="#4E4E4E"
                  strokeWidth="1.4"
                />
                <path
                  d="M7.125 2.25V15.75"
                  stroke="#4E4E4E"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <path
                  d="M3.75 5.25H4.5M3.75 7.5H4.5"
                  stroke="#4E4E4E"
                  strokeWidth="1.125"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span
                  className={cn(
                    "text-lg font-medium text-stone-900 dark:text-stone-100 cursor-pointer hover:text-accent transition-colors duration-200",
                    jakarta.className
                  )}
                  onClick={() => router.push('/dashboard')}
                >
                  SonicLearn
                </span>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              className="p-3 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-all duration-200 hover:scale-105"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1.5 9C1.5 6.23315 1.5 4.84973 2.11036 3.86908C2.33617 3.50627 2.61668 3.1907 2.93918 2.93665C3.81087 2.25 5.04058 2.25 7.5 2.25H10.5C12.9594 2.25 14.1891 2.25 15.0608 2.93665C15.3833 3.1907 15.6638 3.50627 15.8896 3.86908C16.5 4.84973 16.5 6.23315 16.5 9C16.5 11.7668 16.5 13.1503 15.8896 14.1309C15.6638 14.4937 15.3833 14.8093 15.0608 15.0634C14.1891 15.75 12.9594 15.75 10.5 15.75H7.5C5.04058 15.75 3.81087 15.75 2.93918 15.0634C2.61668 14.8093 2.33617 14.4937 2.11036 14.1309C1.5 13.1503 1.5 11.7668 1.5 9Z"
                  stroke="#4E4E4E"
                  strokeWidth="1.4"
                />
                <path
                  d="M7.125 2.25V15.75"
                  stroke="#4E4E4E"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <path
                  d="M3.75 5.25H4.5M3.75 7.5H4.5"
                  stroke="#4E4E4E"
                  strokeWidth="1.125"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}
      </SidebarHeader>

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
