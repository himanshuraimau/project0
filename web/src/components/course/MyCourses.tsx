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
  Plus,
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
    <Card className="h-[400px] w-full group hover:shadow-lg transition-all duration-300 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm hover:border-accent/30 overflow-hidden flex flex-col">
      {/* Header with Title and Options */}
      <div className="flex items-start justify-between p-8 pb-6 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-xl text-foreground leading-tight line-clamp-2 mb-3">
            {course.name}
          </h3>
          <Badge 
            variant="secondary" 
            className="bg-background/80 text-foreground backdrop-blur-sm shadow-sm text-sm font-medium px-3 py-1"
          >
            {difficultyLevel}
          </Badge>
        </div>
        
        {/* Options Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
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

      {/* Course Details */}
      <div className="px-8 pb-6 flex-shrink-0">
        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-accent flex-shrink-0" />
            <span className="font-medium">{course.units.length} units</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent flex-shrink-0" />
            <span className="font-medium">{getTotalChapters(course)} chapters</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent flex-shrink-0" />
            <span className="font-medium">{estimatedDuration}</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-accent flex-shrink-0" />
            <span className="font-medium">{formatDate(course.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="px-8 pb-6 flex-shrink-0">
        {progress.totalChapters > 0 ? (
          <div>
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-foreground font-medium">Progress</span>
              <span className="text-foreground font-semibold">
                {Math.round(progress.completionPercentage)}%
              </span>
            </div>
            <div className="w-full bg-muted/50 rounded-full h-3">
              <div 
                className="bg-accent h-3 rounded-full transition-all duration-500" 
                style={{ width: `${progress.completionPercentage}%` }}
              />
            </div>
            {progress.isCompleted && progress.completedAt && (
              <div className="flex items-center gap-2 text-sm text-accent mt-3 font-medium">
                <CheckCircle className="h-4 w-4" />
                <span>Completed {formatDate(new Date(progress.completedAt))}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="h-12 flex items-center">
            <span className="text-muted-foreground text-sm">No progress data available</span>
          </div>
        )}
      </div>

      {/* Spacer to push button to bottom */}
      <div className="flex-1"></div>

      {/* Continue Button */}
      <div className="p-8 pt-0 flex-shrink-0">
        <Link href={`/dashboard/course/${course.id}/0/0`} className="block">
          <Button 
            className="w-full bg-accent text-accent-foreground font-medium py-4 text-base rounded-lg transition-colors duration-200 hover:bg-accent/90"
            size="lg"
          >
            {progress.isCompleted ? "Review Course" : "Continue Learning"}
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export function MyCourses({ courses }: MyCoursesProps) {
  return (
    <div className="w-full space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-3">
          My Courses
        </h2>
        <p className="text-muted-foreground text-base font-medium leading-6">
          View and continue your AI-generated courses
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/60 p-12 text-center">
          <div className="size-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="size-8 text-accent" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">
            No courses yet
          </h3>
          <p className="text-muted-foreground mb-8">
            Start your learning journey by creating your first AI-powered course
          </p>
          <Link href="/dashboard/create/wizard">
            <Button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors">
              <Plus className="size-4" />
              Create Your First Course
            </Button>
          </Link>
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
