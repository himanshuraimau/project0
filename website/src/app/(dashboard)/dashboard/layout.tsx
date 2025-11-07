"use client";

import React, { useEffect, useState, Suspense } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/AppSidebar";
import CourseSideBar from "@/components/features/courses/CourseSideBar";
import { usePathname, useRouter } from "next/navigation";
import { DashboardRefreshProvider, useDashboardRefresh } from "@/lib/contexts/dashboard-refresh-context";
import { PaymentSuccessHandler } from "@/lib/payments/payment-success-handler";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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
    <div className="flex-1 min-h-screen bg-background overflow-x-hidden px-5">
      {/* Content area with conditional padding */}
      <main className={`flex-1 ${!isCoursePage ? 'px-6 py-4' : 'px-6 py-4'}`}>
        <div className="max-w-full w-full">
          {children}
        </div>
      </main>
    </div>
  );
}

function DashboardHeader() {
  const { searchQuery, setSearchQuery } = useDashboardRefresh();

  return (
    <header className="bg-white dark:bg-background pt-4 pl-4">
      <div className="flex h-20 items-center justify-between px-6 mr-4 mb-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back to your dashboard</p>
        </div>
        {/* Search Control */}
        <div className="relative min-w-md">
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-4 pr-12 h-12 border-1 border-black/10 dark:border-muted/30 rounded-2xl text-foreground placeholder:text-muted-foreground"
          />
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
        </div>
      </div>
    </header>
  );
}

function DashboardMain({ children }: { children: React.ReactNode }) {
  const { searchQuery, setSearchQuery } = useDashboardRefresh();
  const pathname = usePathname();
  const isDashboardHome = pathname === "/dashboard";

  return (
    <SidebarInset className="flex flex-col flex-1 overflow-x-hidden">
      {/* Simplified top navbar - just showing title */}
      <header className={`bg-white dark:bg-background pl-4 ${isDashboardHome ? 'pt-10' : 'pt-2 border-b border-gray-300 dark:border-gray-800'}`}>
        <div className={`flex h-20 items-center justify-between px-6 mr-4 max-w-full ${isDashboardHome ? 'mb-4' : 'mb-0'}`}>
          <div className="flex-shrink min-w-0">
            <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
            {isDashboardHome && (
              <p className="text-lg text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
            )}
          </div>
          {/* Search Control - Only show on /dashboard home */}
          {isDashboardHome && (
            <div className="relative min-w-md flex-shrink-0 ml-4">
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-4 pr-12 h-12 border-1 border-black/10 dark:border-muted/30 rounded-2xl text-foreground placeholder:text-muted-foreground"
              />
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 bg-background overflow-x-hidden">
        <DashboardContent>
          {children}
        </DashboardContent>
      </main>
    </SidebarInset>
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
            <div className="flex min-h-screen w-full bg-background overflow-x-hidden">
              {/* Full-height Sidebar on the left */}
              <AppSidebar />

              {/* Main content area - uses SidebarInset for proper spacing */}
              <DashboardMain>
                {children}
              </DashboardMain>
            </div>
          </SidebarProvider>
        )}
      </DashboardRefreshProvider>
    </div>
  );
}