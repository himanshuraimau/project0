/**
 * Validation utilities for course creation and user inputs
 * Provides both client-side and server-side validation functions
 */

import { z } from 'zod';

// Constants for validation rules
export const VALIDATION_RULES = {
  COURSE_TITLE: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  UNIT_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200,
  },
  CHAPTER_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200,
  },
  YOUTUBE_QUERY: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 500,
  },
  UNITS_COUNT: {
    MIN: 1,
    MAX: 10,
  },
  CHAPTERS_COUNT: {
    MIN: 1,
    MAX: 10,
  },
} as const;

// Input sanitization functions
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  return input
    .trim()
    // Remove null bytes and control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove potential XSS patterns (basic protection)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

export function sanitizeHtml(input: string): string {
  // Basic HTML sanitization - remove all HTML tags
  return sanitizeString(input).replace(/<[^>]*>/g, '');
}

// Validation schemas using Zod
export const CourseValidationSchemas = {
  title: z.string()
    .min(VALIDATION_RULES.COURSE_TITLE.MIN_LENGTH, 
         `Course title must be at least ${VALIDATION_RULES.COURSE_TITLE.MIN_LENGTH} characters`)
    .max(VALIDATION_RULES.COURSE_TITLE.MAX_LENGTH, 
         `Course title must be no more than ${VALIDATION_RULES.COURSE_TITLE.MAX_LENGTH} characters`)
    .transform(sanitizeString),

  unitName: z.string()
    .min(VALIDATION_RULES.UNIT_NAME.MIN_LENGTH, 'Unit name cannot be empty')
    .max(VALIDATION_RULES.UNIT_NAME.MAX_LENGTH, 
         `Unit name must be no more than ${VALIDATION_RULES.UNIT_NAME.MAX_LENGTH} characters`)
    .transform(sanitizeString),

  chapterName: z.string()
    .min(VALIDATION_RULES.CHAPTER_NAME.MIN_LENGTH, 'Chapter name cannot be empty')
    .max(VALIDATION_RULES.CHAPTER_NAME.MAX_LENGTH, 
         `Chapter name must be no more than ${VALIDATION_RULES.CHAPTER_NAME.MAX_LENGTH} characters`)
    .transform(sanitizeString),

  youtubeQuery: z.string()
    .min(VALIDATION_RULES.YOUTUBE_QUERY.MIN_LENGTH, 'YouTube search query cannot be empty')
    .max(VALIDATION_RULES.YOUTUBE_QUERY.MAX_LENGTH, 
         `YouTube search query must be no more than ${VALIDATION_RULES.YOUTUBE_QUERY.MAX_LENGTH} characters`)
    .transform(sanitizeString),

  unit: z.object({
    id: z.string().min(1, 'Unit ID is required'),
    name: z.string()
      .min(VALIDATION_RULES.UNIT_NAME.MIN_LENGTH, 'Unit name cannot be empty')
      .max(VALIDATION_RULES.UNIT_NAME.MAX_LENGTH, 
           `Unit name must be no more than ${VALIDATION_RULES.UNIT_NAME.MAX_LENGTH} characters`)
      .transform(sanitizeString),
  }),

  chapter: z.object({
    id: z.string().min(1, 'Chapter ID is required'),
    name: z.string()
      .min(VALIDATION_RULES.CHAPTER_NAME.MIN_LENGTH, 'Chapter name cannot be empty')
      .max(VALIDATION_RULES.CHAPTER_NAME.MAX_LENGTH, 
           `Chapter name must be no more than ${VALIDATION_RULES.CHAPTER_NAME.MAX_LENGTH} characters`)
      .transform(sanitizeString),
    youtubeSearchQuery: z.string()
      .min(VALIDATION_RULES.YOUTUBE_QUERY.MIN_LENGTH, 'YouTube search query cannot be empty')
      .max(VALIDATION_RULES.YOUTUBE_QUERY.MAX_LENGTH, 
           `YouTube search query must be no more than ${VALIDATION_RULES.YOUTUBE_QUERY.MAX_LENGTH} characters`)
      .transform(sanitizeString),
  }),

  unitWithChapters: z.object({
    id: z.string().min(1, 'Unit ID is required'),
    name: z.string()
      .min(VALIDATION_RULES.UNIT_NAME.MIN_LENGTH, 'Unit name cannot be empty')
      .max(VALIDATION_RULES.UNIT_NAME.MAX_LENGTH, 
           `Unit name must be no more than ${VALIDATION_RULES.UNIT_NAME.MAX_LENGTH} characters`)
      .transform(sanitizeString),
    chapters: z.array(z.object({
      id: z.string().min(1, 'Chapter ID is required'),
      name: z.string()
        .min(VALIDATION_RULES.CHAPTER_NAME.MIN_LENGTH, 'Chapter name cannot be empty')
        .max(VALIDATION_RULES.CHAPTER_NAME.MAX_LENGTH, 
             `Chapter name must be no more than ${VALIDATION_RULES.CHAPTER_NAME.MAX_LENGTH} characters`)
        .transform(sanitizeString),
      youtubeSearchQuery: z.string()
        .min(VALIDATION_RULES.YOUTUBE_QUERY.MIN_LENGTH, 'YouTube search query cannot be empty')
        .max(VALIDATION_RULES.YOUTUBE_QUERY.MAX_LENGTH, 
             `YouTube search query must be no more than ${VALIDATION_RULES.YOUTUBE_QUERY.MAX_LENGTH} characters`)
        .transform(sanitizeString),
    }))
    .min(VALIDATION_RULES.CHAPTERS_COUNT.MIN, 'Each unit must have at least one chapter')
    .max(VALIDATION_RULES.CHAPTERS_COUNT.MAX, 
         `Each unit can have at most ${VALIDATION_RULES.CHAPTERS_COUNT.MAX} chapters`),
  }),
};

// API request validation schemas
export const ApiValidationSchemas = {
  generateUnits: z.object({
    title: CourseValidationSchemas.title,
  }),

  generateChapters: z.object({
    title: CourseValidationSchemas.title,
    units: z.array(CourseValidationSchemas.unit)
      .min(VALIDATION_RULES.UNITS_COUNT.MIN, 'At least one unit is required')
      .max(VALIDATION_RULES.UNITS_COUNT.MAX, 
           `At most ${VALIDATION_RULES.UNITS_COUNT.MAX} units are allowed`),
  }),

  createCourse: z.object({
    title: CourseValidationSchemas.title,
    units: z.array(CourseValidationSchemas.unitWithChapters)
      .min(VALIDATION_RULES.UNITS_COUNT.MIN, 'At least one unit is required')
      .max(VALIDATION_RULES.UNITS_COUNT.MAX, 
           `At most ${VALIDATION_RULES.UNITS_COUNT.MAX} units are allowed`),
  }),
};

// Validation helper functions
export function validateCourseTitle(title: string): { isValid: boolean; error?: string } {
  try {
    CourseValidationSchemas.title.parse(title);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.issues[0]?.message || 'Invalid course title' };
    }
    return { isValid: false, error: 'Invalid course title' };
  }
}

export function validateUnitName(name: string): { isValid: boolean; error?: string } {
  try {
    CourseValidationSchemas.unitName.parse(name);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.issues[0]?.message || 'Invalid unit name' };
    }
    return { isValid: false, error: 'Invalid unit name' };
  }
}

export function validateChapterName(name: string): { isValid: boolean; error?: string } {
  try {
    CourseValidationSchemas.chapterName.parse(name);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.issues[0]?.message || 'Invalid chapter name' };
    }
    return { isValid: false, error: 'Invalid chapter name' };
  }
}

// Security validation functions
export function isValidUserId(userId: string): boolean {
  // Basic validation for user ID format (Better Auth / DB ids)
  return typeof userId === 'string' && 
         userId.length > 0 && 
         userId.length < 100 && 
         /^[a-zA-Z0-9_-]+$/.test(userId);
}

export function isValidId(id: string): boolean {
  // Basic validation for generated IDs
  return typeof id === 'string' && 
         id.length > 0 && 
         id.length < 100 && 
         /^[a-zA-Z0-9_-]+$/.test(id);
}

// Content safety validation
export function containsInappropriateContent(text: string): boolean {
  const inappropriatePatterns = [
    // Basic patterns for inappropriate content
    /\b(fuck|shit|damn|hell|ass|bitch)\b/gi,
    // Potential spam patterns
    /\b(buy now|click here|free money|get rich quick)\b/gi,
    // Potential malicious patterns
    /\b(hack|crack|exploit|malware|virus)\b/gi,
  ];

  return inappropriatePatterns.some(pattern => pattern.test(text));
}

export function validateContentSafety(text: string): { isSafe: boolean; reason?: string } {
  if (containsInappropriateContent(text)) {
    return { isSafe: false, reason: 'Content contains inappropriate language or patterns' };
  }
  
  // Check for excessive special characters (potential injection attempts)
  const specialCharCount = (text.match(/[<>{}[\]\\\/\|`~!@#$%^&*()+=]/g) || []).length;
  const specialCharRatio = specialCharCount / text.length;
  
  if (specialCharRatio > 0.3) {
    return { isSafe: false, reason: 'Content contains excessive special characters' };
  }
  
  return { isSafe: true };
}