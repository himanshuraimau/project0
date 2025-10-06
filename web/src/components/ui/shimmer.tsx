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
    <div className="w-full bg-slate-50/80 dark:bg-black border border-black/10 dark:border-border/50 shadow-sm rounded-lg">
      <Shimmer>
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            {/* Left section - Title and Content */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              <div className="mb-2">
                <div className="h-6 shimmer-element rounded w-3/4 mb-1"></div>
                <div className="h-5 shimmer-element rounded w-1/2"></div>
              </div>
              
              {/* Date */}
              <div className="mb-3">
                <div className="h-4 shimmer-element rounded w-24"></div>
              </div>

              {/* Content Preview */}
              <div className="space-y-2">
                <div className="h-4 shimmer-element rounded w-full"></div>
                <div className="h-4 shimmer-element rounded w-5/6"></div>
              </div>
            </div>

            {/* Right section - Action Buttons */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <div className="h-8 w-16 shimmer-element rounded-full"></div>
              <div className="h-8 w-18 shimmer-element rounded-full"></div>
            </div>
          </div>
        </div>
      </Shimmer>
    </div>
  );
}