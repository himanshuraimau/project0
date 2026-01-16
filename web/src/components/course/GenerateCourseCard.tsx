"use client";

import React from "react";
import { BookOpen, CirclePlus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface GenerateCourseCardProps {
  className?: string;
}

export function GenerateCourseCard({ className }: GenerateCourseCardProps) {
  return (
    <Link href="/dashboard/create/wizard" className="block">
      <div
        className={cn(
          "h-24 neomorphic rounded-2xl cursor-pointer group p-4 flex items-center",
          className
        )}
      >
        <div className="flex items-center gap-2 w-full">
          <div className="size-14 rounded-full neomorphic-icon flex items-center justify-center shrink-0 transition-colors duration-200 group-hover:bg-accent/20">
            <BookOpen className="size-8 text-accent" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-semibold text-lg text-foreground transition-colors duration-200">
              Generate Course
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              Create AI-powered courses from topics
            </div>
          </div>
          <div className="flex items-center">
            <span className="inline-flex items-center gap-1 px-2 py-2 rounded-full transition-colors duration-200 group-hover:bg-accent/10">
              <CirclePlus className="size-6 text-accent" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
