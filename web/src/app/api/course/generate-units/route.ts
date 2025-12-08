import { NextRequest, NextResponse } from "next/server";
import { generateUnitsFromTitle } from "@/lib/course/ai-course-service";
import type { GenerateUnitsRequest, GenerateUnitsResponse } from "@/lib/types/course.types";
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
    let body: GenerateUnitsRequest;
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
      validatedData = ApiValidationSchemas.generateUnits.parse(body);
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

    const { title } = validatedData;

    // Content safety validation
    const safetyCheck = validateContentSafety(title);
    if (!safetyCheck.isSafe) {
      return NextResponse.json(
        { error: `Content validation failed: ${safetyCheck.reason}` },
        { status: 400 }
      );
    }

    // Generate units using AI service
    const units = await generateUnitsFromTitle(title);

    // Validate generated units (Requirements: 1.2)
    if (!units || units.length < 3 || units.length > 5) {
      return NextResponse.json(
        { error: "Failed to generate appropriate number of units (3-5 expected)" },
        { status: 500 }
      );
    }

    // Validate content safety of generated units
    for (const unit of units) {
      const unitSafetyCheck = validateContentSafety(unit.name);
      if (!unitSafetyCheck.isSafe) {
        console.warn(`Generated unit failed safety check: ${unit.name}`);
        // Continue with other units rather than failing completely
      }
    }

    // Return successful response
    const response: GenerateUnitsResponse = {
      units
    };

    return NextResponse.json(response, {
      status: 200
    });

  } catch (error) {
    console.error("Error in generate-units API:", error);

    // Handle specific error types (Requirements: 8.1)
    if (error instanceof Error) {
      if (error.message.includes("title must be between")) {
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