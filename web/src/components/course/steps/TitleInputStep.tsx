'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TitleInputStepProps } from '@/lib/types/course.types';
import { LoadingState, InlineLoading } from '@/components/ui/loading-spinner';
import { validateCourseTitle, sanitizeString, validateContentSafety } from '@/lib/utils/validation';

/**
 * TitleInputStep component handles course title input and initial unit generation trigger
 * Validates title length and provides clear feedback to users
 */
export function TitleInputStep({ 
  title, 
  onTitleChange, 
  onGenerateUnits, 
  isLoading 
}: TitleInputStepProps) {
  const [error, setError] = useState<string>('');

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newTitle = e.target.value;
    
    // Basic input sanitization to prevent XSS
    try {
      newTitle = sanitizeString(newTitle);
    } catch (sanitizeError) {
      // If sanitization fails, use the original value but show warning
      console.warn('Title sanitization failed:', sanitizeError);
    }
    
    onTitleChange(newTitle);
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleGenerateUnits = () => {
    // Enhanced validation using validation utilities
    const titleValidation = validateCourseTitle(title);
    if (!titleValidation.isValid) {
      setError(titleValidation.error || 'Invalid course title');
      return;
    }

    // Content safety validation
    const safetyCheck = validateContentSafety(title);
    if (!safetyCheck.isSafe) {
      setError(`Content validation failed: ${safetyCheck.reason}`);
      return;
    }
    
    setError('');
    onGenerateUnits();
  };

  const isValidTitle = title.trim().length >= 2 && title.trim().length <= 100;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Create Your Course
        </h2>
        <p className="text-gray-600">
          Start by entering a course title. Our AI will generate a complete course structure for you.
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
            className={`w-full ${error ? 'border-red-500' : ''}`}
            disabled={isLoading}
          />
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>2-100 characters</span>
            <span className={title.length > 100 ? 'text-red-500' : ''}>
              {title.length}/100
            </span>
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <Button
          onClick={handleGenerateUnits}
          disabled={!isValidTitle || isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <InlineLoading 
              message="Generating Units..." 
              variant="ai"
              className="text-white"
            />
          ) : (
            'Generate Units with AI'
          )}
        </Button>
      </div>

      {isLoading && (
        <div className="mt-8">
          <LoadingState
            message="Generating Course Units"
            submessage="AI is analyzing your course title and creating relevant units..."
            variant="ai"
            className="bg-purple-50 border border-purple-200 rounded-lg"
          />
        </div>
      )}

      {title && !isLoading && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">Preview</h3>
          <p className="text-blue-800">
            Course: <span className="font-medium">{title}</span>
          </p>
          <p className="text-sm text-blue-600 mt-1">
            AI will generate 5-7 relevant units for this course topic.
          </p>
        </div>
      )}
    </div>
  );
}