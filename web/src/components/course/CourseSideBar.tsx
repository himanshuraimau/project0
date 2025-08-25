"use client";

import { cn } from "@/lib/utils";
import { Course, Unit, Chapter } from "@prisma/client";
import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";
import { CheckCircle, Circle } from "lucide-react";
import { useChapterProgress } from "@/hooks/use-chapter-progress";

type Props = {
  course: Course & {
    units: (Unit & {
      chapters: Chapter[];
    })[];
  };
  currentChapterId: string;
};

// Individual chapter item component
function ChapterItem({ 
  chapter, 
  courseId, 
  unitIndex, 
  chapterIndex, 
  isCurrentChapter 
}: {
  chapter: Chapter;
  courseId: string;
  unitIndex: number;
  chapterIndex: number;
  isCurrentChapter: boolean;
}) {
  const { progress, updating, toggleCompletion } = useChapterProgress(chapter.id);

  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-lg transition-colors duration-150",
      isCurrentChapter
        ? "bg-primary/10 border border-primary/20"
        : "hover:bg-muted"
    )}>
      <Link
        href={`/dashboard/course/${courseId}/${unitIndex}/${chapterIndex}`}
        className={cn(
          "flex-1 text-sm transition-colors duration-150 cursor-pointer py-1",
          isCurrentChapter
            ? "text-primary font-bold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {chapter.name}
      </Link>
      
      <Button
        size="sm"
        variant="ghost"
        onClick={(e) => {
          e.preventDefault();
          toggleCompletion();
        }}
        disabled={updating}
        className={cn(
          "h-6 w-6 p-0 hover:bg-transparent",
          progress.isCompleted 
            ? "text-green-500 hover:text-green-600" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {updating ? (
          <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
        ) : progress.isCompleted ? (
          <CheckCircle className="h-4 w-4" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

const CourseSideBar = ({ course, currentChapterId }: Props) => {
  return (
  <div className="h-full w-full p-6 rounded-r-3xl overflow-y-auto sticky top-0">
      <h1 className="text-3xl font-bold mb-4 text-foreground">{course.name}</h1>
      {course.units.map((unit, unitIndex) => (
        <div key={unit.id} className="mt-6">
          <h2 className="text-xs uppercase text-muted-foreground tracking-wide mb-1">
            Unit {unitIndex + 1}
          </h2>
          <h2 className="text-xl font-bold text-foreground mb-2">{unit.name}</h2>
          <div className="space-y-1">
            {unit.chapters.map((chapter, chapterIndex) => (
              <ChapterItem
                key={chapter.id}
                chapter={chapter}
                courseId={course.id}
                unitIndex={unitIndex}
                chapterIndex={chapterIndex}
                isCurrentChapter={chapter.id === currentChapterId}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CourseSideBar;