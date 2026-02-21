"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useNoteContext } from "@/contexts/note-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit01Icon,
  File01Icon,
  HelpCircleIcon,
  Layers01Icon,
  FlashIcon,
  Brain01Icon,
  Message01Icon,
  LanguageSquareIcon,
  Share07Icon,
  BotIcon,
  Minimize01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { MDXRenderer } from "@/components/mdx-renderer";
import dynamic from "next/dynamic";

const DynamicInlineChatbot = dynamic(
  () => import("@/components/chatbot/inline-chatbot"),
  { ssr: false }
);

import { TranslateModal } from "@/components/notes/TranslateModal";
import { ShareLinkDialog } from "@/components/notes/share-link-dialog";
import { LanguageCode } from "@/lib/types";
import LoadingScreen from "@/components/LoadingScreen";

export default function NoteHubPage() {
  const { note } = useNoteContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isChatbotMinimized, setIsChatbotMinimized] = useState(false);
  const [isTranslateModalOpen, setIsTranslateModalOpen] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(
    null
  );
  const [currentLang, setCurrentLang] = useState<LanguageCode | "en">("en");
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isTranscriptLoading, setIsTranscriptLoading] = useState(false);
  const [isPodcastLoading, setIsPodcastLoading] = useState(false);

  useEffect(() => {
    const lang = searchParams?.get("lang") as LanguageCode | null;
    if (lang && note) {
      setCurrentLang(lang);
      fetch(`/api/notes/${note.id}/translate?language=${lang}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.content) {
            setTranslatedContent(data.data.content);
          } else {
            setTranslatedContent(null);
          }
        })
        .catch(() => setTranslatedContent(null));
    } else {
      setCurrentLang("en");
      setTranslatedContent(null);
    }
  }, [searchParams, note]);

  const handleEditNote = () => {
    if (!note) return;
    setIsEditLoading(true);
    // Ensure the editor opens from the top, not the previous scroll position
    if (typeof window !== "undefined") {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant" as ScrollBehavior,
      });
    }
    setTimeout(() => {
      router.push(`/notes/${note.id}/edit`);
    }, 1500);
  };

  const handleTranscript = () => {
    if (!note) return;
    setIsTranscriptLoading(true);
    setTimeout(() => router.push(`/notes/${note.id}/transcript`), 1500);
  };

  const handlePodcast = () => {
    if (!note) return;
    setIsPodcastLoading(true);
    setTimeout(() => router.push(`/notes/${note.id}/podcast`), 1500);
  };

  if (!note) return null;
  if (isEditLoading) return <LoadingScreen title="Loading Editor" />;
  if (isTranscriptLoading) return <LoadingScreen title="Loading Transcript" />;
  if (isPodcastLoading) return <LoadingScreen title="Loading Podcast" />;

  const actions: Array<{
    label: string;
    description: string;
    icon: IconSvgElement;
    onClick?: () => void;
    href?: string;
    iconBg: string;
  }> = [
    {
      label: "Edit Note",
      description: "Update content and structure",
      icon: Edit01Icon,
      onClick: handleEditNote,
      iconBg: "bg-[#FF8904]",
    },
    {
      label: "Transcript",
      description: "View or edit raw transcript",
      icon: File01Icon,
      onClick: handleTranscript,
      iconBg: "bg-[#C27AFF]",
    },
    {
      label: "Quiz",
      description: "Test yourself with AI questions",
      icon: HelpCircleIcon,
      href: `/notes/${note.id}/quiz`,
      iconBg: "bg-[#FB64B6]",
    },
    {
      label: "Flashcards",
      description: "Study with generated cards",
      icon: Layers01Icon,
      href: `/notes/${note.id}/flashcard`,
      iconBg: "bg-[#00D3F3]",
    },
    {
      label: "Podcast",
      description: "Listen as an audio summary",
      icon: FlashIcon,
      onClick: handlePodcast,
      iconBg: "bg-[#51A2FF]",
    },
    {
      label: "Mind Map",
      description: "Visualize concepts and links",
      icon: Brain01Icon,
      href: `/notes/${note.id}/mindmap`,
      iconBg: "bg-[#7C86FF]",
    },
    {
      label: "Chat with Note",
      description: "Ask questions about this note",
      icon: Message01Icon,
      href: `/notes/${note.id}/chat`,
      iconBg: "bg-[#FDC700]",
    },
    {
      label: "Translate",
      description: "Convert to another language",
      icon: LanguageSquareIcon,
      onClick: () => setIsTranslateModalOpen(true),
      iconBg: "bg-[#90A1B9]",
    },
  ];

  return (
    <div className="h-full min-h-0 max-w-full bg-background flex flex-col overflow-hidden">
      {/* Header – aligned with dashboard/sidebar */}
      <header className="shrink-0 border-b border-border/70 bg-background">
        <div className="flex flex-col bg-sidebar gap-3 sm:flex-row sm:items-center sm:justify-between py-[10px] px-4 sm:px-6 lg:px-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-foreground truncate sm:text-2xl">
              {note.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Created {new Date(note.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareDialog(true)}
              className="h-[40px] rounded-md gap-2 border-border bg-muted/50 hover:bg-muted font-medium"
            >
              <HugeiconsIcon icon={Share07Icon} className="size-4" />
              Share
            </Button>
          </div>
        </div>
      </header>

      {/* Content: fixed height, two columns with independent scroll */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6 py-6 px-4 sm:px-6 lg:px-6 overflow-hidden">
        {/* Left: notes – scrolls independently */}
        <div className="note-section-scroll flex-1 min-w-0 min-h-0 overflow-y-auto space-y-6">
          {/* Action grid – premium card style, same colors */}
          <div className="grid grid-cols-2 gap-3 sm:gap-2.5">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() =>
                  action.onClick
                    ? action.onClick()
                    : action.href && router.push(action.href)
                }
                className={cn(
                  "group flex items-center cursor-pointer gap-4 rounded-lg bg-card p-4 text-left",
                  "border border-transparent transition-colors",
                  "hover:bg-primary/5 hover:border-primary/30",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
              >
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-[10px] text-white transition-all",
                    "group-hover:ring-2 group-hover:ring-primary/40 group-hover:ring-offset-2 group-hover:ring-offset-background",
                    action.iconBg
                  )}
                >
                  <HugeiconsIcon icon={action.icon} className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-foreground text-lg block truncate">
                    {action.label}
                  </span>
                  <span className="text-sm text-muted-foreground block mt-0.5 line-clamp-2">
                    {action.description}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Note content */}
          <Card className="rounded-lg bg-card overflow-hidden">
            <CardContent className="p-5">
              <article className="prose dark:prose-invert prose-neutral max-w-none prose-headings:font-semibold prose-p:leading-relaxed">
                <MDXRenderer
                  content={
                    translatedContent || note.content || "No content available."
                  }
                />
              </article>
            </CardContent>
          </Card>
        </div>

        {!isChatbotMinimized && (
          <aside className="lg:w-[35%] shrink-0 min-h-[420px] lg:min-h-0 flex flex-col">
            <div className="flex flex-col rounded-lg border border-border/50 bg-card overflow-hidden h-full flex-1 min-h-[380px] lg:min-h-0">
              <div className="shrink-0 border-b border-border/50 bg-muted/30 px-4 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <HugeiconsIcon icon={BotIcon} className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-[15px] font-semibold text-foreground truncate">
                        Note assistant
                      </h2>
                      <p className="text-xs text-muted-foreground truncate">
                        Ask about this note
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsChatbotMinimized(true)}
                    className="size-8 shrink-0 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                    title="Minimize"
                  >
                    <HugeiconsIcon icon={Minimize01Icon} className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 min-h-0 flex flex-col">
                <DynamicInlineChatbot
                  noteId={note.id}
                  className="h-full min-h-0 flex flex-col"
                />
              </div>
            </div>
          </aside>
        )}

        {isChatbotMinimized && (
          <div className="fixed bottom-6 right-6 z-50">
            <Button
              onClick={() => setIsChatbotMinimized(false)}
              size="icon"
              className="size-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
              aria-label="Open assistant"
            >
              <HugeiconsIcon icon={BotIcon} className="size-7" />
            </Button>
          </div>
        )}
      </div>

      <TranslateModal
        noteId={note.id}
        isOpen={isTranslateModalOpen}
        onClose={() => setIsTranslateModalOpen(false)}
      />

      <ShareLinkDialog
        noteId={note.id}
        noteTitle={note.title}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />
    </div>
  );
}
