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
    <div className="h-[280px] w-full rounded-2xl border border-border bg-card flex flex-col">
      <Shimmer>
        {/* Header Section */}
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-muted flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <div className="h-6 bg-muted rounded mb-2 w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </div>
          
          {/* Content lines */}
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
            <div className="h-4 bg-muted rounded w-4/5"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </div>
        
        {/* Footer Section */}
        <div className="p-6 pt-0 border-t border-border/50 mt-auto">
          <div className="flex items-center justify-between">
            <div className="h-6 w-12 bg-muted rounded-lg"></div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-16 bg-muted rounded"></div>
              <div className="h-8 w-18 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </Shimmer>
    </div>
  );
}