import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateChaptersForUnits } from "@/lib/course/ai-course-service";
import type { GenerateChaptersRequest, GenerateChaptersResponse } from "@/lib/types/course.types";
import { ApiValidationSchemas, validateContentSafety, isValidUserId } from "@/lib/utils/validation";
import { z } from "zod";
import { getUserFromAuth } from "@/lib/auth-helper";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const userId = await getUserFromAuth(request);
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

    // Parse request body
    let body: GenerateChaptersRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate and sanitize request data using Zod schema
    let validatedData;
    try {
      validatedData = ApiValidationSchemas.generateChapters.parse(body);
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

    // Content safety validation for title and units
    const titleSafetyCheck = validateContentSafety(title);
    if (!titleSafetyCheck.isSafe) {
      return NextResponse.json(
        { error: `Title validation failed: ${titleSafetyCheck.reason}` },
        { status: 400 }
      );
    }

    for (let i = 0; i < units.length; i++) {
      const unitSafetyCheck = validateContentSafety(units[i].name);
      if (!unitSafetyCheck.isSafe) {
        return NextResponse.json(
          { error: `Unit ${i + 1} validation failed: ${unitSafetyCheck.reason}` },
          { status: 400 }
        );
      }
    }

    // Generate chapters using AI service (Requirements: 3.1, 3.2, 3.3)
    const unitsWithChapters = await generateChaptersForUnits(title, units);

    // Validate generated chapters (Requirements: 3.2, 3.3)
    if (!unitsWithChapters || unitsWithChapters.length !== units.length) {
      return NextResponse.json(
        { error: "Failed to generate chapters for all units" },
        { status: 500 }
      );
    }

    // Validate each unit has proper chapters with YouTube search queries and content safety
    for (let i = 0; i < unitsWithChapters.length; i++) {
      const unit = unitsWithChapters[i];
      if (!unit.chapters || unit.chapters.length < 3 || unit.chapters.length > 5) {
        console.warn(`Unit "${unit.name}" has ${unit.chapters?.length || 0} chapters, expected 3-5`);
      }

      // Ensure all chapters have YouTube search queries and validate content safety
      for (const chapter of unit.chapters || []) {
        if (!chapter.youtubeSearchQuery || chapter.youtubeSearchQuery.trim().length === 0) {
          return NextResponse.json(
            { error: "All chapters must have YouTube search queries" },
            { status: 500 }
          );
        }

        // Validate content safety of generated chapters
        const chapterSafetyCheck = validateContentSafety(chapter.name);
        if (!chapterSafetyCheck.isSafe) {
          console.warn(`Generated chapter failed safety check: ${chapter.name}`);
          // Continue with other chapters rather than failing completely
        }

        const querySafetyCheck = validateContentSafety(chapter.youtubeSearchQuery);
        if (!querySafetyCheck.isSafe) {
          console.warn(`Generated YouTube query failed safety check: ${chapter.youtubeSearchQuery}`);
          // Continue with other queries rather than failing completely
        }
      }
    }

    // Return successful response
    const response: GenerateChaptersResponse = {
      unitsWithChapters
    };

    return NextResponse.json(response, {
      status: 200
    });

  } catch (error) {
    console.error("Error in generate-chapters API:", error);

    // Handle specific error types (Requirements: 8.1)
    if (error instanceof Error) {
      if (error.message.includes("title must be between") ||
        error.message.includes("units are required") ||
        error.message.includes("must have valid names")) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      if (error.message.includes("Failed to generate")) {
        return NextResponse.json(
          { error: "AI service temporarily unavailable. Please try again." },
          { status: 503 }
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