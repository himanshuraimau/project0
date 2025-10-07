"use client";

import { cn } from "@/lib/utils";
import { Course, Unit, Chapter } from "@prisma/client";
import Link from "next/link";
import React from "react";
import { CheckCircle, Circle, BookOpen } from "lucide-react";
import { useChapterProgress } from "@/hooks/use-chapter-progress";
import { useCourseProgress } from "@/contexts/course-progress-context";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

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
  chapterNumber,
  isCurrentChapter
}: {
  chapter: Chapter;
  courseId: string;
  unitIndex: number;
  chapterIndex: number;
  chapterNumber: number;
  isCurrentChapter: boolean;
}) {
  const { progress, updating, toggleCompletion } = useChapterProgress(chapter.id);
  const { refreshProgress } = useCourseProgress();

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    await toggleCompletion();
    // Refresh the overall progress after toggling
    await refreshProgress();
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton 
        asChild 
        isActive={isCurrentChapter}
        className={cn(
          "flex items-center rounded-[6px] transition-colors px-4 py-3",
          isCurrentChapter
            ? "!bg-stone-100 !text-black dark:!bg-stone-900 dark:!text-white"
            : "text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-stone-100"
        )}
      >
        <Link 
          href={`/dashboard/course/${courseId}/${unitIndex}/${chapterIndex}`}
          className="flex items-center gap-3 w-full"
        >
          <div className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-all duration-200",
            progress.isCompleted 
              ? "bg-green-500 text-white shadow-lg shadow-green-500/30" 
              : isCurrentChapter 
              ? "bg-accent text-accent-foreground" 
              : "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400"
          )}>
            {chapterNumber}
          </div>
          <span className={cn(
            "text-sm leading-relaxed truncate font-normal",
            isCurrentChapter && "font-medium"
          )}>
            {chapter.name}
          </span>
        </Link>
      </SidebarMenuButton>
      
      <SidebarMenuAction
        onClick={handleToggle}
        className={cn(
          "opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md p-1",
          progress.isCompleted && "opacity-100"
        )}
      >
        {updating ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : progress.isCompleted ? (
          <CheckCircle className="h-4 w-4 text-green-500 transition-transform hover:scale-110" />
        ) : (
          <Circle className="h-4 w-4 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors" />
        )}
      </SidebarMenuAction>
    </SidebarMenuItem>
  );
}

const CourseSideBar = ({ course, currentChapterId }: Props) => {
  const { unitProgress } = useCourseProgress();

  return (
    <Sidebar collapsible="none" className="fixed top-16 left-14 h-[calc(100vh-7vh)] dark:bg-sidebar ml-2 flex justify-start border-r border-black/10 dark:border-white/10 z-30">
      <SidebarHeader className="border-b pt-7 pb-5 dark:bg-sidebar border-stone-200 dark:border-stone-900 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0 px-4">
          <BookOpen className="w-6 h-6 text-accent flex-shrink-0" />
          <h1 className="text-xl font-semibold text-black dark:text-stone-100 truncate">
            {course.name}
          </h1>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 justify-start pt-2 dark:bg-sidebar px-1 overflow-y-auto">
        {(() => {
          let globalChapterNumber = 0; // Track continuous chapter numbering
          
          return course.units.map((unit, unitIndex) => {
            // Get unit progress from context
            const unitProgressData = unitProgress[unit.id] || {
              completedChapters: 0,
              totalChapters: unit.chapters.length,
              progressPercentage: 0,
            };

            return (
              <SidebarGroup key={unit.id}>
                <div className="px-3 py-2">
                  <SidebarGroupLabel className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400 font-semibold mb-2">
                    Unit {unitIndex + 1}: {unit.name}
                  </SidebarGroupLabel>
                  {/* Unit Progress Bar */}
                  <div className="flex items-center gap-2 mt-1 mb-2">
                    <div className="flex-1 h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent transition-all duration-500 ease-out"
                        style={{ width: `${unitProgressData.progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                      {unitProgressData.completedChapters}/{unitProgressData.totalChapters}
                    </span>
                  </div>
                </div>
              
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {unit.chapters.map((chapter, chapterIndex) => {
                      globalChapterNumber++; // Increment for continuous numbering
                      const isCurrentChapter = chapter.id === currentChapterId;
                      
                      return (
                        <ChapterItem
                          key={chapter.id}
                          chapter={chapter}
                          courseId={course.id}
                          unitIndex={unitIndex}
                          chapterIndex={chapterIndex}
                          chapterNumber={globalChapterNumber}
                          isCurrentChapter={isCurrentChapter}
                        />
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          });
        })()}
      </SidebarContent>

      <SidebarFooter className="mt-auto w-full px-3 py-4 dark:bg-sidebar flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-3 py-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 ring-1 ring-green-500/30" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-700 border border-stone-400 dark:border-stone-600" />
            <span>Pending</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default CourseSideBar;