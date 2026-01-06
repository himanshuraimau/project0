"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function NoteHubPage() {
  const { note } = useNoteContext();
  const router = useRouter();
  const [isChatbotMinimized, setIsChatbotMinimized] = useState(false);

  if (!note) return null;

  const actions = [
    { 
      label: "Edit Note", 
      icon: Edit, 
      href: `/notes/${note.id}/edit`,
      color: "bg-orange-500", 
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      textColor: "text-orange-700 dark:text-orange-300"
    },
    { 
      label: "Transcript", 
      icon: FileText, 
      href: `/notes/${note.id}/transcript`,
      color: "bg-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      textColor: "text-purple-700 dark:text-purple-300"
    },
    { 
      label: "Quiz", 
      icon: HelpCircle, 
      href: `/notes/${note.id}/quiz`,
      color: "bg-pink-500",
      bgColor: "bg-pink-50 dark:bg-pink-950/20",
      textColor: "text-pink-700 dark:text-pink-300"
    },
    { 
      label: "Flashcards", 
      icon: Layers, 
      href: `/notes/${note.id}/flashcard`,
      color: "bg-cyan-500",
      bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
      textColor: "text-cyan-700 dark:text-cyan-300"
    },
    { 
      label: "Podcast", 
      icon: Zap, 
      href: `/notes/${note.id}/podcast`,
      color: "bg-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      textColor: "text-blue-700 dark:text-blue-300"
    },
    { 
      label: "Mind Map", 
      icon: Brain, 
      href: `/notes/${note.id}/mindmap`,
      color: "bg-indigo-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
      textColor: "text-indigo-700 dark:text-indigo-300"
    },
    { 
      label: "Chat with Note", 
      icon: MessageSquare, 
      href: `/notes/${note.id}/chat`,
      color: "bg-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      textColor: "text-yellow-700 dark:text-yellow-300"
    },
    { 
      label: "Translate", 
      icon: Languages, 
      href: `/notes/${note.id}/edit`, 
      color: "bg-stone-500",
      bgColor: "bg-stone-50 dark:bg-stone-950/20",
      textColor: "text-stone-700 dark:text-stone-300"
    },
  ];

  return (
    <div className="min-h-full p-8 max-w-[1400px] mx-auto space-y-8">
      
      {/* Top Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground leading-tight mb-2">
            {note.title}
          </h1>
          <p className="text-muted-foreground text-sm">
             Created on {new Date(note.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" className="rounded-full gap-2 text-purple-600 border-purple-200 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300">
             <Share2 className="h-4 w-4" />
             <span>Share</span>
           </Button>
           <Button variant="outline" size="icon" className="rounded-full text-muted-foreground hover:text-yellow-500">
             <Star className="h-4 w-4" />
           </Button>
        </div>
      </div>

      {/* Main Content Area: Left 60% + Right 40% */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Action Grid + Note Preview - 60% */}
        <div className={cn("flex-1 space-y-8", !isChatbotMinimized && "lg:w-[60%]")}>
          
          {/* Action Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {actions.map((action) => (
              <Card 
                key={action.label} 
                className={cn(
                    "border-0 shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md group",
                    action.bgColor
                )}
                onClick={() => router.push(action.href)}
              >
                <CardContent className="p-5 flex flex-col justify-between h-32 relative overflow-hidden">
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Sparkles className={cn("h-4 w-4", action.textColor)} />
                    </div>
                    
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-sm mb-3", action.color)}>
                        <action.icon className="h-5 w-5" />
                    </div>
                    
                    <h3 className={cn("font-bold text-base", action.textColor)}>
                        {action.label}
                    </h3>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Note Preview */}
          <div>
            <div className="flex items-center gap-2 mb-6">
                <h2 className="text-xl font-semibold text-foreground">Note Preview</h2>
                <div className="h-px bg-border flex-1 ml-4" />
            </div>
            
            <div className="bg-white dark:bg-card rounded-2xl p-8 border border-border shadow-sm">
              <article className="prose dark:prose-invert max-w-none">
                <MDXRenderer content={note.content || "No content available."} />
              </article>
            </div>
          </div>
        </div>

        {/* Right Column: Chatbot Sidebar - 40% */}
        {!isChatbotMinimized && (
          <div className="lg:w-[40%]">
            <Card className="rounded-3xl bg-card border border-black/20 hover:transition-all duration-300 sticky top-4 h-fit">
              <CardHeader className="p-4 sm:p-6 pb-4 rounded-2xl">
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
                <p className="text-sm text-muted-foreground mt-2">
                  Ask me anything!
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] lg:h-[600px]">
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
    </div>
  );
}
