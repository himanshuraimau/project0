"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dynamic from "next/dynamic";

const DynamicInlineChatbot = dynamic(
  () => import("@/components/chatbot/inline-chatbot"),
  { ssr: false }
);

export default function ChatPage() {
  const params = useParams();
  const noteId = params.id as string;

  return (
    <Card className="bg-card h-[calc(100vh-100px)] mx-4 my-4 flex flex-col border border-black/20 dark:border-white/20 rounded-3xl">
      <CardHeader className="p-5 border-b border-stone-100 dark:border-stone-900 bg-muted/5">
        <div className="flex items-center gap-4">
          <CardTitle className="font-normal">
            Chat about Note
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 p-0 flex-1 overflow-y-hidden">
        <DynamicInlineChatbot noteId={noteId} />
      </CardContent>
    </Card>
  );
}

