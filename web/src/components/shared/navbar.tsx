"use client";

import React from "react";
import { UserControl } from "@/components/user-control";
import { ThemeToggleButton } from "@/components/dashboard/theme-toggle-button";
import { Plus_Jakarta_Sans } from "next/font/google";
import { usePathname } from "next/navigation";

const jakarta = Plus_Jakarta_Sans({
  weight: "600",
});

interface NavbarProps {
  title: string;
  className?: string;
}

export function Navbar({ title, className = "" }: NavbarProps) {
  const pathname = usePathname();
  const isCoursePage = pathname.includes("/course/");
  const isCourseCreation = pathname.includes("/create/wizard");

  const getPageTitle = () => {
    if (isCourseCreation) return "Create Course";
    if (pathname.includes("/generate-course")) return "Course";
    if (isCoursePage) return "Course";
    return title;
  };

  return (
    <div
      className={`${jakarta.className} py-6 flex bg-background items-center justify-between px-6 transition-all duration-300 ${className}`}
    >
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-foreground">
          {getPageTitle()}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggleButton />
        <UserControl showName />
      </div>
    </div>
  );
}
