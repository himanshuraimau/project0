import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { saveCourseStructure } from "@/lib/course/ai-course-service";
import type { CreateCourseRequest, CreateCourseResponse } from "@/lib/types/course.types";
import { ApiValidationSchemas, validateContentSafety, isValidUserId } from "@/lib/utils/validation";
import { rateLimiters } from "@/lib/utils/rate-limit";
import { UserService } from "@/lib/user-service";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    // Check authentication (Requirements: 5.2)
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate user ID format for security
    if (!isValidUserId(userId)) {
      return NextResponse.json(
        { error: "Invalid user session" },
        { status: 401 }
      );
    }

    // Apply rate limiting
    const rateLimitResult = rateLimiters.courseCreation(userId, 'create-course');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please try again later.",
          retryAfter: rateLimitResult.retryAfter
        },
        {
          status: 429,
          headers: rateLimitResult.headers
        }
      );
    }

    // Parse request body
    let body: CreateCourseRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate and sanitize request data using Zod schema
    let validatedData;
    try {
      validatedData = ApiValidationSchemas.createCourse.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: validationError.issues.map(e => e.message).join(', ')
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const { title, units } = validatedData;

    // Check if user has enough credits (2 credits for course generation)
    const hasEnoughCredits = await UserService.hasEnoughCredits(userId, 2);
    if (!hasEnoughCredits) {
      return NextResponse.json(
        { error: "Insufficient credits. You need 2 credits to generate a full course." },
        { status: 402 }
      );
    }

    // Content safety validation for title
    const titleSafetyCheck = validateContentSafety(title);
    if (!titleSafetyCheck.isSafe) {
      return NextResponse.json(
        { error: `Title validation failed: ${titleSafetyCheck.reason}` },
        { status: 400 }
      );
    }

    // Content safety validation for all units and chapters
    for (let i = 0; i < units.length; i++) {
      const unit = units[i];

      // Validate unit name content safety
      const unitSafetyCheck = validateContentSafety(unit.name);
      if (!unitSafetyCheck.isSafe) {
        return NextResponse.json(
          { error: `Unit ${i + 1} validation failed: ${unitSafetyCheck.reason}` },
          { status: 400 }
        );
      }

      // Validate each chapter's content safety
      for (let j = 0; j < unit.chapters.length; j++) {
        const chapter = unit.chapters[j];

        const chapterSafetyCheck = validateContentSafety(chapter.name);
        if (!chapterSafetyCheck.isSafe) {
          return NextResponse.json(
            { error: `Unit ${i + 1}, Chapter ${j + 1} name validation failed: ${chapterSafetyCheck.reason}` },
            { status: 400 }
          );
        }

        const querySafetyCheck = validateContentSafety(chapter.youtubeSearchQuery);
        if (!querySafetyCheck.isSafe) {
          return NextResponse.json(
            { error: `Unit ${i + 1}, Chapter ${j + 1} YouTube query validation failed: ${querySafetyCheck.reason}` },
            { status: 400 }
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

    // Save course structure using AI service (Requirements: 5.1, 5.2, 5.3)
    const courseId = await saveCourseStructure(courseStructure);

    // Validate that course was created successfully
    if (!courseId || typeof courseId !== "string") {
      return NextResponse.json(
        { error: "Failed to create course - invalid course ID returned" },
        { status: 500 }
      );
    }

    // Deduct 2 credits for course generation
    await UserService.deductCredits('course_generation', 2, courseId);

    // Return successful response with rate limit headers (Requirements: 5.4)
    const response: CreateCourseResponse = {
      courseId
    };

    return NextResponse.json(response, {
      status: 201,
      headers: rateLimitResult.headers
    });

  } catch (error) {
    console.error("Error in create-course API:", error);

    // Handle specific error types (Requirements: 5.3)
    if (error instanceof Error) {
      // Handle validation errors
      if (error.message.includes("title must be between") ||
        error.message.includes("units are required") ||
        error.message.includes("must have valid") ||
        error.message.includes("cannot be empty")) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      // Handle database/save errors
      if (error.message.includes("Failed to save") ||
        error.message.includes("database") ||
        error.message.includes("transaction")) {
        return NextResponse.json(
          { error: "Failed to save course. Please try again." },
          { status: 500 }
        );
      }

      // Handle authentication errors
      if (error.message.includes("Unauthorized") ||
        error.message.includes("authentication")) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}