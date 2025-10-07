"use client";

import React, { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/AppSidebar";
import CourseSideBar from "@/components/course/CourseSideBar";
import { Navbar } from "@/components/shared/navbar";
import { usePathname } from "next/navigation";
import { DashboardRefreshProvider } from "@/contexts/dashboard-refresh-context";
import { Course, Unit, Chapter } from "@prisma/client";

interface CourseData {
  course: Course & {
    units: (Unit & {
      chapters: Chapter[];
    })[];
  };
  currentChapterId: string;
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCoursePage = pathname.includes("/course/") && !pathname.includes("/create/");

  return (
    <div className="flex-1 min-h-screen bg-background">
      {/* Content area with conditional padding */}
      <main className={`flex-1 ${!isCoursePage ? 'px-6 py-8' : 'px-6 py-8'}`}>
        <div className="max-w-none w-full">
          {children}
        </div>
      </main>
    </div>
  );
}

function CourseSidebarWrapper() {
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const pathname = usePathname();
  const isCoursePage = pathname.includes("/course/") && !pathname.includes("/create/");

  useEffect(() => {
    if (!isCoursePage) return;

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
  }, [isCoursePage, pathname]);

  if (!courseData) {
    return <div className="w-64 h-full bg-muted/20" />;
  }

  return (
    <CourseSideBar
      course={courseData.course}
      currentChapterId={courseData.currentChapterId}
    />
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isCoursePage = pathname.includes("/course/") && !pathname.includes("/create/");

  return (
    <div className="min-h-screen bg-background">
      <DashboardRefreshProvider>
        {/* Navbar at the top - only for non-course pages */}
        {!isCoursePage && (
          <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
            <Navbar
              title={
                <span className="text-2xl">
                  <span className="font-bold">SonicLearn</span>{" "}
                  <span className="font-normal text-gray-400">AI notes</span>
                </span>
              }
            />

          </div>
        )}

        {/* For course pages, let the course layout handle everything */}
        {isCoursePage ? (
          children
        ) : (
          <SidebarProvider defaultOpen={true}>
            <div className="flex min-h-[calc(100vh-64px)]">
              {/* Sidebar on the left - only for non-course pages */}
              <AppSidebar />

              {/* Main content area */}
              <DashboardContent>
                {children}
              </DashboardContent>
            </div>
          </SidebarProvider>
        )}
      </DashboardRefreshProvider>
    </div>
  );
}
