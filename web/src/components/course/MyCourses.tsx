"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Eye,
  Plus,
  Clock,
  Users,
  CheckCircle,
  Circle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Course, Unit, Chapter } from "@prisma/client";
import { useCourseProgress } from "@/hooks/use-course-progress";

type CourseWithDetails = Course & {
  units: (Unit & {
    chapters: Chapter[];
  })[];
};

interface MyCoursesProps {
  courses: CourseWithDetails[];
}

function CourseCard({ course }: { course: CourseWithDetails }) {
  const { progress, updating, toggleCompletion } = useCourseProgress(course.id);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
    <Card className="h-[420px] w-full group hover:shadow-lg transition-all duration-300 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm hover:border-accent/30 flex flex-col">
      {/* Image Section - Fixed Height */}
      <div className="relative h-36 w-full overflow-hidden rounded-t-2xl flex-shrink-0">
        {course.image ? (
          <Image
            src={course.image}
            alt={course.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-muted/50 flex items-center justify-center">
            <BookOpen className="h-16 w-16 text-accent/60" />
          </div>
        )}

        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        {/* Completion Badge */}
        <div className="absolute top-3 right-3">
          {progress.isCompleted && (
            <Badge className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>

        {/* Difficulty Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-background/80 text-foreground backdrop-blur-sm shadow-sm">
            {difficultyLevel}
          </Badge>
        </div>
      </div>

      {/* Content Section - Flexible Height */}
      <div className="flex-1 p-3 flex flex-col">
        {/* Title - Fixed Height */}
        <div className="h-14 mb-3">
          <h3 className="text-foreground font-semibold text-lg leading-tight line-clamp-3">
            {course.name}
          </h3>
        </div>

        {/* Course Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4 text-accent flex-shrink-0" />
            <span className="font-medium truncate">{course.units.length} units</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4 text-accent flex-shrink-0" />
            <span className="font-medium truncate">{getTotalChapters(course)} chapters</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 text-accent flex-shrink-0" />
            <span className="font-medium truncate">{estimatedDuration}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Eye className="h-4 w-4 text-accent flex-shrink-0" />
            <span className="font-medium truncate">{formatDate(course.createdAt)}</span>
          </div>
        </div>

        {/* Progress Section */}
        {progress.totalChapters > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-medium">Progress</span>
              <span className="font-semibold">
                {progress.completedChapters}/{progress.totalChapters}
              </span>
            </div>
            <Progress
              value={progress.completionPercentage}
              className="h-1.5 bg-muted/50"
            />
          </div>
        )}

        {/* Completion Status */}
        {progress.isCompleted && progress.completedAt && (
          <div className="flex items-center gap-1.5 text-xs text-accent mb-3 font-medium">
            <CheckCircle className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">Completed {formatDate(new Date(progress.completedAt))}</span>
          </div>
        )}

        {/* Spacer to push buttons to bottom */}
        <div className="flex-1" />

        {/* Action Buttons - Fixed at Bottom */}
        <div className="flex gap-2 mt-3">
          <Link href={`/dashboard/course/${course.id}/0/0`} className="flex-1 min-w-0">
            <Button className="w-full bg-accent text-accent-foreground rounded-lg px-2 py-1.5 flex items-center gap-1 hover:bg-accent/90 transition-colors font-medium text-xs">
              <Eye className="size-3 flex-shrink-0" />
              <span className="truncate">
                {progress.isCompleted ? "Review" : "Continue"}
              </span>
            </Button>
          </Link>

          <Button
            variant={progress.isCompleted ? "outline" : "secondary"}
            onClick={toggleCompletion}
            disabled={updating}
            className="bg-secondary text-secondary-foreground rounded-lg px-2 py-1.5 flex items-center gap-1 hover:bg-secondary/80 border-border/60 font-medium text-xs w-16 flex-shrink-0"
          >
            {updating ? (
              <div className="size-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            ) : progress.isCompleted ? (
              <Circle className="size-3" />
            ) : (
              <CheckCircle className="size-3" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function MyCourses({ courses }: MyCoursesProps) {
  return (
    <div className="w-full space-y-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
