"use client";

import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/AppSidebar";
import { Navbar } from "@/components/shared/navbar";
import { usePathname } from "next/navigation";
import { DashboardRefreshProvider } from "@/contexts/dashboard-refresh-context";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCoursePage = pathname.includes("/course/") && !pathname.includes("/create/");

  return (
    <div className="flex-1 min-h-screen bg-background">
      {/* Content area with conditional padding */}
      <main className={`flex-1 ${!isCoursePage ? 'px-6 py-8' : ''}`}>
        <div className="max-w-none w-full">
          {children}
        </div>
      </main>
    </div>
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
        {/* Navbar at the top */}
        {!isCoursePage && (
          <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
            <Navbar
              title={
                <span>
                  <span className="font-bold">SonicLearn</span>{" "}
                  <span className="font-normal">AI notes</span>
                </span>
              }
            />

          </div>
        )}

        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-[calc(100vh-64px)]">
            {/* Sidebar on the left */}
            <AppSidebar />

            {/* Main content area */}
            <DashboardContent>
              {children}
            </DashboardContent>
          </div>
        </SidebarProvider>
      </DashboardRefreshProvider>
    </div>
  );
}
