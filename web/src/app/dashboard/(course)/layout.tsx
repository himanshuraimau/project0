"use client";

import React, { useEffect, useState } from "react";
import CourseSideBar from "@/components/course/CourseSideBar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { CourseProgressProvider } from "@/contexts/course-progress-context";
import { Course, Unit, Chapter } from "@prisma/client";
import { usePathname } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const jakarta = Plus_Jakarta_Sans({
  weight: "600",
  subsets: ["latin"],
});

interface CourseData {
  course: Course & {
    units: (Unit & {
      chapters: Chapter[];
    })[];
  };
  currentChapterId: string;
}

export default function CourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const pathname = usePathname();

  // Only show course sidebar for actual course content pages, not creation pages
  const isActualCoursePage =
    pathname.includes("/course/") && !pathname.includes("/create/");

  useEffect(() => {
    if (!isActualCoursePage) return;

    // Listen for course data from the page component
    const checkForCourseData = () => {
      const script = document.getElementById("course-data");
      if (script) {
        try {
          const data = JSON.parse(script.textContent || "");
          setCourseData(data);
        } catch (e) {
          console.error("Failed to parse course data:", e);
        }
      }
    };

    // Check immediately and then set up observer
    checkForCourseData();

    const observer = new MutationObserver(checkForCourseData);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [isActualCoursePage]);

  // For course pages, add course-specific navigation and header
  if (isActualCoursePage) {
    return (
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full bg-background">
          {/* Full-height sidebar - only show when courseData is available */}
          {courseData && (
            <CourseProgressProvider courseId={courseData.course.id}>
              <CourseSideBar
                course={courseData.course}
                currentChapterId={courseData.currentChapterId}
              />
            </CourseProgressProvider>
          )}

          {/* Main content area - uses SidebarInset for proper spacing */}
          <SidebarInset className="flex flex-col flex-1">
            {/* Simplified top navbar - back to courses */}
            <header className="sticky top-0 z-40 bg-background pt-4 pl-4">
              <div className="flex h-16 items-center px-6 mr-4 mb-4 rounded-b-2xl border border-border">
                <Link
                  href="/dashboard/generate-course"
                  className="flex items-center gap-3 text-foreground hover:text-muted-foreground transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <h1 className="text-xl font-bold">Course</h1>
                </Link>
              </div>
            </header>

            {/* Main content area */}
            <main className="flex-1 overflow-auto bg-background px-4">
              <div className="max-w-6xl mx-auto py-8">{children}</div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  // For non-course pages, render normally
  return children;
}
