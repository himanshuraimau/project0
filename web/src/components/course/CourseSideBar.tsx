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
  isCurrentChapter
}: {
  chapter: Chapter;
  courseId: string;
  unitIndex: number;
  chapterIndex: number;
  isCurrentChapter: boolean;
}) {
  const { progress, updating, toggleCompletion } = useChapterProgress(chapter.id);
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarMenuItem>
      <SidebarMenuButton 
        asChild 
        isActive={isCurrentChapter}
        className="group relative py-1.5 px-2"
      >
        <Link href={`/dashboard/course/${courseId}/${unitIndex}/${chapterIndex}`}>
          <div className={cn(
            "w-1.5 h-1.5 rounded-full flex-shrink-0 mr-2",
            progress.isCompleted 
              ? "bg-green-500" 
              : isCurrentChapter 
              ? "bg-primary" 
              : "bg-muted-foreground/40"
          )} />
          {!isCollapsed && (
            <span className="text-xs leading-relaxed truncate">
              {chapter.name}
            </span>
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
            "opacity-0 group-hover:opacity-100 transition-opacity",
            progress.isCompleted && "opacity-100"
          )}
        >
          {updating ? (
            <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
          ) : progress.isCompleted ? (
            <CheckCircle className="h-3 w-3 text-green-500" />
          ) : (
            <Circle className="h-3 w-3" />
          )}
        </SidebarMenuAction>
      )}
    </SidebarMenuItem>
  );
}

const CourseSideBar = ({ course, currentChapterId }: Props) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
          {!isCollapsed && (
            <h1 className="font-semibold text-sm truncate">
              {course.name}
            </h1>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {course.units.map((unit, unitIndex) => (
          <SidebarGroup key={unit.id}>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-[10px] uppercase tracking-wider px-2">
                Unit {unitIndex + 1}: {unit.name}
              </SidebarGroupLabel>
            )}
            
            <SidebarGroupContent>
              <SidebarMenu>
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
        ))}
      </SidebarContent>

      {!isCollapsed && (
        <SidebarFooter className="border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-2 py-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
              <span>Not started</span>
            </div>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
};

export default CourseSideBar;