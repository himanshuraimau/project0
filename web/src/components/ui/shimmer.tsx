"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ShimmerProps {
  className?: string;
  children?: React.ReactNode;
}

export function Shimmer({ className, children }: ShimmerProps) {
  return <div className={cn("animate-pulse", className)}>{children}</div>;
}

/** Single line/block for premium skeleton (use skeleton-base on wrapper for shimmer sweep) */
function SkeletonLine({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("skeleton-base h-4 rounded-md", className)} {...props} />
  );
}

/** Note card skeleton with premium shimmer effect */
export function NoteCardShimmer() {
  return (
    <div className="w-full rounded-2xl border-none bg-card overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          {/* Left: icon + content */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Icon placeholder */}
            <div className="skeleton-base h-14 w-14 shrink-0 rounded-xl" />
            <div className="flex-1 min-w-0 space-y-2">
              <SkeletonLine className="h-5 w-3/4 max-w-[200px]" />
              <SkeletonLine className="h-4 w-20" />
            </div>
          </div>
          {/* Right: buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="skeleton-base h-8 w-16 rounded-md" />
            <div className="skeleton-base h-8 w-14 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Folder card skeleton with premium shimmer */
export function FolderCardShimmer() {
  return (
    <div className="w-full rounded-2xl border border-border bg-card overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="skeleton-base h-[52px] w-[52px] shrink-0 rounded-lg" />
            <div className="flex-1 min-w-0 space-y-2">
              <SkeletonLine className="h-6 w-2/3 max-w-[140px]" />
              <SkeletonLine className="h-4 w-16" />
              <div className="space-y-1.5 pt-1">
                <SkeletonLine className="w-full" />
                <SkeletonLine className="w-4/5" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="skeleton-base h-8 w-8 rounded-md" />
            <div className="skeleton-base h-10 w-10 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
