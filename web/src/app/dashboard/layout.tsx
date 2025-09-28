import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/AppSidebar";
import { Toaster } from "sonner";
import { Navbar } from "@/components/shared/navbar";

function DashboardContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 min-h-screen bg-background overflow-y-auto">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <Navbar title="Dashboard" />
      </div>
      <div className="px-6 py-6 sm:px-8 lg:px-12">
        {children}
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
    <div className="min-h-screen bg-background">
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen">
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
