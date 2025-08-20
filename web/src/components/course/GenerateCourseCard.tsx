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
    <Link href="/dashboard/create" className="block">
      <Card className={cn(
        "h-24 transition-all duration-200 shadow-sm hover:shadow-lg border border-primary/30 hover:border-primary bg-gradient-to-br from-primary/5 to-background rounded-2xl cursor-pointer group",
        className
      )}>
        <CardContent className="p-6 h-full flex items-center">
          <div className="flex items-center gap-5 w-full">
            <div className="w-14 h-14 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center flex-shrink-0 transition-colors duration-200 border border-primary/20">
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-lg text-foreground group-hover:text-primary transition-colors duration-200">
                Generate Course
              </div>
              <div className="text-sm text-muted-foreground mt-1">
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
