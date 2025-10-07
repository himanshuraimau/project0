import React from "react";
import { FileText } from "lucide-react";

export function NoteDetailSkeleton() {
  return (
    <div className="min-h-[calc(100vh-64px)] w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        {/* Animated Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative bg-card border border-border rounded-full p-8 shadow-lg">
            <FileText className="h-12 w-12 text-primary animate-pulse" />
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Loading Note</h3>
          <p className="text-sm text-muted-foreground">Please wait a moment...</p>
        </div>

        {/* Loading Bar */}
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-loading-bar" />
        </div>
      </div>
    </div>
  );
}

export default NoteDetailSkeleton;
