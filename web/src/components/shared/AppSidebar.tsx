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
  { title: "Create Course", icon: BookOpen, href: "/dashboard/generate-course"},
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
          "group relative py-2 px-4 transition-all hover:bg-sidebar-accent/60",
          "text-sm font-medium rounded-lg my-0.5 text-sidebar-foreground",
          isCurrentChapter && "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
        )}
      >
        <Link href={`/dashboard/course/${courseId}/${unitIndex}/${chapterIndex}`}>
          <div className={cn(
            "w-2 h-2 rounded-full flex-shrink-0 mr-3",
            progress.isCompleted
              ? "bg-green-500"
              : isCurrentChapter
                ? "bg-sidebar-primary"
                : "bg-sidebar-foreground/40"
          )} />
          {!isCollapsed && (
            <span className="text-base leading-relaxed truncate">
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
            <div className="h-5 w-5 animate-spin rounded-full border border-current border-t-transparent" />
          ) : progress.isCompleted ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <Circle className="h-5 w-5 text-sidebar-foreground/60" />
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
        "bg-sidebar mx-[5vw]",
        className
      )}
    >


      <SidebarContent className="flex-1 my-28 px-4">
        {isCoursePage && courseData ? (
          // Course Navigation
          <>
            {/* Course Header */}
            {!isCollapsed && (
              <div className="px-2 py-3 mb-6">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-3 text-base text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors mb-4"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Back to Dashboard
                </Link>
                <h2 className="text-xl font-semibold text-sidebar-foreground truncate">
                  {courseData.course.name}
                </h2>
              </div>
            )}

            {/* Course Units and Chapters */}
            <div className="space-y-4">
              {courseData.course.units.map((unit, unitIndex) => (
                <SidebarGroup key={unit.id} className={unitIndex > 0 ? "mt-4" : ""}>
                  {!isCollapsed && (
                    <SidebarGroupLabel className="text-sm uppercase tracking-wider px-3 py-3 text-sidebar-foreground/60 font-semibold">
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
                          "flex items-center rounded-lg transition-all py-3 px-5",
                          "text-base font-medium !bg-transparent hover:!bg-transparent",
                          "data-[state=open]:!bg-transparent data-[active=true]:!bg-transparent",
                          isActive 
                            ? "text-black" 
                            : "text-gray-500"
                        )}
                      >
                        <Link 
                          href={item.href} 
                          className="flex items-center gap-4 w-full hover:text-black"
                        >
                          <Icon className={cn(
                            "w-10 h-10 flex-shrink-0 transition-colors",
                            isActive ? "text-black" : "text-gray-500 hover:text-black"
                          )} />
                          {!isCollapsed && (
                            <span className={cn(
                              "text-[1.2rem] leading-relaxed font-medium transition-colors",
                              isActive ? "text-black" : "text-gray-500 hover:text-black"
                            )}>
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
        <SidebarFooter className="py-4 px-4 bg-sidebar ">
          {isCoursePage ? (
            // Course Footer
            <div className="flex items-center justify-between text-xs text-sidebar-foreground/60">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-sidebar-foreground/40" />
                <span>In Progress</span>
              </div>
            </div>
          ) : (
            // Dashboard Footer
            <div className="flex items-center gap-4 px-5 py-4 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500">
              <span className="text-2xl">⚡</span>
              <span className="font-bold text-lg text-white">Unlimited Notes</span>
            </div>
          )}
        </SidebarFooter>
      )}
    </Sidebar>
  );
}