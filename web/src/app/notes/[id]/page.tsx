"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useNoteContext } from "@/contexts/note-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Edit,
  FileText,
  HelpCircle,
  Layers,
  Zap,
  Brain,
  MessageSquare,
  Languages,
  Share2,
  Star,
  Sparkles,
  Bot,
  Minimize2,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MDXRenderer } from "@/components/mdx-renderer";
import dynamic from "next/dynamic";

const DynamicInlineChatbot = dynamic(
  () => import("@/components/chatbot/inline-chatbot"),
  { ssr: false }
);

import { TranslateModal } from "@/components/notes/TranslateModal";
import { LanguageCode } from "@/lib/types";

export default function NoteHubPage() {
  const { note } = useNoteContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isChatbotMinimized, setIsChatbotMinimized] = useState(false);
  const [isTranslateModalOpen, setIsTranslateModalOpen] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [currentLang, setCurrentLang] = useState<LanguageCode | 'en'>('en');

  // Fetch translated content when lang param changes
  useEffect(() => {
    const lang = searchParams.get('lang') as LanguageCode | null;
    console.log('Lang param:', lang || 'english');

    if (lang && note) {
      setCurrentLang(lang);
      // Fetch translation using correct endpoint
      fetch(`/api/notes/${note.id}/translate?language=${lang}`)
        .then(res => res.json())
        .then(data => {
          console.log('Translation response:', data);
          // API returns { success: true, data: { content, title, ... } }
          if (data.success && data.data?.content) {
            console.log('Setting translated content:', data.data.content.substring(0, 100));
            setTranslatedContent(data.data.content);
          } else {
            console.log('No translation content found in response');
            setTranslatedContent(null);
          }
        })
        .catch(err => {
          console.error('Error fetching translation:', err);
          setTranslatedContent(null);
        });
    } else {
      setCurrentLang('en');
      setTranslatedContent(null);
    }
  }, [searchParams, note]);

  if (!note) return null;

  const actions = [
    {
      label: "Edit Note",
      icon: Edit,
      href: `/notes/${note.id}/edit`,
      color: "bg-[#FF8904]",
      bgColor: "bg-[#FF8904] dark:bg-[#FF8904]",
      textColor: "text-white"
    },
    {
      label: "Transcript",
      icon: FileText,
      href: `/notes/${note.id}/transcript`,
      color: "bg-[#C27AFF]",
      bgColor: "bg-[#C27AFF] dark:bg-[#C27AFF]",
      textColor: "text-white"
    },
    {
      label: "Quiz",
      icon: HelpCircle,
      href: `/notes/${note.id}/quiz`,
      color: "bg-[#FB64B6]",
      bgColor: "bg-[#FB64B6] dark:bg-[#FB64B6]",
      textColor: "text-white"
    },
    {
      label: "Flashcards",
      icon: Layers,
      href: `/notes/${note.id}/flashcard`,
      color: "bg-[#00D3F3]",
      bgColor: "bg-[#00D3F3] dark:bg-[#00D3F3]",
      textColor: "text-white"
    },
    {
      label: "Podcast",
      icon: Zap,
      href: `/notes/${note.id}/podcast`,
      color: "bg-[#51A2FF]",
      bgColor: "bg-[#51A2FF] dark:bg-[#51A2FF]",
      textColor: "text-white"
    },
    {
      label: "Mind Map",
      icon: Brain,
      href: `/notes/${note.id}/mindmap`,
      color: "bg-[#7C86FF]",
      bgColor: "bg-[#7C86FF] dark:bg-[#7C86FF]",
      textColor: "text-white"
    },
    {
      label: "Chat with Note",
      icon: MessageSquare,
      href: `/notes/${note.id}/chat`,
      color: "bg-[#FDC700]",
      bgColor: "bg-[#FDC700] dark:bg-[#FDC700]",
      textColor: "text-white"
    },
    {
      label: "Translate",
      icon: Languages,
      onClick: () => setIsTranslateModalOpen(true),
      color: "bg-[#90A1B9]",
      bgColor: "bg-[#90A1B9] dark:bg-[#90A1B9]",
      textColor: "text-white"
    },
  ];

  return (
    <div className="min-h-full px-20 py-6 max-w-full space-y-6">

      {/* Top Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[34px] font-bold text-foreground leading-tight mb-2">
            {note.title}
          </h1>
          <p className="text-muted-foreground text-sm">
            Created on {new Date(note.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-full gap-2 text-purple-600 border-purple-200 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300 py-1 px-3">
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </Button>
          <Button variant="outline" size="icon" className="rounded-full text-muted-foreground hover:text-yellow-500 p-1">
            <Star className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <hr className="border-t border-black/10 my-3 mb-7" />

      {/* Main Content Area: Left 60% + Right 40% */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left Column: Action Grid + Note Preview - 60% */}
        <div className={cn("flex-1 space-y-6 border border-black/20 rounded-2xl p-3", !isChatbotMinimized && "lg:w-[60%]")}>

          {/* Action Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 py-4">
            {actions.map((action) => (
              <Card
                key={action.label}
                className={cn(
                  "border-0 shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md group rounded-3xl",
                  action.bgColor
                )}
                onClick={() => action.onClick ? action.onClick() : router.push(action.href!)}
              >
                <CardContent className="py-1 px-3 flex items-center justify-start h-28 relative overflow-hidden">
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Sparkles className={cn("h-6 w-6", action.textColor)} />
                  </div>

                  <div className="flex items-center gap-3 pl-3 min-w-0">
                    <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center text-white shadow-sm", action.color)}>
                      <action.icon className="h-10 w-10" />
                    </div>

                    <h3 className={cn("font-bold text-2xl leading-none truncate", action.textColor)}>
                      {action.label}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Note Preview */}
          <div>
            <div className="p-6">
              <article className="prose dark:prose-invert max-w-none">
                <MDXRenderer content={translatedContent || note.content || "No content available."} />
              </article>
            </div>
          </div>
        </div>

        {/* Right Column: Chatbot Sidebar - 40% */}
        {!isChatbotMinimized && (
          <div className="lg:w-[40%]">
            <Card className="rounded-3xl bg-card border border-black/20 hover:transition-all duration-300 sticky top-4 h-fit">
              <CardHeader className="p-3 sm:p-4 pb-3 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg sm:text-xl font-semibold">
                      Jelli AI Assistant
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsChatbotMinimized(true)}
                    className="hover:bg-primary/10 rounded-full shrink-0"
                    title="Minimize chatbot"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Ask me anything!
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-[450px] lg:h-[500px]">
                  <DynamicInlineChatbot noteId={note.id} className="h-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Minimized Chatbot Button */}
        {isChatbotMinimized && (
          <div className="fixed bottom-8 right-8 z-50">
            <Button
              onClick={() => setIsChatbotMinimized(false)}
              className="h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center"
            >
              <Bot className="h-8 w-8" />
            </Button>
          </div>
        )}
      </div>

      {/* Translate Modal */}
      <TranslateModal
        noteId={note.id}
        isOpen={isTranslateModalOpen}
        onClose={() => setIsTranslateModalOpen(false)}
      />
    </div>
  );
}
