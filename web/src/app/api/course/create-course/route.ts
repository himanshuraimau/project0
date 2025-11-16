import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { saveCourseStructure } from "@/lib/course/ai-course-service";
import type { CreateCourseRequest, CreateCourseResponse } from "@/lib/types/course.types";
import { ApiValidationSchemas, validateContentSafety, isValidUserId } from "@/lib/utils/validation";
import { FeatureGateService } from "@/lib/feature-gate-service";
import { z } from "zod";
import { 
  createSuccessResponse, 
  handleApiError,
  CourseValidation
} from "@/lib/utils/api-error-handler";
import { 
  AppErrorType, 
  createAppError 
} from "@/lib/utils/enhanced-error-handler";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const userId = await getUserFromAuth(request);
    if (!userId) {
      throw createAppError(AppErrorType.AUTHENTICATION_FAILED);
    }

    // Validate user ID format for security
    if (!isValidUserId(userId)) {
      throw createAppError(AppErrorType.INVALID_SESSION);
    }

    // Parse request body
    let body: CreateCourseRequest;
    try {
      body = await request.json();
    } catch {
      throw createAppError(AppErrorType.INVALID_INPUT, {}, "Invalid JSON in request body");
    }

    // Validate and sanitize request data using Zod schema
    let validatedData;
    try {
      validatedData = ApiValidationSchemas.createCourse.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const fieldErrors = validationError.issues.map(e => e.message).join(', ');
        throw createAppError(
          AppErrorType.INVALID_INPUT,
          { zodErrors: validationError.issues },
          `Validation failed: ${fieldErrors}`
        );
      }
      throw createAppError(AppErrorType.INVALID_INPUT, {}, "Invalid request data");
    }

    const { title, units } = validatedData;

    // Validate course title
    CourseValidation.title(title);

    // Validate units structure
    const unitNames = units.map(unit => unit.name);
    CourseValidation.units(unitNames);

    // Check subscription access
    const accessCheck = await FeatureGateService.checkAccessForAPI();
    if (!accessCheck.allowed) {
      throw createAppError(
        AppErrorType.INSUFFICIENT_CREDITS,
        {},
        accessCheck.message || 'Active subscription required for course generation'
      );
    }

    // Content safety validation for title
    const titleSafetyCheck = validateContentSafety(title);
    if (!titleSafetyCheck.isSafe) {
      throw createAppError(
        AppErrorType.COURSE_TITLE_INVALID,
        { reason: titleSafetyCheck.reason },
        `Course title contains inappropriate content: ${titleSafetyCheck.reason}`
      );
    }

    // Content safety validation for all units and chapters
    for (let i = 0; i < units.length; i++) {
      const unit = units[i];

      // Validate unit name content safety
      const unitSafetyCheck = validateContentSafety(unit.name);
      if (!unitSafetyCheck.isSafe) {
        throw createAppError(
          AppErrorType.UNITS_INVALID,
          { unitIndex: i, reason: unitSafetyCheck.reason },
          `Unit "${unit.name}" contains inappropriate content: ${unitSafetyCheck.reason}`
        );
      }

      // Validate each chapter's content safety
      for (let j = 0; j < unit.chapters.length; j++) {
        const chapter = unit.chapters[j];

        const chapterSafetyCheck = validateContentSafety(chapter.name);
        if (!chapterSafetyCheck.isSafe) {
          throw createAppError(
            AppErrorType.UNITS_INVALID,
            { unitIndex: i, chapterIndex: j, reason: chapterSafetyCheck.reason },
            `Chapter "${chapter.name}" contains inappropriate content: ${chapterSafetyCheck.reason}`
          );
        }

        const querySafetyCheck = validateContentSafety(chapter.youtubeSearchQuery);
        if (!querySafetyCheck.isSafe) {
          throw createAppError(
            AppErrorType.UNITS_INVALID,
            { unitIndex: i, chapterIndex: j, reason: querySafetyCheck.reason },
            `YouTube search query contains inappropriate content: ${querySafetyCheck.reason}`
          );
        }
      }
    }

    // Create course structure object
    const courseStructure = {
      title,
      userId,
      units
    };

    // Save course structure using AI service
    let courseResult: { courseId: string; chapters: any[] };
    try {
      courseResult = await saveCourseStructure(courseStructure);
    } catch (error) {
      throw createAppError(
        AppErrorType.COURSE_SAVE_FAILED,
        { originalError: error instanceof Error ? error.message : String(error) },
        "Failed to save course structure to database"
      );
    }

    // Validate that course was created successfully
    if (!courseResult.courseId || typeof courseResult.courseId !== "string") {
      throw createAppError(
        AppErrorType.COURSE_SAVE_FAILED,
        { courseId: courseResult.courseId },
        "Invalid course ID returned from database"
      );
    }

    const courseId = courseResult.courseId;

    // No credit deduction needed - subscription system handles access
    // Course created successfully

    // Return successful response with chapter information
    const response: CreateCourseResponse = {
      courseId,
      chapters: courseResult.chapters
    };

    return createSuccessResponse(response);

  } catch (error) {
    return handleApiError(error, { 
      endpoint: 'create-course',
      userId: request.headers.get('x-user-id') || 'unknown'
    });
  }
}