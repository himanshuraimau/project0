"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, BookOpen, Play } from 'lucide-react';
import { Course, Unit, Chapter } from '@prisma/client';
import { useChapterProgress } from '@/hooks/use-chapter-progress';
import { useCourseProgress } from '@/hooks/use-course-progress';
import Link from 'next/link';

type CourseWithDetails = Course & {
  units: (Unit & {
    chapters: Chapter[];
  })[];
};

interface ChapterProgressListProps {
  course: CourseWithDetails;
}

// Individual chapter row component
function ChapterRow({ 
  chapter, 
  courseId, 
  unitIndex, 
  chapterIndex, 
  unitName 
}: {
  chapter: Chapter;
  courseId: string;
  unitIndex: number;
  chapterIndex: number;
  unitName: string;
}) {
  const { progress, updating, toggleCompletion } = useChapterProgress(chapter.id);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
      <Button
        size="sm"
        variant="ghost"
        onClick={toggleCompletion}
        disabled={updating}
        className={`h-8 w-8 p-0 ${
          progress.isCompleted 
            ? "text-green-500 hover:text-green-600" 
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {updating ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : progress.isCompleted ? (
          <CheckCircle className="h-4 w-4" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
      </Button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm truncate">{chapter.name}</h4>
          {progress.isCompleted && (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
              Complete
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{unitName}</p>
      </div>

      <Link href={`/dashboard/course/${courseId}/${unitIndex}/${chapterIndex}`}>
        <Button size="sm" variant="outline" className="h-8">
          <Play className="h-3 w-3 mr-1" />
          View
        </Button>
      </Link>
    </div>
  );
}

export function ChapterProgressList({ course }: ChapterProgressListProps) {
  const { progress: courseProgress, updating: courseUpdating, toggleCompletion: toggleCourseCompletion } = useCourseProgress(course.id);

  // Flatten all chapters with their unit info
  const allChapters = course.units.flatMap((unit, unitIndex) =>
    unit.chapters.map((chapter, chapterIndex) => ({
      chapter,
      unitIndex,
      chapterIndex,
      unitName: unit.name,
    }))
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Chapter Progress
          </CardTitle>
          <Button
            onClick={toggleCourseCompletion}
            disabled={courseUpdating}
            variant={courseProgress.isCompleted ? "outline" : "default"}
            size="sm"
          >
            {courseUpdating ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
            ) : courseProgress.isCompleted ? (
              <Circle className="h-4 w-4 mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            {courseProgress.isCompleted ? 'Reset All' : 'Mark All Complete'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">
              {courseProgress.completedChapters}/{courseProgress.totalChapters} chapters ({Math.round(courseProgress.completionPercentage)}%)
            </span>
          </div>
          <Progress value={courseProgress.completionPercentage} className="h-2" />
        </div>

        {/* Chapter List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Individual Chapters</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {allChapters.map(({ chapter, unitIndex, chapterIndex, unitName }) => (
              <ChapterRow
                key={chapter.id}
                chapter={chapter}
                courseId={course.id}
                unitIndex={unitIndex}
                chapterIndex={chapterIndex}
                unitName={unitName}
              />
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
          <span>{courseProgress.completedChapters} completed</span>
          <span>{courseProgress.totalChapters - courseProgress.completedChapters} remaining</span>
        </div>
      </CardContent>
    </Card>
  );
}