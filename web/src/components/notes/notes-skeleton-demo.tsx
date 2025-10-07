"use client";

import React, { useState } from "react";
import { NoteDetailSkeleton } from "./notes-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Demo component to showcase the NoteDetailSkeleton
 * This is just for demonstration purposes
 */
export function NoteSkeletonDemo() {
  const [showChatbot, setShowChatbot] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Controls */}
      <Card className="m-8 mb-4">
        <CardHeader>
          <CardTitle>Note Detail Skeleton Demo</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button
            variant={showChatbot ? "default" : "outline"}
            onClick={() => setShowChatbot(!showChatbot)}
          >
            {showChatbot ? "Hide" : "Show"} Chatbot Sidebar
          </Button>
        </CardContent>
      </Card>

      {/* Skeleton Preview */}
      <NoteDetailSkeleton showChatbot={showChatbot} />
    </div>
  );
}

export default NoteSkeletonDemo;
