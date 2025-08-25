"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Zap, RotateCcw } from 'lucide-react';
import { Course, Unit, Chapter } from '@prisma/client';
import { useCourseProgress } from '@/hooks/use-course-progress';

type CourseWithDetails = Course & {
  units: (Unit & {
    chapters: Chapter[];
  })[];
};

interface CourseQuickActionsProps {
  course: CourseWithDetails;
}

export function CourseQuickActions({ course }: CourseQuickActionsProps) {
  const { progress, updating, toggleCompletion } = useCourseProgress(course.id);

  const handleMarkAllComplete = async () => {
    await toggleCompletion();
  };

  const handleResetProgress = async () => {
    if (progress.isCompleted) {
      await toggleCompletion();
    }
  };

  return (
    <Card className="border-dashed border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2">
          {!progress.isCompleted ? (
            <Button
              onClick={handleMarkAllComplete}
              disabled={updating}
              className="w-full flex items-center gap-2"
              size="sm"
            >
              {updating ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Mark All Chapters Complete
            </Button>
          ) : (
            <Button
              onClick={handleResetProgress}
              disabled={updating}
              variant="outline"
              className="w-full flex items-center gap-2"
              size="sm"
            >
              {updating ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              Reset All Progress
            </Button>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground text-center">
          {progress.isCompleted 
            ? "All chapters are marked as complete. You can reset progress or complete chapters individually."
            : "Complete all chapters at once, or mark them individually using the checkboxes."
          }
        </div>
      </CardContent>
    </Card>
  );
}