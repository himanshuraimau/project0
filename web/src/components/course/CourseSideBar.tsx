"use client";

import { cn } from "@/lib/utils";
import { Course, Unit, Chapter } from "@prisma/client";
import Link from "next/link";
import React from "react";
import { CheckCircle, Circle, BookOpen, Info, ArrowRight, Moon, Sun, ChevronLeft } from "lucide-react";
import { useTheme } from "next-themes";
import { UserControl } from "@/components/user-control";
import { useChapterProgress } from "@/hooks/use-chapter-progress";
import { useCourseProgress } from "@/contexts/course-progress-context";
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
          "flex items-center rounded-lg transition-all py-2.5 px-3",
          "text-sm font-medium",
          isCurrentChapter
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
        )}
      >
        <Link 
          href={`/dashboard/course/${courseId}/${unitIndex}/${chapterIndex}`}
          className="flex items-center gap-3 w-full"
        >
          <div className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-all duration-200",
            progress.isCompleted 
              ? "bg-green-500 text-white  /30" 
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
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? (resolvedTheme || theme) === "dark" : false;

  return (
    <Sidebar collapsible="icon" className="bg-background m-4 rounded-2xl border-r border-border">
      <SidebarHeader className="px-4 py-6">
        <div className="flex items-center gap-3">
          <UserControl showName={false} />
          {!isCollapsed && (
            <>
              <span className="text-foreground font-medium flex-1">NotesAI</span>
            </>
          )}
          <SidebarTrigger className="text-muted-foreground hover:text-foreground ml-auto transition-all" />
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 py-4 px-2">

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
                <div className="px-4 py-2">
                  <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
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
                  <SidebarMenu className="space-y-1 px-3">
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

      <SidebarFooter className="mx-4 mb-4 p-4">
        {/* Theme Toggle */}
        {!isCollapsed && (
          <div className="mb-3">
            <button
              onClick={() => {
                const newTheme = isDark ? "light" : "dark";
                setTheme(newTheme);
              }}
              className="flex items-center gap-3 w-full rounded-lg transition-all py-2.5 px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50"
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
            className="flex items-center justify-between w-full bg-primary text-primary-foreground rounded-lg px-3 py-2.5 hover:bg-primary/90 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">Upgrade to</span>
              <span className="bg-background text-foreground px-2 py-1 rounded-full text-xs font-semibold">PRO</span>
            </div>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default CourseSideBar;