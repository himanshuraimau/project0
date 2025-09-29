"use client";

import { cn } from "@/lib/utils";
import { Course, Unit, Chapter } from "@prisma/client";
import Link from "next/link";
import React from "react";
import { CheckCircle, Circle, BookOpen } from "lucide-react";
import { useChapterProgress } from "@/hooks/use-chapter-progress";
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
  isCurrentChapter,
  isCollapsed
}: {
  chapter: Chapter;
  courseId: string;
  unitIndex: number;
  chapterIndex: number;
  chapterNumber: number;
  isCurrentChapter: boolean;
  isCollapsed: boolean;
}) {
  const { progress, updating, toggleCompletion } = useChapterProgress(chapter.id);

  return (
    <SidebarMenuItem className={isCollapsed ? "flex justify-center" : ""}>
      <SidebarMenuButton 
        asChild 
        isActive={isCurrentChapter}
        className={cn(
          "flex items-center rounded-[6px] transition-colors",
          isCollapsed ? "w-16 h-16 justify-center" : "px-4 py-3",
          isCurrentChapter
            ? "!bg-stone-100 !text-black dark:!bg-stone-900 dark:!text-white"
            : "text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-stone-100"
        )}
      >
        <Link 
          href={`/dashboard/course/${courseId}/${unitIndex}/${chapterIndex}`}
          className={cn(
            "flex items-center gap-3",
            isCollapsed ? "w-full justify-center" : "w-full"
          )}
        >
          {isCollapsed ? (
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0",
              progress.isCompleted 
                ? "bg-green-500 text-white" 
                : isCurrentChapter 
                ? "bg-accent text-accent-foreground" 
                : "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400"
            )}>
              {chapterNumber}
            </div>
          ) : (
            <>
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0",
                progress.isCompleted 
                  ? "bg-green-500 text-white" 
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
            </>
          )}
        </Link>
      </SidebarMenuButton>
      
      {!isCollapsed && (
        <SidebarMenuAction
          onClick={(e) => {
            e.preventDefault();
            toggleCompletion();
          }}
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md p-1",
            progress.isCompleted && "opacity-100"
          )}
        >
          {updating ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : progress.isCompleted ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-4 w-4 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors" />
          )}
        </SidebarMenuAction>
      )}
    </SidebarMenuItem>
  );
}

const CourseSideBar = ({ course, currentChapterId }: Props) => {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r h-screen bg-white border-stone-200 dark:border-stone-900 dark:bg-stone-900">
      <SidebarHeader className="border-b py-[16px] bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-900">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-3 px-4">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-stone-100 cursor-pointer dark:hover:bg-stone-800 rounded-md transition-colors"
            >
              <BookOpen className="w-[18px] h-[18px] text-accent" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3 min-w-0">
              <BookOpen className="w-5 h-5 text-accent flex-shrink-0" />
              <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100 truncate">
                {course.name}
              </h1>
            </div>
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer rounded-md transition-colors"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1.5 9C1.5 6.23315 1.5 4.84973 2.11036 3.86908C2.33617 3.50627 2.61668 3.1907 2.93918 2.93665C3.81087 2.25 5.04058 2.25 7.5 2.25H10.5C12.9594 2.25 14.1891 2.25 15.0608 2.93665C15.3833 3.1907 15.6638 3.50627 15.8896 3.86908C16.5 4.84973 16.5 6.23315 16.5 9C16.5 11.7668 16.5 13.1503 15.8896 14.1309C15.6638 14.4937 15.3833 14.8093 15.0608 15.0634C14.1891 15.75 12.9594 15.75 10.5 15.75H7.5C5.04058 15.75 3.81087 15.75 2.93918 15.0634C2.61668 14.8093 2.33617 14.4937 2.11036 14.1309C1.5 13.1503 1.5 11.7668 1.5 9Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <path
                  d="M7.125 2.25V15.75"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <path
                  d="M3.75 5.25H4.5M3.75 7.5H4.5"
                  stroke="currentColor"
                  strokeWidth="1.125"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className={cn(
        "flex-1 pt-2 bg-white dark:bg-stone-950",
        isCollapsed ? "px-1 flex flex-col items-center" : "px-2"
      )}>
        {(() => {
          let globalChapterNumber = 0; // Track continuous chapter numbering
          
          return course.units.map((unit, unitIndex) => {
            // Calculate unit progress - placeholder for actual completion logic
            const completedChapters = 0; // This would be calculated based on actual completion status
            const totalChapters = unit.chapters.length;
            const unitProgress = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

            return (
              <SidebarGroup key={unit.id} className={isCollapsed ? "w-full flex flex-col items-center" : ""}>
                {!isCollapsed && (
                  <div className="px-3 py-2">
                    <SidebarGroupLabel className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400 font-semibold mb-2">
                      Unit {unitIndex + 1}: {unit.name}
                    </SidebarGroupLabel>
                    {/* Unit Progress Bar */}
                    <div className="flex items-center gap-2 mt-1 mb-2">
                      <div className="flex-1 h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent transition-all duration-300 ease-out"
                          style={{ width: `${unitProgress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                        {completedChapters}/{totalChapters}
                      </span>
                    </div>
                  </div>
                )}
              
                <SidebarGroupContent>
                  <SidebarMenu className={cn(
                    "space-y-1",
                    isCollapsed && "flex flex-col items-center w-full"
                  )}>
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
                          isCollapsed={isCollapsed}
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

      <SidebarFooter className="mt-auto w-full px-3 py-4 border-t border-stone-200 bg-white dark:border-stone-900 dark:bg-stone-950">
        {!isCollapsed ? (
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-3 py-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent ring-1 ring-accent/30" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-700 border border-stone-400 dark:border-stone-600" />
              <span>Pending</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-3">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <div className="w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-700" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default CourseSideBar;