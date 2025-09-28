"use client";

import React, { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Navbar } from "@/components/shared/navbar";
import CourseSideBar from "@/components/course/CourseSideBar";
import { Course, Unit, Chapter } from "@prisma/client";
import { usePathname } from "next/navigation";

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
  const isActualCoursePage = pathname.includes("/course/") && !pathname.includes("/create/");

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

  // If not an actual course page, just render children with simple layout
  if (!isActualCoursePage) {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen">
          {/* Course-specific sidebar */}
          {courseData ? (
            <CourseSideBar 
              course={courseData.course} 
              currentChapterId={courseData.currentChapterId} 
            />
          ) : (
            // Placeholder while loading
            <div className="w-64 bg-muted/20" />
          )}
          
          {/* Main content area */}
          <div className="flex-1 min-h-screen bg-background">
            <div className="sticky top-0 z-40 bg-background/95 backdrop-blur">
              <Navbar title="Course" />
            </div>
            
            {/* Content area */}
            <main className="flex-1 px-6 py-8">
              <div className="max-w-none w-full">
                {children}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
      <Toaster />
    </div>
  );
}