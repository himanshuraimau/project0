"use client";

import React, { useEffect, useState } from "react";
import CourseSideBar from "@/components/course/CourseSideBar";
import { SidebarProvider } from "@/components/ui/sidebar";
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
        <div className="flex min-h-screen bg-background">
          {/* Full-height sidebar - only show when courseData is available */}
          {courseData && (
            <CourseProgressProvider courseId={courseData.course.id}>
              <CourseSideBar
                course={courseData.course}
                currentChapterId={courseData.currentChapterId}
              />
            </CourseProgressProvider>
          )}

          {/* Main content area - fills remaining space */}
          <div className="flex-1 flex flex-col">
            {/* Simplified top navbar - just showing course context */}
            <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
              <div className={`${jakarta.className} flex h-16 items-center px-6`}>
                <Link
                  href="/dashboard/generate-course"
                  className="flex items-center gap-2 text-foreground hover:text-accent transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="text-xl font-semibold">
                    {courseData?.course.name || "Course"}
                  </span>
                </Link>
              </div>
            </div>

            {/* Main content area */}
            <main className="flex-1 overflow-auto">
              <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  // For non-course pages, render normally
  return children;
}
