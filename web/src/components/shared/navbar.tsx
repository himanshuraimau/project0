"use client";

import React from "react";
import { UserControl } from "@/components/user-control";
import { ThemeToggleButton } from "@/components/dashboard/theme-toggle-button";
import { Plus_Jakarta_Sans } from "next/font/google";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

const jakarta = Plus_Jakarta_Sans({
  weight: "600",
  subsets: ["latin"],
});

interface NavbarProps {
  title: React.ReactNode;
  className?: string;
  showBackToDashboard?: boolean;
}

export function Navbar({ title, className = "", showBackToDashboard = false }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isCoursePage = pathname.includes("/course/");
  const isCourseCreation = pathname.includes("/create/wizard");
  const isNotesPage = pathname.includes("/notes/");

  const getPageTitle = () => {
    if (isCourseCreation) return "Create Course";
    if (pathname.includes("/course") && !pathname.includes("/course/")) return "Course";
    if (isCoursePage) return "Course";
    return title;
  };

  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div
      className={`${jakarta.className} py-4 flex bg-background items-center justify-between px-6 transition-all duration-300 ${className}`}
    >
      <div className="flex items-center h-16 gap-4">
        {(showBackToDashboard || isNotesPage) ? (
          <Button
            onClick={handleBackToDashboard}
            variant="ghost"
            className="flex items-center gap-2 text-foreground hover:bg-accent hover:text-accent-foreground px-3 py-2 rounded-lg transition-colors duration-200"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Button>
        ) : (
          <h1 className="text-xl font-semibold text-foreground">
            {getPageTitle()}
          </h1>
        )}
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggleButton />
        <UserControl showName />
      </div>
    </div>
  );
}
