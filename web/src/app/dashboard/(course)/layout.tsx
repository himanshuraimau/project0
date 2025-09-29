"use client";

import React, { useEffect, useState } from "react";
import { UserControl } from "@/components/user-control";
import { ThemeToggleButton } from "@/components/dashboard/theme-toggle-button";
import CourseSideBar from "@/components/course/CourseSideBar";
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
      <>
        {/* Single unified header for course pages */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
          <div
            className={`${jakarta.className} px-6 py-4 flex items-center justify-between`}
          >
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/generate-course"
                className="flex items-center gap-2 text-xl font-semibold text-foreground hover:text-accent transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Courses
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggleButton />
              <UserControl showName />
            </div>
          </div>
        </div>

        {/* Content area with unified spacing */}
        <div className="flex">
          {courseData ? (
            <CourseSideBar
              course={courseData.course}
              currentChapterId={courseData.currentChapterId}
            />
          ) : (
            <div className="w-64 h-full bg-muted/20" />
          )}
        </div>

        {/* Main content area */}
        <main className="flex-1 min-h-screen">
          <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
        </main>
      </>
    );
  }

  // For non-course pages, render normally
  return children;
}
