import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/sidebar";
import { Toaster } from "sonner";
import { Navbar } from "@/components/shared/navbar";

function DashboardContent({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`
        flex-1 h-full bg-white dark:bg-stone-950 overflow-y-scroll
        transition-all duration-300 ease-in-out
      `}
    >
      <div className="">
        <Navbar title="Dashboard" />
        <div className="transition-all duration-300">{children}</div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-stone-50 dark:bg-stone-950">
      <SidebarProvider defaultOpen={true}>
        <div className="flex flex-1 h-full">
          <AppSidebar />
          <DashboardContent>
            {children}
            <Toaster />
          </DashboardContent>
        </div>
      </SidebarProvider>
    </div>
  );
}
