import { NextRequest, NextResponse } from "next/server";
import { generateChaptersForUnits } from "@/lib/course/ai-course-service";
import type { GenerateChaptersRequest, GenerateChaptersResponse } from "@/lib/types/course.types";
import { ApiValidationSchemas, validateContentSafety, isValidUserId } from "@/lib/utils/validation";
import { z } from "zod";
import { getUserFromAuth } from "@/lib/auth-helper";

/**
 * Batch chapter generation endpoint - processes chapters in smaller batches for better UX
 * This endpoint generates chapters for a specific batch of units rather than all units at once
 */
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
    let body: GenerateChaptersRequest & { batchIndex?: number };
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
    const batchIndex = body.batchIndex ?? 0;

    // Validate batch size (should be reasonable to prevent overload)
    if (units.length > 5) {
      return NextResponse.json(
        { error: "Batch size too large. Maximum 5 units per batch." },
        { status: 400 }
      );
    }

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

    // Generate chapters for this batch using AI service
    console.log(`Processing batch ${batchIndex} with ${units.length} units`);
    const unitsWithChapters = await generateChaptersForUnits(title, units);

    // Validate generated chapters
    if (!unitsWithChapters || unitsWithChapters.length !== units.length) {
      return NextResponse.json(
        { error: "Failed to generate chapters for all units in batch" },
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

    // Return successful response with batch information
    const response: GenerateChaptersResponse & { batchIndex: number; batchSize: number } = {
      unitsWithChapters,
      batchIndex,
      batchSize: units.length
    };

    console.log(`Successfully processed batch ${batchIndex} with ${unitsWithChapters.length} units`);

    return NextResponse.json(response, {
      status: 200
    });

  } catch (error) {
    console.error("Error in generate-chapters-batch API:", error);

    // Handle specific error types
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