"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  BookOpen,
  Eye,
  // TODO: COURSE_GENERATION_FEATURE - Uncomment to re-enable course generation feature
  // Plus,
  Clock,
  Users,
  CheckCircle,
  Trash2,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Course, Unit, Chapter } from "@prisma/client";
import { useCourseProgress } from "@/hooks/use-course-progress";
import { useDeleteCourse } from "@/hooks/use-delete-course";

type CourseWithDetails = Course & {
  units: (Unit & {
    chapters: Chapter[];
  })[];
};

interface MyCoursesProps {
  courses: CourseWithDetails[];
}

function CourseCard({ course }: { course: CourseWithDetails }) {
  const { progress } = useCourseProgress(course.id);
  const { deleteCourse, isDeleting } = useDeleteCourse();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDeleteCourse = async () => {
    await deleteCourse(course.id);
  };

  const getTotalChapters = (course: CourseWithDetails) => {
    return course.units.reduce(
      (total, unit) => total + unit.chapters.length,
      0
    );
  };

  const getEstimatedDuration = (totalChapters: number) => {
    // Estimate 15-20 minutes per chapter
    const minutes = totalChapters * 15;
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getDifficultyLevel = (units: number, chapters: number) => {
    if (units <= 3 && chapters <= 10) return "Beginner";
    if (units <= 5 && chapters <= 20) return "Intermediate";
    return "Advanced";
  };

  const difficultyLevel = getDifficultyLevel(course.units.length, getTotalChapters(course));
  const estimatedDuration = getEstimatedDuration(getTotalChapters(course));

  return (
    <div className="h-[380px] w-full group hover:transition-all hover:duration-300 rounded-2xl overflow-hidden flex flex-col bg-white dark:bg-[#1A1A1A] border border-neutral-100 dark:border-neutral-800">
      {/* Header with Title and Options */}
      <div className="flex items-start justify-between pt-6 px-6 pb-4 shrink-0">
        <div className="flex-1 min-w-0 pr-3">
          <h3 className="font-bold text-xl text-foreground leading-tight line-clamp-2 mb-2 min-h-[3.5rem]">
            {course.name}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="secondary"
            className="bg-background/80 text-foreground backdrop-blur-sm text-sm font-medium px-3 py-1"
          >
            {difficultyLevel}
          </Badge>

          {/* Options Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full shrink-0"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Course
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Course</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete &ldquo;{course.name}&rdquo;? This action cannot be undone.
                      All course content, progress, and related data will be permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteCourse}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Deleting..." : "Delete Course"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Course Details */}
      <div className="px-6 pb-3 shrink-0">
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 min-w-0">
            <Users className="h-4 w-4 shrink-0 text-neutral-700 dark:text-neutral-200" />
            <span className="font-medium truncate">{course.units.length} units</span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="h-4 w-4 shrink-0 text-neutral-700 dark:text-neutral-200" />
            <span className="font-medium truncate">{getTotalChapters(course)} chapters</span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="h-4 w-4 text-neutral-700 dark:text-neutral-200 shrink-0" />
            <span className="font-medium truncate">{estimatedDuration}</span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <Eye className="h-4 w-4 text-neutral-700 dark:text-neutral-200 shrink-0" />
            <span className="font-medium truncate">{formatDate(course.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="px-6 pb-2 shrink-0">
        {progress.totalChapters > 0 ? (
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-neutral-700 dark:text-neutral-200 font-medium">Progress</span>
              <span className="text-neutral-700 dark:text-neutral-200 font-semibold">
                {Math.round(progress.completionPercentage)}%
              </span>
            </div>
            <div className="w-full bg-muted/40 rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progress.completionPercentage}%` }}
              />
            </div>
            {progress.isCompleted && progress.completedAt && (
              <div className="flex items-center gap-1.5 text-sm text-accent mt-2 font-medium">
                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Completed {formatDate(new Date(progress.completedAt))}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="py-2">
            <span className="text-muted-foreground text-sm">Ready to start</span>
          </div>
        )}
      </div>

      {/* Spacer to push button to bottom */}
      <div className="flex-1"></div>

      {/* Continue Button */}
      <div className="px-6 pb-6 pt-2 shrink-0">
        <Link href={`/dashboard/course/${course.id}/0/0`} className="block">
          <Button
            className={`w-full font-medium py-3 text-base rounded-sm cursor-pointer transition-colors ${progress.completedChapters > 0
              ? "bg-primary hover:bg-primary/90 text-primary-foreground"
              : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            size="lg"
          >
            {progress.isCompleted ? "Review Course" : "Continue Learning"}
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function MyCourses({ courses }: MyCoursesProps) {
  return (
    <div className="w-full space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-1">
          My Courses
        </h2>
        <p className="text-muted-foreground text-base font-medium leading-6">
          View and continue your courses
        </p>
        {/* TODO: COURSE_GENERATION_FEATURE - Uncomment to re-enable course generation feature */}
        {/* <p className="text-muted-foreground text-base font-medium leading-6">
          View and continue your AI-generated courses
        </p> */}
      </div>

      {courses.length === 0 ? (
        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-neutral-100 dark:border-neutral-800 p-12 text-center">
          <div className="size-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="size-8 text-neutral-700 dark:text-neutral-200" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">
            No courses yet
          </h3>
          <p className="text-muted-foreground mb-8">
            Courses will appear here when available.
          </p>
          {/* TODO: COURSE_GENERATION_FEATURE - Uncomment to re-enable course generation feature */}
          {/* <p className="text-muted-foreground mb-8">
            Start your learning journey by creating your first AI-powered course
          </p>
          <Link href="/dashboard/create/wizard">
            <Button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">
              <Plus className="size-4" />
              Create Your First Course
            </Button>
          </Link> */}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
