"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  FileText,
  HelpCircle,
  Layers,
  MessageSquare,
  Trash2,
  File,
  Brain,
  Loader2,
  Moon,
  Sun,
  Zap,
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
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
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? (resolvedTheme || theme) === "dark" : false;

  const menuItems = [
    {
      title: "Notes",
      icon: File,
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
    },
    {
      title: "Transcript",
      icon: FileText,
      onClick: onShowTranscript,
      isActive: showTranscript,
      disabled: false,
      loading: false,
    },
    {
      title: "Quiz",
      icon: HelpCircle,
      onClick: onGenerateQuiz,
      isActive: showQuiz,
      disabled: quizLoading || false,
      loading: quizLoading || false,
    },
    {
      title: "Chat with Note",
      icon: MessageSquare,
      onClick: onChatWithNote,
      isActive: showChat,
      disabled: false,
      loading: false,
    },
    {
      title: "Flashcards",
      icon: Layers,
      onClick: onGenerateFlashcard,
      isActive: showFlashcards,
      disabled: flashcardsLoading || false,
      loading: flashcardsLoading || false,
    },
    {
      title: "Mind Map",
      icon: Brain,
      onClick: onGenerateMindmap,
      isActive: showMindmap,
      disabled: mindmapLoading || false,
      loading: mindmapLoading || false,
    },
    {
      title: "Podcast",
      icon: Zap,
      onClick: onGeneratePodcast,
      isActive: showPodcast,
      disabled: podcastLoading || false,
      loading: podcastLoading || false,
    }
  ];

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "h-screen transition-all duration-300 ease-in-out",
        "dark:bg-[#1A1A1A] bg-[#F9FAFB]",
        "border-r border-neutral-200 dark:border-[#212121]",
        className
      )}
      role="navigation"
      aria-label="Note features and actions"
      {...props}
    >
      <SidebarHeader className="px-[14px] py-5">
        <div className="flex items-center gap-2 w-full group">
          {isCollapsed ? (
            <div className="relative flex items-center w-full justify-center">
              <div>
                <img
                  src="/logo.png"
                  alt="JelliNote AI"
                  className="h-10 w-auto rounded-md transition-opacity duration-200 opacity-100 group-hover:opacity-0 visible group-hover:invisible"
                />
              </div>
              <SidebarTrigger className="absolute opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all text-lg w-10 h-10 pointer-events-none group-hover:pointer-events-auto" />
            </div>
          ) : (
            <>
              <div>
                <img
                  src="/logo.png"
                  alt="JelliNote AI"
                  className="h-10 w-auto mr-2 rounded-md"
                />
              </div>
              <div className={`text-foreground flex-1`}>
                <div className="text-lg font-semibold leading-5">
                  JelliNote AI
                </div>
                <div className="text-sm text-muted-foreground font-medium leading-4">
                  Smart Notes
                </div>
              </div>
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-all text-lg w-10 h-10" />
            </>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-y-auto px-[14px]">
        <SidebarGroup
          className={cn(isCollapsed && "w-full flex flex-col items-center")}
        >
          <SidebarGroupContent>
            <SidebarMenu
              className={cn(isCollapsed && "flex flex-col items-center gap-0")}
            >
              {menuItems.map((item) => {
                return (
                  <SidebarMenuItem
                    key={item.title}
                    className={cn(
                      isCollapsed ? "flex p-0 justify-center w-full" : ""
                    )}
                  >
                    <SidebarMenuButton
                      onClick={item.onClick}
                      isActive={item.isActive}
                      disabled={item.disabled}
                      className={cn(
                        "flex items-center px-2 h-10 rounded-[8px] transition-colors",
                        isCollapsed
                          ? "justify-center w-full"
                          : "w-full gap-2.5",
                        item.isActive
                          ? "dark:bg-[#202020] bg-neutral-100 dark:text-white text-black"
                          : item.disabled
                          ? "text-neutral-500 dark:text-[#909090] cursor-not-allowed opacity-50"
                          : "text-neutral-500 dark:text-[#909090] hover:text-black hover:dark:text-white"
                      )}
                      title={isCollapsed ? item.title : undefined}
                      aria-label={`${item.title}${
                        item.loading ? " (loading)" : ""
                      }${item.isActive ? " (active)" : ""}`}
                      aria-current={item.isActive ? "page" : undefined}
                    >
                      {item.loading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      ) : (
                        <item.icon className="w-3.5 h-3.5" />
                      )}

                      {!isCollapsed && (
                        <span className="leading-4 text-[15px] font-normal">
                          {item.title}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              <div className="">
                <SidebarMenuItem
                  className={isCollapsed ? "flex justify-center w-full" : ""}
                >
                  <AlertDialogTrigger asChild>
                    <SidebarMenuButton
                      className={cn(
                        "flex items-center px-2 py-2.5 rounded-[8px] transition-colors cursor-pointer",
                        "text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-300",
                        "hover:bg-red-50 dark:hover:bg-red-950/20",
                        isCollapsed ? "justify-center w-full" : "w-full gap-2.5"
                      )}
                      title={isCollapsed ? "Delete Notes" : undefined}
                      aria-label="Delete note permanently"
                      role="button"
                    >
                      <Trash2 className="shrink-0" size={12} />
                      {!isCollapsed && (
                        <span className="leading-4 text-[15px] font-normal">
                          Delete Notes
                        </span>
                      )}
                    </SidebarMenuButton>
                  </AlertDialogTrigger>
                </SidebarMenuItem>
              </div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
