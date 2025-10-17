"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import dynamic from "next/dynamic";

// Lazy load the chatbot component
const DynamicChatbot = dynamic(() => import("@/components/chatbot/chatbot"), {
  ssr: false,
});

interface ChatbotSectionProps {
  noteId: string;
  className?: string;
}

export function ChatbotSection({ noteId, className }: ChatbotSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="rounded-3xl border-0 p-6  hover: transition-all duration-300 bg-card text-card-foreground">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-full">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">AI Assistant</h3>
        </div>
      </div>

      <p className="text-muted-foreground mb-6">
        Get quick insights and answers about your note using our AI assistant. Ask questions, summarize content, or explore key concepts.
      </p>

      <Button
        onClick={() => setIsOpen(true)}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-8 py-6 text-lg font-medium  hover: transition-all duration-300"
      >
        <Bot className="mr-2 h-5 w-5" />
        Chat with AI Assistant
      </Button>

      {isOpen && (
        <DynamicChatbot
          noteId={noteId}
          onClose={() => setIsOpen(false)}
        />
      )}
    </Card>
  );
}
