"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  FileText,
  HelpCircle,
  Layers,
  MessageSquare,
  Trash2,
  File,
  Brain,
  Menu,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Mic,
  Info,
  ArrowRight,
  Moon,
  Sun,
} from 'lucide-react';
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
import { SidebarFooterControls } from "@/components/shared/sidebar-footer-controls";
import { UserControl } from "@/components/user-control";
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
    },

  ];

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "bg-background m-4 rounded-2xl border-r border-border",
        className
      )}
      role="navigation"
      aria-label="Note features and actions"
      {...props}
    >
      <SidebarHeader className="px-4 py-6">
        <div className="flex items-center gap-3">
          <UserControl showName={false} />
          {!isCollapsed && (
            <>
              <span className="text-foreground font-medium flex-1">NotesAI</span>
            </>
          )}
          <SidebarTrigger className="text-muted-foreground hover:text-foreground ml-auto transition-all" />
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 py-4 px-2">
        <SidebarGroup
          className={isCollapsed ? "w-full flex flex-col items-center" : ""}
        >
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-3">
              {menuItems.map((item, index) => {
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
                        "flex items-center rounded-lg transition-all py-2.5 px-3",
                        "text-sm font-medium w-full cursor-pointer",
                        item.isActive 
                          ? "bg-accent text-accent-foreground"
                          : item.disabled
                          ? "text-muted-foreground cursor-not-allowed opacity-60"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
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
                          <Loader2 className="w-5 h-5 animate-spin flex-shrink-0 mr-3" />
                        ) : (
                          <item.icon className="w-5 h-5 flex-shrink-0 mr-3" />
                        )}

                        {!isCollapsed && (
                          <div className="flex flex-col items-start flex-1 min-w-0">
                            <span className="text-sm font-medium truncate">
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
                      <Trash2 className="w-7 h-7 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="text-sm font-medium">
                          Delete Notes
                        </span>
                      )}
                    </div>
                  </SidebarMenuButton>
                </AlertDialogTrigger>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mx-4 mb-4 p-4">
        {/* Theme Toggle */}
        {!isCollapsed && (
          <div className="mb-3">
            <button
              onClick={() => {
                const newTheme = isDark ? "light" : "dark";
                setTheme(newTheme);
              }}
              className="flex items-center gap-3 w-full rounded-lg transition-all py-2.5 px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50"
            >
              {mounted && (
                <>
                  {isDark ? (
                    <Sun className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <Moon className="w-5 h-5 flex-shrink-0" />
                  )}
                  <span>Switch mode</span>
                </>
              )}
              {!mounted && <div className="w-5 h-5" />}
            </button>
          </div>
        )}

        {/* PRO Upgrade Button */}
        {!isCollapsed && (
          <Link 
            href="/pricing"
            className="flex items-center justify-between w-full bg-primary text-primary-foreground rounded-lg px-3 py-2.5 hover:bg-primary/90 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">Upgrade to</span>
              <span className="bg-background text-foreground px-2 py-1 rounded-full text-xs font-semibold">PRO</span>
            </div>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
