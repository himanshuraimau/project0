"use client";

import React from "react";
import { AppSidebar } from "@/components/shared/AppSidebar";
import { Course, Unit, Chapter } from "@prisma/client";

interface CoursePageWrapperProps {
  course: Course & {
    units: (Unit & {
      chapters: Chapter[];
    })[];
  };
  currentChapterId: string;
  children: React.ReactNode;
}

export function CoursePageWrapper({ 
  course, 
  currentChapterId, 
  children 
}: CoursePageWrapperProps) {
  return (
    <>
      {/* Override the sidebar with course data */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 lg:w-80">
        <AppSidebar 
          courseData={course} 
          currentChapterId={currentChapterId}
        />
      </div>
      
      {/* Main content with proper margin for sidebar */}
      <div className="pl-64 lg:pl-80">
        {children}
      </div>
    </>
  );
}