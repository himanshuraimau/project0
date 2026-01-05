"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { MindmapGenerator } from "@/components/mindmap";
import { useNoteContext } from "@/contexts/note-context";
import { useMindmap } from "@/hooks/use-mindmap";
import { toast } from "sonner";

export default function MindmapPage() {
  const params = useParams();
  const noteId = params.id as string;
  const { note } = useNoteContext();
  const {
    loading: mindmapLoading,
    error: mindmapError,
    generateMindmap,
    getMindmap,
  } = useMindmap();

  useEffect(() => {
    const initializeMindmap = async () => {
      if (!noteId) return;
      try {
        const existingMindmap = await getMindmap(noteId);
        if (!existingMindmap) {
          await generateMindmap(noteId);
        }
      } catch (error) {
        console.error("Error with mindmap:", error);
        toast.error("Failed to generate mindmap");
      }
    };

    initializeMindmap();
  }, [noteId]);

  return (
    <div>
      {mindmapLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-3"></div>
            <p className="text-sm text-muted-foreground">
              Generating mindmap...
            </p>
          </div>
        </div>
      )}
      <MindmapGenerator
        key={`mindmap-${noteId}`}
        noteId={noteId}
      />
      {mindmapError && (
        <div className="text-center text-red-600 py-8">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">⚠️</span>
          </div>
          <p className="font-medium mb-1">
            Error generating mindmap
          </p>
          <p className="text-sm">{mindmapError}</p>
        </div>
      )}
    </div>
  );
}

