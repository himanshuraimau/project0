"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface GenerateCourseCardProps {
  className?: string;
}

export function GenerateCourseCard({ className }: GenerateCourseCardProps) {
  return (
    <Link href="/dashboard/create" className="block">
      <Card className={cn(
        "h-20 transition-all duration-300 hover:shadow-md border-2 border-primary/20 hover:border-primary hover:bg-primary/5 rounded-xl cursor-pointer group",
        className
      )}>
        <CardContent className="p-6 h-full">
          <div className="flex items-center justify-start gap-4 h-full">
            <div className="w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center flex-shrink-0 transition-colors duration-300">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors duration-300">
                Generate Course
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Create AI-powered courses from topics
              </div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Plus className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
