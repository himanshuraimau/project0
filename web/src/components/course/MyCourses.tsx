"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Eye, Plus, Clock, Users, CheckCircle, Circle } from "lucide-react";
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

// Individual course card component to manage its own progress state
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
    return course.units.reduce((total, unit) => total + unit.chapters.length, 0);
  };

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 border hover:border-primary/50"
    >
      <CardHeader className="p-0">
        <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
          {course.image ? (
            <Image
              src={course.image}
              alt={course.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <BookOpen className="h-16 w-16 text-primary/60" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Completion Badge */}
          <div className="absolute top-4 right-4">
            {progress.isCompleted && (
              <Badge className="bg-green-500 hover:bg-green-600 text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
          
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white font-bold text-lg leading-tight line-clamp-2">
              {course.name}
            </h3>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{course.units.length} units</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{getTotalChapters(course)} chapters</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            <span>Created {formatDate(course.createdAt)}</span>
          </div>

          {/* Progress Bar */}
          {progress.totalChapters > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{progress.completedChapters}/{progress.totalChapters} chapters</span>
              </div>
              <Progress value={progress.completionPercentage} className="h-1.5" />
            </div>
          )}

          {/* Completion Status */}
          {progress.isCompleted && progress.completedAt && (
            <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span>Completed {formatDate(new Date(progress.completedAt))}</span>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Link href={`/dashboard/course/${course.id}/0/0`} className="flex-1">
              <Button className="w-full flex items-center gap-2" size="sm">
                <Eye className="h-4 w-4" />
                {progress.isCompleted ? 'Review Course' : 'Continue Learning'}
              </Button>
            </Link>
            
            {/* Completion Toggle Button */}
            <Button
              variant={progress.isCompleted ? "outline" : "default"}
              size="sm"
              onClick={toggleCompletion}
              disabled={updating}
              className="flex items-center gap-2"
            >
              {updating ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : progress.isCompleted ? (
                <Circle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {progress.isCompleted ? 'Undo' : 'Complete'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MyCourses({ courses }: MyCoursesProps) {
  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          My Courses
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          View and continue your AI-generated courses
        </p>
      </div>

      {courses.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No courses yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start your learning journey by creating your first AI-powered course
            </p>
            <Link href="/dashboard/create/wizard">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Course
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
