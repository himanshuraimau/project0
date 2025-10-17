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
  Grid3X3,
  Moon,
  Info,
  ArrowRight,
  PanelLeft,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import { useTheme } from "next-themes";
import { useChapterProgress } from "@/hooks/use-chapter-progress";
import { Course, Unit, Chapter } from "@prisma/client";
import { UserControl } from "@/components/user-control";
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "600"],
  subsets: ["latin-ext", "vietnamese"],
});

const dashboardItems = [
  { title: "Dashboard", icon: Grid3X3, href: "/dashboard" },
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
          "group relative py-2.5 px-3 transition-all hover:bg-accent/50",
          "text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground",
          isCurrentChapter && "bg-accent text-accent-foreground "
        )}
      >
        <Link href={`/dashboard/course/${courseId}/${unitIndex}/${chapterIndex}`}>
          <div className={cn(
            "w-2 h-2 rounded-full flex-shrink-0 mr-3",
            progress.isCompleted
              ? "bg-green-500"
              : isCurrentChapter
                ? "bg-foreground"
                : "bg-muted-foreground/40"
          )} />
          {!isCollapsed && (
            <span className="text-sm font-medium truncate">
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
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isCollapsed = state === "collapsed";
  const isCoursePage = pathname.includes("/course/");
  const [mounted, setMounted] = useState(false);
  const isDark = (resolvedTheme || theme) === "dark";

  const [courseData, setCourseData] = useState<CourseData | null>(null);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

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
        "bg-background rounded-2xl",
        className
      )}
    >
      <SidebarHeader className="px-8 py-6">
        <div className="flex items-center gap-2 w-full">
          {isCollapsed ? (
            <div className="relative group flex items-center w-full justify-center">
              <div className="transition-opacity duration-200 group-hover:opacity-0 group-hover:pointer-events-none">
                <UserControl showName={false} />
              </div>
              <SidebarTrigger
                className="absolute right-0 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto text-muted-foreground hover:text-foreground transition-all text-lg w-8 h-8 p-1.5"
              />
            </div>
          ) : (
            <>
              <UserControl showName={false} />
              <span className="text-foreground font-semibold flex-1 text-xl">NotesAI</span>
              <SidebarTrigger className="text-muted-foreground hover:text-foreground ml-auto transition-all text-lg w-8 h-8 p-1.5" />
            </>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 py-4 px-2">
        {isCoursePage && courseData ? (
          // Course Navigation
          <>
            {/* Course Header */}
            {!isCollapsed && (
              <div className="px-4 py-4 mb-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors mb-3"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to Dashboard
                </Link>
                <h2 className="text-xl font-semibold text-foreground truncate">
                  {courseData.course.name}
                </h2>
              </div>
            )}

            {/* Course Units and Chapters */}
            <div className="space-y-4">
              {courseData.course.units.map((unit, unitIndex) => (
                <SidebarGroup key={unit.id} className={unitIndex > 0 ? "mt-4" : ""}>
                  {!isCollapsed && (
                    <SidebarGroupLabel className="text-xs uppercase tracking-wider px-3 py-2 text-muted-foreground font-semibold">
                      Unit {unitIndex + 1}: {unit.name}
                    </SidebarGroupLabel>
                  )}

                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-0.5 px-3">
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
              <SidebarMenu className="px-3">
                {dashboardItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={cn(
                          "flex items-center rounded-lg transition-all py-2.5 px-3",
                          "text-base font-semibold w-full",
                          isActive 
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                      >
                        <Link 
                          href={item.href} 
                          className="flex items-center w-full"
                        >
                          <Icon className="w-5 h-5 flex-shrink-0 mr-3" />
                          {!isCollapsed && (
                            <span className="text-base font-semibold truncate">
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
  <SidebarFooter className="mx-4 mb-4 p-4">
        {/* Theme Toggle */}
        {!isCollapsed && (
          <div className="mb-3">
            <button
              onClick={() => {
                const newTheme = isDark ? "light" : "dark";
                setTheme(newTheme);
              }}
              className="flex items-center gap-3 w-full rounded-lg transition-all py-2.5 px-3 text-base font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/50"
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
            className="flex items-center justify-between w-full bg-primary text-primary-foreground rounded-lg px-3 py-2.5 hover:bg-primary/90 transition-all duration-200 cursor-pointer text-base font-semibold"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base">Upgrade to</span>
              <span className="bg-background text-foreground px-2 py-1 rounded-full text-sm font-bold">PRO</span>
            </div>
            <ArrowRight className="w-5 h-5" />
          </Link>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}