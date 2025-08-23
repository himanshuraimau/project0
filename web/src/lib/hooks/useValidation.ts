/**
 * Client-side validation hooks for course creation forms
 * Provides real-time validation with sanitization and security checks
 */

import { useState, useCallback } from 'react';
import { validateCourseTitle, validateUnitName, validateChapterName, validateContentSafety } from '@/lib/utils/validation';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: string;
}

export function useTitleValidation() {
  const [error, setError] = useState<string>('');

  const validateTitle = useCallback((title: string): ValidationResult => {
    // Clear previous error
    setError('');

    // Basic validation
    const validation = validateCourseTitle(title);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid title');
      return { isValid: false, error: validation.error };
    }

    // Content safety check
    const safetyCheck = validateContentSafety(title);
    if (!safetyCheck.isSafe) {
      const errorMsg = `Content not allowed: ${safetyCheck.reason}`;
      setError(errorMsg);
      return { isValid: false, error: errorMsg };
    }

    return { isValid: true, sanitizedValue: title.trim() };
  }, []);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  return {
    error,
    validateTitle,
    clearError,
    hasError: !!error
  };
}

export function useUnitValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateUnit = useCallback((unitId: string, unitName: string): ValidationResult => {
    // Clear previous error for this unit
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[unitId];
      return newErrors;
    });

    // Basic validation
    const validation = validateUnitName(unitName);
    if (!validation.isValid) {
      const errorMsg = validation.error || 'Invalid unit name';
      setErrors(prev => ({ ...prev, [unitId]: errorMsg }));
      return { isValid: false, error: errorMsg };
    }

    // Content safety check
    const safetyCheck = validateContentSafety(unitName);
    if (!safetyCheck.isSafe) {
      const errorMsg = `Content not allowed: ${safetyCheck.reason}`;
      setErrors(prev => ({ ...prev, [unitId]: errorMsg }));
      return { isValid: false, error: errorMsg };
    }

    return { isValid: true, sanitizedValue: unitName.trim() };
  }, []);

  const clearError = useCallback((unitId: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[unitId];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    validateUnit,
    clearError,
    clearAllErrors,
    hasErrors: Object.keys(errors).length > 0,
    getError: (unitId: string) => errors[unitId]
  };
}

export function useChapterValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateChapter = useCallback((chapterId: string, chapterName: string): ValidationResult => {
    // Clear previous error for this chapter
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[chapterId];
      return newErrors;
    });

    // Basic validation
    const validation = validateChapterName(chapterName);
    if (!validation.isValid) {
      const errorMsg = validation.error || 'Invalid chapter name';
      setErrors(prev => ({ ...prev, [chapterId]: errorMsg }));
      return { isValid: false, error: errorMsg };
    }

    // Content safety check
    const safetyCheck = validateContentSafety(chapterName);
    if (!safetyCheck.isSafe) {
      const errorMsg = `Content not allowed: ${safetyCheck.reason}`;
      setErrors(prev => ({ ...prev, [chapterId]: errorMsg }));
      return { isValid: false, error: errorMsg };
    }

    return { isValid: true, sanitizedValue: chapterName.trim() };
  }, []);

  const clearError = useCallback((chapterId: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[chapterId];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    validateChapter,
    clearError,
    clearAllErrors,
    hasErrors: Object.keys(errors).length > 0,
    getError: (chapterId: string) => errors[chapterId]
  };
}

// Combined validation hook for forms with multiple validation types
export function useCourseFormValidation() {
  const titleValidation = useTitleValidation();
  const unitValidation = useUnitValidation();
  const chapterValidation = useChapterValidation();

  const clearAllErrors = useCallback(() => {
    titleValidation.clearError();
    unitValidation.clearAllErrors();
    chapterValidation.clearAllErrors();
  }, [titleValidation, unitValidation, chapterValidation]);

  const hasAnyErrors = titleValidation.hasError || 
                      unitValidation.hasErrors || 
                      chapterValidation.hasErrors;

  return {
    title: titleValidation,
    units: unitValidation,
    chapters: chapterValidation,
    clearAllErrors,
    hasAnyErrors
  };
}