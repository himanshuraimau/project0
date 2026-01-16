"use client";

import React from "react";
import { CourseContentTabs } from "@/components/course/CourseContentTabs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { Course, Unit, Chapter, Question } from "@prisma/client";

interface CoursePageContentProps {
  course: Course & {
    units: (Unit & {
      chapters: (Chapter & {
        questions: Question[];
      })[];
    })[];
  };
  chapter: Chapter & {
    questions: Question[];
  };
  unitIndex: number;
  chapterIndex: number;
  nextChapter?: Chapter;
  prevChapter?: Chapter;
}

export function CoursePageContent({ 
  course, 
  chapter, 
  unitIndex, 
  chapterIndex, 
  nextChapter, 
  prevChapter 
}: CoursePageContentProps) {
  const [isPending, startTransition] = useTransition();
  
  React.useEffect(() => {
    // Scroll to top when chapter changes - use instant to avoid the jarring effect
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [chapter.id]);

  return (
    <>
      {isPending && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <LoadingSkeleton />
        </div>
      )}
      
      {/* Unified Course Content Container */}
      <div className="space-y-0">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center text-sm text-muted-foreground py-4" aria-label="Breadcrumb">
          <Link 
            href="/dashboard" 
            className="hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4 mx-2 shrink-0" />
          <span className="text-foreground font-medium truncate">{course.name}</span>
          <ChevronRight className="h-4 w-4 mx-2 shrink-0" />
          <span className="truncate">Unit {unitIndex + 1}</span>
          <ChevronRight className="h-4 w-4 mx-2 shrink-0" />
          <span className="text-foreground font-medium">Chapter {chapterIndex + 1}</span>
        </nav>

        {/* Page Title */}
        <header className="pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {chapter.name}
          </h1>
        </header>

        {/* Content Tabs - No extra margin */}
        <div className="w-full">
          <CourseContentTabs 
            chapter={chapter}
          />
        </div>

        {/* Navigation Section */}
        <div className="border-t border-border pt-8 mt-16">
          <div className="flex items-center justify-between gap-4">
            {prevChapter ? (
              <Link
                href={`/dashboard/course/${course.id}/${unitIndex}/${chapterIndex - 1}`}
                onClick={() => startTransition(() => {})}
                className="group flex items-center gap-4 rounded-xl bg-muted/50 hover:bg-muted px-6 py-4 text-sm font-medium text-foreground transition-all hover:"
              >
                <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
                <div className="text-left">
                  <div className="text-xs text-muted-foreground mb-1">Previous</div>
                  <div className="font-semibold text-base truncate max-w-48">{prevChapter.name}</div>
                </div>
              </Link>
            ) : (
              <div></div>
            )}

            {nextChapter ? (
              <Link
                href={`/dashboard/course/${course.id}/${unitIndex}/${chapterIndex + 1}`}
                onClick={() => startTransition(() => {})}
                className="group flex items-center gap-4 rounded-xl bg-accent hover:bg-accent/90 px-6 py-4 text-sm font-medium text-accent-foreground transition-all hover:"
              >
                <div className="text-right">
                  <div className="text-xs text-accent-foreground/80 mb-1">Next</div>
                  <div className="font-semibold text-base truncate max-w-48">{nextChapter.name}</div>
                </div>
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <div></div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden course data for sidebar */}
      <script
        id="course-data"
        type="application/json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            course,
            currentChapterId: chapter.id
          })
        }}
      />
    </>
  );
}

// Loading Skeleton Component
function LoadingSkeleton() {
  return (
    <div className="min-h-screen w-full bg-background p-6">
      <div className="max-w-5xl mx-auto">
        {/* Loading Text with Pulse */}
        <div className="text-center mb-8 space-y-3">
          <h2 className="text-2xl font-bold text-foreground animate-pulse">
            Loading Chapter
          </h2>
          <p className="text-muted-foreground animate-pulse" style={{ animationDelay: '0.5s' }}>
            Please wait a moment...
          </p>
        </div>

        {/* Skeleton Card */}
        <div className="rounded-2xl border-2 border-dashed border-black/30 dark:border-muted/30 bg-accent/5 p-8">
          <div className="space-y-6">
            {/* Title Bar */}
            <div className="h-8 w-3/4 bg-muted rounded-xl relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>

            {/* Breadcrumb Lines */}
            <div className="flex gap-2 items-center">
              <div className="h-4 w-20 bg-muted rounded relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
              <div className="h-4 w-4 bg-muted rounded" />
              <div className="h-4 w-24 bg-muted rounded relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
            </div>

            {/* Content Lines */}
            <div className="space-y-4 pt-6">
              <div className="h-4 w-full bg-muted rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
              <div className="h-4 w-11/12 bg-muted rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
              <div className="h-4 w-9/12 bg-muted rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>

              {/* Spacing */}
              <div className="h-8" />

              <div className="h-4 w-full bg-muted rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
              <div className="h-4 w-10/12 bg-muted rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
              <div className="h-4 w-7/12 bg-muted rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
            </div>

            {/* Tab Skeletons */}
            <div className="flex gap-3 pt-6">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 w-32 bg-muted rounded-lg relative overflow-hidden"
                >
                  <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}