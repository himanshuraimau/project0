"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Trophy, Calendar, BookOpen } from 'lucide-react';
import { useCourseProgress } from '@/hooks/use-course-progress';

interface CourseCompletionCardProps {
  courseId: string;
  courseName: string;
}

export function CourseCompletionCard({ courseId, courseName }: CourseCompletionCardProps) {
  const { progress, updating, toggleCompletion } = useCourseProgress(courseId);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Course Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {progress.completedChapters}/{progress.totalChapters} chapters ({Math.round(progress.completionPercentage)}%)
            </span>
          </div>
          <Progress value={progress.completionPercentage} className="h-2" />
        </div>

        {/* Chapter Progress Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{progress.completedChapters} completed</span>
          </div>
          <div className="flex items-center gap-1">
            <Circle className="h-4 w-4" />
            <span>{progress.totalChapters - progress.completedChapters} remaining</span>
          </div>
        </div>

        {progress.isCompleted ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500 hover:bg-green-600 text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Course Completed!
              </Badge>
            </div>
            
            {progress.completedAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Completed on {formatDate(progress.completedAt)}</span>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground">
              Congratulations! You've completed all chapters in "{courseName}". You can review the content anytime or reset your progress if needed.
            </p>
            
            <Button
              variant="outline"
              onClick={toggleCompletion}
              disabled={updating}
              className="w-full flex items-center gap-2"
            >
              {updating ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
              Reset All Progress
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {progress.completionPercentage > 0 
                ? `You're ${Math.round(progress.completionPercentage)}% through this course! Complete individual chapters to track your progress, or mark the entire course as complete.`
                : "Start completing chapters to track your progress, or mark the entire course as complete if you've finished it elsewhere."
              }
            </p>
            
            <div className="space-y-2">
              <Button
                onClick={toggleCompletion}
                disabled={updating}
                className="w-full flex items-center gap-2"
              >
                {updating ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Mark All as Complete
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Or complete chapters individually using the sidebar or chapter list
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}