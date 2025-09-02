"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Plus } from "lucide-react";
import { ChevronRight } from "lucide-react";
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
          "h-24 transition-all duration-200 shadow-sm hover:shadow-lg border border-primary/30 hover:border-primary bg-gradient-to-br from-primary/5 to-background rounded-[8px] cursor-pointer group",
          className
        )}
      >
        <CardContent className="p-6 h-full flex items-center">
          <div className="flex items-center gap-5 w-full">
            <div className="size-14 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0 transition-colors duration-200">
              <BookOpen className="size-10 text-stone-800" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-[20px] text-foreground group-hover:text-primary transition-colors duration-200">
                Generate Course
              </div>
              <div className="text-sm font-medium text-muted-foreground mt-1">
                Create AI-powered courses from topics
              </div>
            </div>
            <div className="flex items-center">
              <span className="inline-flex items-center gap-1 px-2 py-2 rounded-full bg-primary/10 text-primary text-xs font-semibold group-hover:bg-primary/20 transition-colors duration-200">
                <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
