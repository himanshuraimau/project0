"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ShimmerProps {
  className?: string;
  children?: React.ReactNode;
}

export function Shimmer({ className, children }: ShimmerProps) {
  return (
    <div className={cn("animate-pulse", className)}>
      {children}
    </div>
  );
}

// Note card shimmer component
export function NoteCardShimmer() {
  return (
    <div className="h-[320px] w-full bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/60 shadow-sm rounded-lg flex flex-col">
      <Shimmer>
        <div className="p-6 flex flex-col h-full">
          {/* Title - Centered */}
          <div className="text-center mb-3">
            <div className="h-6 bg-muted rounded mx-auto w-3/4 mb-2"></div>
            <div className="h-5 bg-muted rounded mx-auto w-1/2"></div>
          </div>

          {/* Date - Centered */}
          <div className="text-center mb-4">
            <div className="h-4 bg-muted rounded mx-auto w-24"></div>
          </div>

          {/* Content Preview */}
          <div className="flex-1 mb-4">
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
              <div className="h-4 bg-muted rounded w-4/5"></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-center mt-auto">
            <div className="h-8 w-16 bg-muted rounded-full"></div>
            <div className="h-8 w-18 bg-muted rounded-full"></div>
          </div>
        </div>
      </Shimmer>
    </div>
  );
}