"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TitleInputStepProps } from "@/lib/types/course.types";
import { LoadingState, InlineLoading } from "@/components/ui/loading-spinner";
import {
  validateCourseTitle,
  sanitizeString,
  validateContentSafety,
} from "@/lib/utils/validation";

/**
 * TitleInputStep component handles course title input and initial unit generation trigger
 * Validates title length and provides clear feedback to users
 */
export function TitleInputStep({
  title,
  onTitleChange,
  onGenerateUnits,
  isLoading,
}: TitleInputStepProps) {
  const [error, setError] = useState<string>("");

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const newTitle = e.target.value;

  onTitleChange(newTitle);

  // Clear error when user starts typing
  if (error) {
    setError("");
  }
};

  const handleGenerateUnits = () => {
    // Enhanced validation using validation utilities
    const titleValidation = validateCourseTitle(title);
    if (!titleValidation.isValid) {
      setError(titleValidation.error || "Invalid course title");
      return;
    }

    // Content safety validation
    const safetyCheck = validateContentSafety(title);
    if (!safetyCheck.isSafe) {
      setError(`Content validation failed: ${safetyCheck.reason}`);
      return;
    }

    setError("");
    onGenerateUnits();
  };

  const isValidTitle = title.trim().length >= 2 && title.trim().length <= 100;

  // Show loading state instead of the form when generating
  if (isLoading) {
    return (
      <div className="h-fit">
        <LoadingState
          message="Generating Course Units"
          submessage="AI is analyzing your course title and creating relevant units..."
          variant="ai"
          className="!bg-transparent"
        />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Create Your Course
        </h2>
        <p className="text-muted-foreground">
          Start by entering a course title. Our AI will generate a complete
          course structure for you.
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <div className="space-y-2">
          <Label htmlFor="course-title" className="text-sm font-medium">
            Course Title
          </Label>
          <Input
            id="course-title"
            type="text"
            placeholder="e.g., Introduction to Machine Learning"
            value={title}
            onChange={handleTitleChange}
            className={`w-full ${
              error ? "border-destructive" : ""
            }`}
            disabled={isLoading}
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>2-100 characters</span>
            <span className={title.length > 100 ? "text-destructive" : ""}>
              {title.length}/100
            </span>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <Button
          onClick={handleGenerateUnits}
          disabled={!isValidTitle || isLoading}
          className="w-full cursor-pointer bg-accent hover:bg-accent/60 text-black dark:text-white"
          size="lg"
        >
          {isLoading ? (
            <InlineLoading
              message="Generating Units..."
              variant="ai"
              className="text-white dark:text-black"
            />
          ) : (
            "Generate Units with AI"
          )}
        </Button>
      </div>

      {title && (
        <div className="mt-8 !rounded-2xl !bg-transparent">
          <p className="text-black dark:text-white">
            Course: <span className="font-medium">{title}</span>
          </p>
          <p className="text-sm text-black/80 dark:text-white/80">
            AI will generate 5-7 relevant units for this course topic.
          </p>
        </div>
      )}
    </div>
  );
}
