"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Eye, Plus, Clock, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Course, Unit, Chapter } from "@prisma/client";

type CourseWithDetails = Course & {
  units: (Unit & {
    chapters: Chapter[];
  })[];
};

interface MyCoursesProps {
  courses: CourseWithDetails[];
}

export function MyCourses({ courses }: MyCoursesProps) {
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
            <Card 
              key={course.id} 
              className="group hover:shadow-lg transition-all duration-300 border hover:border-primary/50"
            >
              <CardHeader className="p-0">
                <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                  {course.image ? (
                    <Image
                      src={course.image}
                      alt={course.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-primary/60" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
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

                  <div className="flex gap-2 mt-4">
                    <Link href={`/dashboard/course/${course.id}/0/0`} className="flex-1">
                      <Button className="w-full flex items-center gap-2" size="sm">
                        <Eye className="h-4 w-4" />
                        Continue Learning
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
