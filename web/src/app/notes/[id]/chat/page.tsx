"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingScreen from "@/components/LoadingScreen";
import dynamic from "next/dynamic";
import { HugeiconsIcon } from "@hugeicons/react";
import { BotIcon } from "@hugeicons/core-free-icons";
import { useNoteContext } from "@/contexts/note-context";

const DynamicInlineChatbot = dynamic(
  () => import("@/components/chatbot/inline-chatbot"),
  { ssr: false }
);

export default function ChatPage() {
  const params = useParams();
  const noteId = params.id as string;
  const { note } = useNoteContext();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen title="Chat with Note" />;
  }

  const title = note?.title || "Untitled note";

  return (
    <div className="h-full min-h-0 w-full flex flex-col px-4 py-4 sm:px-6">
      <div className="max-w-4xl mx-auto flex-1 min-h-0 flex flex-col w-full">
        <Card className="h-full min-h-0 flex flex-col rounded-2xl border border-border bg-card shadow-sm">
          <CardHeader className="shrink-0 px-5 py-4 border-b border-border/60 bg-muted/30">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <HugeiconsIcon icon={BotIcon} className="size-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base font-semibold text-foreground truncate">
                    Chat with {title}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground truncate">
                    Ask anything – I’ll answer using this note and related context.
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
            <DynamicInlineChatbot
              noteId={noteId}
              className="flex-1 min-h-0 flex flex-col"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
