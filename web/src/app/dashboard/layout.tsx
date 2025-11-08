"use client";

import React, { useEffect, useState, Suspense } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/AppSidebar";
import CourseSideBar from "@/components/course/CourseSideBar";
import { usePathname, useRouter } from "next/navigation";
import {
  DashboardRefreshProvider,
  useDashboardRefresh,
} from "@/contexts/dashboard-refresh-context";
import { PaymentSuccessHandler } from "@/components/subscription/payment-success-handler";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Course, Unit, Chapter } from "@prisma/client";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });
interface CourseData {
  course: Course & {
    units: (Unit & {
      chapters: Chapter[];
    })[];
  };
  currentChapterId: string;
}

function DashboardContent({ children }: { children: React.ReactNode }) {

  return (
    <div className="flex-1 min-h-screen  overflow-x-hidden p-5">
      <div className="w-full">{children}</div>
    </div>
  );
}

function DashboardMain({ children }: { children: React.ReactNode }) {
  const { searchQuery, setSearchQuery } = useDashboardRefresh();
  const pathname = usePathname();
  const isDashboardHome = pathname === "/dashboard";

  return (
    <SidebarInset className="flex h-screen flex-col flex-1 overflow-x-hidden">
      <header
        className={`bg-[#F9FAFB] dark:bg-[#171717]  ${
          isDashboardHome ? "" : ""
        }`}
      >
        <div
          className={`flex p-5 border-b border-neutral-200 dark:border-[#212121] items-center justify-between max-w-full ${
            isDashboardHome ? "" : "mb-0"
          }`}
        >
          <div className="flex-shrink min-w-0">
            {isDashboardHome && (
              <p className="text-[16px] leading-4 tracking-[-3%] font-medium dark:text-white text-black">
                Welcome back!
              </p>
            )}
          </div>
          {isDashboardHome && (
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-[32px] max-w-[290px] border-none bg-neutral-100 dark:bg-[#1e1e1e] rounded-[6px] text-sm text-[#606060] placeholder:text-[#606060]"
            />
          )}
        </div>
      </header>

      <main className="flex-1 bg-white dark:bg-[#171717] overflow-x-hidden">
        <DashboardContent>{children}</DashboardContent>
      </main>
    </SidebarInset>
  );
}

function CourseSidebarWrapper() {
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const pathname = usePathname();
  const isCoursePage =
    pathname.includes("/course/") && !pathname.includes("/create/");

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
  const isCoursePage =
    pathname.includes("/course/") && !pathname.includes("/create/");
  const isNotesPage = pathname.includes("/notes/");
  React.useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const params = new URLSearchParams(window.location.search);
      const hasStatus = params.has("status");
      const hasSubscriptionId = params.has("subscription_id");

      if (hasStatus || hasSubscriptionId) {
        router.replace(window.location.pathname);
      }
    } catch (e) {}
  }, [router]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardRefreshProvider>
        <Suspense fallback={null}>
          <PaymentSuccessHandler />
        </Suspense>

        {isCoursePage || isNotesPage ? (
          children
        ) : (
          <div className={`flex min-h-screen w-full ${inter.className}`}>
            <AppSidebar />
            <DashboardMain>{children}</DashboardMain>
          </div>
        )}
      </DashboardRefreshProvider>
    </div>
  );
}
