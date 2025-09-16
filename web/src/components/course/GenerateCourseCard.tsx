"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, CirclePlus, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface GenerateCourseCardProps {
  className?: string;
}

export function GenerateCourseCard({ className }: GenerateCourseCardProps) {
  return (
    <Link href="/dashboard/create/wizard" className="block">
      <Card
        className={cn(
          "h-20 transition-all duration-200 shadow-sm hover:shadow-lg border border-stone-200 dark:border-stone-800 dark:bg-stone-900 hover:border-stone-400 bg-white rounded-[12px] cursor-pointer group",
          className
        )}
      >
        <CardContent className="p-6 h-full flex items-center">
          <div className="flex items-center gap-5 w-full">
            <div className="size-14 rounded-full  flex items-center justify-center flex-shrink-0 transition-colors duration-200">
              <BookOpen className="size-8 text-stone-800 dark:text-stone-100" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-lg text-foreground group-hover:text-stone-800 dark:group-hover:text-stone-200 transition-colors duration-200">
                Generate Course
              </div>
              <div className="text-sm font-medium text-stone-500 mt-1">
                Create AI-powered courses from topics
              </div>
            </div>
            <div className="flex items-center">
              <span className="inline-flex items-center gap-1 px-2 py-2 rounded-full  text-stone-200 text-xs font-semibold group-hover:bg-primary/10 transition-colors duration-200">
                <CirclePlus className="size-6 text-stone-800 dark:text-stone-200" />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
