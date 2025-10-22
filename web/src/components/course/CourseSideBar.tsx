"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  Circle,
  Moon,
  ArrowUpRight,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useChapterProgress } from "@/hooks/use-chapter-progress";
import { useCourseProgress } from "@/contexts/course-progress-context";
import { Course, Unit, Chapter } from "@prisma/client";
import { Plus_Jakarta_Sans } from "next/font/google";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

type Props = {
  course: Course & {
    units: (Unit & {
      chapters: Chapter[];
    })[];
  };
  currentChapterId: string;
};

interface CourseSideBarProps {
  className?: string;
}

interface ChapterItemProps {
  chapter: Chapter;
  courseId: string;
  unitIndex: number;
  chapterIndex: number;
  isCurrentChapter: boolean;
}

function ChapterItem({
  chapter,
  courseId,
  unitIndex,
  chapterIndex,
  isCurrentChapter,
}: ChapterItemProps) {
  const { progress, updating, toggleCompletion } = useChapterProgress(
    chapter.id
  );
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { updateChapterProgress, refreshProgress, chapterProgress } = useCourseProgress();
  
  // Convert chapter index to lowercase roman numerals (i, ii, iii, etc.)
  const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
  const chapterRoman = romanNumerals[chapterIndex] || String(chapterIndex + 1);

  // Use the course progress context as the source of truth, fall back to local progress
  const contextProgress = chapterProgress[chapter.id];
  const isCompleted = contextProgress !== undefined ? contextProgress.isCompleted : progress.isCompleted;

  const handleToggleCompletion = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      // First call the API to update the chapter completion
      await toggleCompletion();
      // Then refresh the full progress to get the updated state from server
      await refreshProgress();
    } catch (error) {
      console.error('Error toggling chapter completion:', error);
      // Refresh progress to ensure UI is in sync with server state
      await refreshProgress();
    }
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isCurrentChapter}
        className={cn(
          "group relative py-2.5 px-3 transition-all hover:bg-accent/50",
          "text-sm font-medium rounded-sm text-muted-foreground hover:text-foreground",
          isCurrentChapter && "bg-accent text-accent-foreground "
        )}
      >
        <Link
          href={`/dashboard/course/${courseId}/${unitIndex}/${chapterIndex}`}
        >
          <span
            className={cn(
              "w-5 h-5 rounded-sm flex items-center justify-center flex-shrink-0 mr-3 text-xs font-semibold",
              isCompleted
                ? "bg-green-500 text-white"
                : isCurrentChapter
                ? "bg-muted-foreground/10 text-black dark:text-white"
                : "bg-muted-foreground/40 text-foreground"
            )}
          >
            {chapterRoman}
          </span>
          {!isCollapsed && (
            <span className="text-sm font-medium truncate">{chapter.name}</span>
          )}
        </Link>
      </SidebarMenuButton>

      {!isCollapsed && (
        <SidebarMenuAction
          onClick={handleToggleCompletion}
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity mr-2",
            isCompleted && "opacity-100"
          )}
        >
          {updating ? (
            <div className="h-5 w-5 animate-spin rounded-sm border border-current border-t-transparent" />
          ) : isCompleted ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <Circle className="h-5 w-5 text-sidebar-foreground/60" />
          )}
        </SidebarMenuAction>
      )}
    </SidebarMenuItem>
  );
}

const CourseSideBar = ({ course, currentChapterId }: Props) => {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = (resolvedTheme || theme) === "dark";
  const { unitProgress } = useCourseProgress();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Sidebar collapsible="icon" className={cn("bg-background rounded-sm")}>
      <SidebarHeader className="px-5 py-6">
              <div className="flex items-center gap-2 w-full group">
                {isCollapsed ? (
                  <div className="relative flex items-center w-full justify-center">
                    <div>
                      <img
                        src="/logo.png"
                        alt="JelliNote AI"
                        className="h-10 w-auto rounded-md transition-opacity duration-200 opacity-100 group-hover:opacity-0 visible group-hover:invisible"
                      />
                    </div>
                    <SidebarTrigger
                      className="absolute opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all text-lg w-10 h-10 pointer-events-none group-hover:pointer-events-auto"
                    />
                  </div>
                ) : (
                  <>
                  <div>
                    <img src="/logo.png" alt="JelliNote AI" className="h-10 w-auto mr-2 rounded-md" />
                  </div>
                    <div className={`text-foreground flex-1 ${jakarta.className}`}>
                      <div className="text-lg font-semibold leading-5">JelliNote AI</div>
                      <div className="text-sm text-muted-foreground font-medium leading-4">Smart Notes</div>
                    </div>
                    <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-all text-lg w-10 h-10" />
                  </>
                )}
              </div>
            </SidebarHeader>

      <SidebarContent className="flex-1 py-4 px-0 overflow-x-hidden">
        {/* Course Header */}
        {!isCollapsed && (
          <div className="px-4 py-2 border-b border-gray-200/50 dark:border-gray-800/50">
            <h2 className="text-lg font-semibold text-foreground truncate">
              {course.name}
            </h2>
          </div>
        )}

        {/* Course Units and Chapters */}
        <div className="space-y-2 px-2">
          {course.units.map((unit, unitIndex) => {
            const unitProgressData = unitProgress[unit.id] || {
              completedChapters: 0,
              totalChapters: unit.chapters.length,
              progressPercentage: 0,
            };
            return (
            <SidebarGroup
              key={unit.id}
              className={unitIndex > 0 ? "mt-2" : ""}
            >
              {!isCollapsed && (
                <div>
                  <SidebarGroupLabel className="px-3 py-2 mb-2 rounded-md border border-gray-200/50 dark:border-gray-700/50 flex items-center gap-2 overflow-hidden">
                    <div className="w-6 h-6 rounded-md bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {unitIndex + 1}
                    </div>
                    <span className="text-xs font-semibold text-foreground truncate">
                      {unit.name}
                    </span>
                  </SidebarGroupLabel>
                  <div className="px-3 py-2 mb-2">
                    <div className="flex items-center gap-2">
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
                </div>
              )}

              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5 px-2 ml-2 pl-3 border-l-2 border-gray-200 dark:border-gray-700">
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
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            );
          })}
        </div>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="mx-4 mb-4">
        {/* Theme Toggle */}
        {!isCollapsed && (
          <div>
            <button
              onClick={() => {
                const newTheme = isDark ? "light" : "dark";
                setTheme(newTheme);
              }}
              className="flex items-center gap-3 w-full rounded-sm transition-all py-3 px-3 text-base font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/50"
            >
              {mounted && (
                <>
                  {isDark ? (
                    <Sun className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <Moon className="w-5 h-5 flex-shrink-0" />
                  )}
                  <span>Switch mode</span>
                </>
              )}
              {!mounted && <div className="w-5 h-5" />}
            </button>
          </div>
        )}

        {/* PRO Upgrade Button */}
        {!isCollapsed && (
          <Link 
            href="/pricing"
            className="flex items-center justify-between w-full bg-black dark:bg-[#F3F3F3] text-primary-foreground rounded-sm px-4 py-3 transition-all duration-200 cursor-pointer text-base font-semibold"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white dark:text-black">Upgrade to</span>
              <span className="bg-background text-foreground px-2 py-1 rounded-[0.4rem] text-sm font-bold">PRO</span>
            </div>
            <ArrowUpRight className={cn("w-6 h-6", isDark ? "text-black" : "text-white")} />
          </Link>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default CourseSideBar;
