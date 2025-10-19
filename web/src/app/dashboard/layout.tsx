"use client";

import React, { useEffect, useState, Suspense } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/AppSidebar";
import CourseSideBar from "@/components/course/CourseSideBar";
import { usePathname, useRouter } from "next/navigation";
import { DashboardRefreshProvider } from "@/contexts/dashboard-refresh-context";
import { PaymentSuccessHandler } from "@/components/subscription/payment-success-handler";
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
      <main className={`flex-1 ${!isCoursePage ? 'px-6 py-4' : 'px-6 py-4'}`}>
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
  const router = useRouter();
  const isCoursePage = pathname.includes("/course/") && !pathname.includes("/create/");
  const isNotesPage = pathname.includes("/notes/");

  // Clean up ephemeral query params (e.g. status, subscription_id) that
  // payment providers or external redirects may append. We intentionally
  // leave `payment=success` alone because `PaymentSuccessHandler` needs it.
  React.useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      const params = new URLSearchParams(window.location.search);
      const hasStatus = params.has('status');
      const hasSubscriptionId = params.has('subscription_id');

      if (hasStatus || hasSubscriptionId) {
        // Replace URL to same pathname without query string
        router.replace(window.location.pathname);
      }
    } catch (e) {
      // ignore
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardRefreshProvider>
        {/* Payment Success Handler - shows loading while webhook processes */}
        <Suspense fallback={null}>
          <PaymentSuccessHandler />
        </Suspense>

        {/* For course pages or notes pages, let them handle their own layout */}
        {isCoursePage || isNotesPage ? (
          children
        ) : (
          <SidebarProvider defaultOpen={true}>
            <div className="flex min-h-screen w-full bg-background">
              {/* Full-height Sidebar on the left */}
              <AppSidebar />

              {/* Main content area - uses SidebarInset for proper spacing */}
              <SidebarInset className="flex flex-col flex-1">
                {/* Simplified top navbar - just showing title */}
                <header className="sticky top-0 z-40 bg-white dark:bg-background pt-4 pl-4">
                  <div className="flex h-16 items-center px-6 mr-4 mb-4 border-b border-border/40">
                    <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
                  </div>
                </header>

                {/* Main content */}
                <main className="flex-1 bg-background px-4">
                  <DashboardContent>
                    {children}
                  </DashboardContent>
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        )}
      </DashboardRefreshProvider>
    </div>
  );
}
