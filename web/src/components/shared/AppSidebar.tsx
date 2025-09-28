"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Home,
  HelpCircle,
  HeadphonesIcon,
  Settings,
  BookOpen,
  CheckCircle,
  Circle,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import { useChapterProgress } from "@/hooks/use-chapter-progress";
import { Course, Unit, Chapter } from "@prisma/client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  useSidebar,
} from "@/components/ui/sidebar";

const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "600"],
  subsets: ["latin-ext", "vietnamese"],
});

const dashboardItems = [
  { title: "Dashboard", icon: Home, href: "/dashboard" },
  {
    title: "Create Course",
    icon: BookOpen,
    href: "/dashboard/generate-course",
  },
  { title: "How to use", icon: HelpCircle, href: "/dashboard/how-to-use" },
  { title: "Support", icon: HeadphonesIcon, href: "/dashboard/support" },
  { title: "Settings", icon: Settings, href: "/dashboard/settings" },
];

interface CourseData {
  course: Course & {
    units: (Unit & {
      chapters: Chapter[];
    })[];
  };
  currentChapterId: string;
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
  isCurrentChapter 
}: ChapterItemProps) {
  const { progress, updating, toggleCompletion } = useChapterProgress(chapter.id);
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarMenuItem>
      <SidebarMenuButton 
        asChild 
        isActive={isCurrentChapter}
        className={cn(
          "group relative py-2 px-4 transition-all hover:bg-accent/60",
          "text-sm font-medium rounded-lg my-0.5",
          isCurrentChapter && "bg-accent text-accent-foreground shadow-sm"
        )}
      >
        <Link href={`/dashboard/course/${courseId}/${unitIndex}/${chapterIndex}`}>
          <div className={cn(
            "w-2 h-2 rounded-full flex-shrink-0 mr-3",
            progress.isCompleted 
              ? "bg-green-500" 
              : isCurrentChapter 
              ? "bg-primary" 
              : "bg-muted-foreground/40"
          )} />
          {!isCollapsed && (
            <span className="text-sm leading-relaxed truncate">
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
            "opacity-0 group-hover:opacity-100 transition-opacity mr-2",
            progress.isCompleted && "opacity-100"
          )}
        >
          {updating ? (
            <div className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />
          ) : progress.isCompleted ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
        </SidebarMenuAction>
      )}
    </SidebarMenuItem>
  );
}

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isCoursePage = pathname.includes("/course/");
  
  const [courseData, setCourseData] = useState<CourseData | null>(null);

  // Check for course data in DOM when on course pages
  useEffect(() => {
    if (isCoursePage) {
      const courseDataScript = document.getElementById('course-data');
      if (courseDataScript) {
        try {
          const data = JSON.parse(courseDataScript.textContent || '{}');
          setCourseData(data);
        } catch (error) {
          console.error('Failed to parse course data:', error);
        }
      }
    } else {
      setCourseData(null);
    }
  }, [isCoursePage, pathname]);

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "border-r border-border bg-card/50 backdrop-blur-sm sticky top-0 h-screen",
        className
      )}
    >
      <SidebarHeader className="border-b border-border py-4 px-6 bg-background/80 backdrop-blur-sm">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-accent rounded-md transition-colors"
            >
              <BookOpen className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`text-xl font-semibold text-foreground ${jakarta.className}`}
              >
                SonicLearn
              </span>
            </div>
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-accent rounded-md transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="flex-1 py-4 px-4 overflow-y-auto">
        {isCoursePage && courseData ? (
          // Course Navigation
          <>
            {/* Course Header */}
            {!isCollapsed && (
              <div className="px-2 py-3 mb-6">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to Dashboard
                </Link>
                <h2 className="text-lg font-semibold text-foreground truncate">
                  {courseData.course.name}
                </h2>
              </div>
            )}
            
            {/* Course Units and Chapters */}
            <div className="space-y-4">
              {courseData.course.units.map((unit, unitIndex) => (
                <SidebarGroup key={unit.id} className={unitIndex > 0 ? "mt-4" : ""}>
                  {!isCollapsed && (
                    <SidebarGroupLabel className="text-xs uppercase tracking-wider px-2 py-2 text-muted-foreground font-semibold">
                      Unit {unitIndex + 1}: {unit.name}
                    </SidebarGroupLabel>
                  )}
                  
                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-0.5">
                      {unit.chapters.map((chapter, chapterIndex) => (
                        <ChapterItem
                          key={chapter.id}
                          chapter={chapter}
                          courseId={courseData.course.id}
                          unitIndex={unitIndex}
                          chapterIndex={chapterIndex}
                          isCurrentChapter={chapter.id === courseData.currentChapterId}
                        />
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </div>
          </>
        ) : (
          // Dashboard Navigation
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {dashboardItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={cn(
                          "flex items-center rounded-lg transition-all py-2 px-4",
                          "text-sm font-medium hover:bg-accent/60",
                          isActive && "bg-accent text-accent-foreground shadow-sm"
                        )}
                      >
                        <Link href={item.href} className="flex items-center gap-3 w-full">
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          {!isCollapsed && (
                            <span className="leading-relaxed font-medium">
                              {item.title}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      {!isCollapsed && (
        <SidebarFooter className="py-4 px-4 bg-background/80">
          {isCoursePage ? (
            // Course Footer
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                <span>In Progress</span>
              </div>
            </div>
          ) : (
            // Dashboard Footer
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-accent/30">
              <span className="text-xl">⚡</span>
              <span className="font-medium text-sm">Unlimited Notes</span>
            </div>
          )}
        </SidebarFooter>
      )}
    </Sidebar>
  );
}