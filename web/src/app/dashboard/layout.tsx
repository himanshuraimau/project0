"use client";

import React, { useEffect, useState, Suspense } from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/AppSidebar";
import CourseSideBar from "@/components/course/CourseSideBar";
import { usePathname, useRouter } from "next/navigation";
import {
  DashboardRefreshProvider,
  useDashboardRefresh,
} from "@/contexts/dashboard-refresh-context";
import { UpgradeModalProvider } from "@/contexts/upgrade-modal-context";
import { PaymentSuccessHandler } from "@/components/subscription/payment-success-handler";
import { FreeNoteCounter } from "@/components/dashboard/free-note-counter";
import { ProcessingTray } from "@/components/sources/processing-tray";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
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
  return (
    <div className="flex-1 min-h-0 overflow-x-hidden py-6 px-4 sm:py-6 sm:px-6 lg:px-6">
      <div className="w-full max-w-[1600px] mx-auto">{children}</div>
    </div>
  );
}

function DashboardMain({ children }: { children: React.ReactNode }) {
  const {
    searchQuery,
    setSearchQuery,
    folderSearchQuery,
    setFolderSearchQuery,
    clonedSearchQuery,
    setClonedSearchQuery,
  } = useDashboardRefresh();
  const pathname = usePathname();
  const isDashboardHome = pathname === "/dashboard";
  const isFoldersPage = pathname === "/dashboard/folders";
  const isClonedPage = pathname === "/dashboard/cloned";
  const isSupportPage = pathname === "/dashboard/support";
  const isAdminPage = pathname === "/dashboard/admin";

  const isGenerationPage =
    pathname?.includes("/create") || pathname?.includes("/generate-course");
  const showHeader =
    !isGenerationPage &&
    (isDashboardHome ||
      isFoldersPage ||
      isClonedPage ||
      isSupportPage ||
      isAdminPage);

  return (
    <SidebarInset className="flex h-screen flex-col flex-1 overflow-x-hidden bg-background">
      {showHeader && (
        <header className="shrink-0 bg-background border-b border-border/70">
          <div className="flex bg-sidebar flex-col sm:flex-row gap-3 sm:gap-4 py-4 px-4 sm:px-6 lg:px-8 items-start sm:items-center justify-between max-w-full">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto min-w-0">
              {isDashboardHome && (
                <p className="text-lg font-medium text-foreground tracking-tight shrink-0">
                  Welcome back!
                </p>
              )}
              {isFoldersPage && (
                <p className="text-lg font-medium text-foreground tracking-tight shrink-0">
                  Folders
                </p>
              )}
              {isClonedPage && (
                <p className="text-lg font-medium text-foreground tracking-tight shrink-0">
                  Shared with me
                </p>
              )}
              {isSupportPage && (
                <p className="text-lg font-medium text-foreground tracking-tight shrink-0">
                  Support
                </p>
              )}
              {isAdminPage && (
                <p className="text-lg font-medium text-foreground tracking-tight shrink-0">
                  Admin
                </p>
              )}
              <FreeNoteCounter />
            </div>
            {isDashboardHome && (
              <div className="relative w-full sm:w-auto sm:min-w-[280px] sm:max-w-[320px]">
                <HugeiconsIcon
                  icon={Search01Icon}
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
                />
                <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-[44px] w-full pl-9 pr-4 bg-muted/50 border-none rounded-md placeholder:text-muted-foreground text-foreground focus-visible:ring-ring focus-visible:ring-offset-background"
                />
              </div>
            )}
            {isFoldersPage && (
              <div className="relative w-full sm:w-auto sm:min-w-[280px] sm:max-w-[320px]">
                <HugeiconsIcon
                  icon={Search01Icon}
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
                />
                <Input
                  placeholder="Search folders..."
                  value={folderSearchQuery}
                  onChange={(e) => setFolderSearchQuery(e.target.value)}
                  className="h-[41px] w-full pl-9 pr-4 bg-muted/50 border-none rounded-md placeholder:text-muted-foreground text-foreground focus-visible:ring-ring focus-visible:ring-offset-background"
                />
              </div>
            )}
            {isClonedPage && (
              <div className="relative w-full sm:w-auto sm:min-w-[280px] sm:max-w-[320px]">
                <HugeiconsIcon
                  icon={Search01Icon}
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
                />
                <Input
                  placeholder="Search shared notes..."
                  value={clonedSearchQuery}
                  onChange={(e) => setClonedSearchQuery(e.target.value)}
                  className="h-[41px] w-full pl-9 pr-4 bg-muted/50 border-none rounded-md placeholder:text-muted-foreground text-foreground focus-visible:ring-ring focus-visible:ring-offset-background"
                />
              </div>
            )}
          </div>
        </header>
      )}

      <main className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto bg-background">
        <DashboardContent>{children}</DashboardContent>
      </main>
    </SidebarInset>
  );
}

function CourseSidebarWrapper() {
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const pathname = usePathname();
  const isCoursePage =
    pathname?.includes("/course/") && !pathname?.includes("/create/");

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
    pathname?.includes("/course/") && !pathname?.includes("/create/");
  const isNotesPage = pathname?.includes("/notes/");
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
        <UpgradeModalProvider>
          <Suspense fallback={null}>
            <PaymentSuccessHandler />
          </Suspense>

          {isCoursePage || isNotesPage ? (
            children
          ) : (
            <div className="flex min-h-screen w-full">
              <div className="hidden lg:block">
                <AppSidebar />
              </div>
              <DashboardMain>{children}</DashboardMain>
            </div>
          )}
          <ProcessingTray />
        </UpgradeModalProvider>
      </DashboardRefreshProvider>
    </div>
  );
}
