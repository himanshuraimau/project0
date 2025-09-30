import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { jsonrepair } from "jsonrepair";
import { prisma } from "../prisma";
import type { Unit, UnitWithChapters, CourseStructure } from "../types/course.types";

// Initialize the AI SDK model
const model = openai("gpt-4o");

interface OutputFormat {
  [key: string]: string | string[] | OutputFormat | OutputFormat[] | Record<string, any>;
}

/**
 * Generate structured output from AI using AI SDK
 * Enhanced to handle new course generation patterns
 */
export async function strict_output(
  system_prompt: string,
  user_prompt: string | string[],
  output_format: OutputFormat,
  default_category: string = "",
  output_value_only: boolean = false,
  temperature: number = 1,
  num_tries: number = 3,
  verbose: boolean = false
) {
  const list_input: boolean = Array.isArray(user_prompt);
  const dynamic_elements: boolean = /<.*?>/.test(JSON.stringify(output_format));
  const list_output: boolean = /\[.*?\]/.test(JSON.stringify(output_format));

  let error_msg: string = "";

  for (let i = 0; i < num_tries; i++) {
    let output_format_prompt: string = `\nYou are to output ${list_output ? "an array of objects in" : ""
      } the following in JSON format: ${JSON.stringify(
        output_format
      )}. \nDo not include markdown code fences (\`\`\`), only raw JSON.`;

    if (list_output) {
      output_format_prompt += `\nIf output field is a list, classify output into the best element of the list.`;
    }

    if (dynamic_elements) {
      output_format_prompt += `\nAny text enclosed by < and > indicates you must generate content to replace it.`;
    }

    if (list_input) {
      output_format_prompt += `\nGenerate an array of JSON, one JSON for each input element.`;
    }

    // Enhanced prompt for course generation patterns
    output_format_prompt += `\nEnsure all generated content is educational, appropriate, and follows logical progression.`;
    output_format_prompt += `\nFor course-related content, maintain consistency in naming and avoid duplicates.`;

    try {
      // Use AI SDK's generateText instead of Gemini's direct API
      const result = await generateText({
        model,
        prompt: system_prompt + output_format_prompt + error_msg + "\n\n" + (Array.isArray(user_prompt) ? user_prompt.join("\n") : user_prompt),
        temperature,
      });

      if (!result.text || result.text.trim().length === 0) {
        throw new Error("AI failed to generate meaningful content");
      }

      let res: string = result.text;

      // 🔹 Strip code fences if model adds them
      res = res.replace(/```json|```/g, "").trim();

      // 🔹 Enhanced cleaning for course generation patterns
      // Handle common course-related text patterns
      res = res.replace(/Course:\s*/gi, '');
      res = res.replace(/Unit:\s*/gi, '');
      res = res.replace(/Chapter:\s*/gi, '');

      // First, protect mathematical expressions like f'(x) by temporarily replacing them
      res = res.replace(/f'(\([^)]*\))/g, 'f_prime$1');
      res = res.replace(/f''(\([^)]*\))/g, 'f_double_prime$1');

      // Handle quotes in educational content more carefully
      // First, protect contractions and possessives
      res = res.replace(/(\w)'(\w)/g, '$1APOSTROPHE$2'); // Protect contractions like "don't"
      res = res.replace(/(\w)'s\b/g, '$1APOSTROPHEs'); // Protect possessives like "HTML's"

      // More robust quote handling - escape quotes inside JSON string values
      // This regex finds string values and escapes internal quotes
      res = res.replace(/:\s*"([^"]*(?:"[^"]*)*[^"]*)"/g, (match, content) => {
        // Count quotes to see if we need to escape internal ones
        const quoteCount = (content.match(/"/g) || []).length;
        if (quoteCount > 0) {
          // Escape internal quotes
          const escapedContent = content.replace(/"/g, '\\"');
          return `: "${escapedContent}"`;
        }
        return match;
      });

      // Convert remaining single quotes to double quotes (but not inside already quoted strings)
      res = res.replace(/'/g, '"');

      // Restore contractions and possessives
      res = res.replace(/(\w)APOSTROPHE(\w)/g, "$1'$2");
      res = res.replace(/(\w)APOSTROPHEs\b/g, "$1's");

      // Restore mathematical expressions
      res = res.replace(/f_prime(\([^)]*\))/g, "f'$1");
      res = res.replace(/f_double_prime(\([^)]*\))/g, "f''$1");

      res = res.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
      res = res.replace(/([{,]\s*)(\w+):/g, '$1"$2":'); // Quote unquoted keys
      res = res.replace(/:\s*([^",{\[\]}\s][^",{\[\]]*?)([,}\]])/g, (match, value, ending) => {
        // Don't quote if it's already quoted, a number, boolean, or null
        if (value.startsWith('"') || /^-?\d+\.?\d*$/.test(value) || /^(true|false|null)$/.test(value)) {
          return `: ${value}${ending}`;
        }
        return `: "${value}"${ending}`;
      });
      res = res.replace(/:\s*"(\d+\.?\d*)"([,}\]])/g, ': $1$2'); // Unquote numbers
      res = res.replace(/:\s*"(true|false|null)"([,}\]])/g, ': $1$2'); // Unquote booleans/null

      // 🔹 Attempt to repair malformed JSON
      try {
        res = jsonrepair(res);
      } catch (repairErr) {
        if (verbose) {
          console.log("jsonrepair failed:", repairErr);
        }
      }

      if (verbose) {
        console.log("System+Output Prompt:", system_prompt + output_format_prompt + error_msg);
        console.log("\nUser prompt:", user_prompt);
        console.log("\nAI SDK raw response:", result.text);
        console.log("\nAI SDK cleaned response:", res);
      }

      let output: unknown;
      try {
        output = JSON.parse(res);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.error("Raw response:", result.text);
        console.error("Cleaned response:", res);
        throw new Error(`Failed to parse AI response as JSON: ${parseError}`);
      }

      let outputArray: unknown[];

      if (list_input) {
        if (!Array.isArray(output)) {
          throw new Error("Output format not in an array of JSON");
        }
        outputArray = output;
      } else {
        outputArray = [output];
      }

      // Enhanced validation for course generation patterns
      for (let index = 0; index < outputArray.length; index++) {
        for (const key in output_format) {
          if (/<.*?>/.test(key)) continue;

          if (!(key in (outputArray[index] as Record<string, unknown>))) {
            throw new Error(`${key} not in json output`);
          }

          if (Array.isArray(output_format[key])) {
            const choices = output_format[key] as string[];
            const currentItem = outputArray[index] as Record<string, unknown>;
            if (Array.isArray(currentItem[key])) {
              currentItem[key] = (currentItem[key] as unknown[])[0];
            }
            if (!choices.includes(currentItem[key] as string) && default_category) {
              currentItem[key] = default_category;
            }
            if (typeof currentItem[key] === "string" && (currentItem[key] as string).includes(":")) {
              currentItem[key] = (currentItem[key] as string).split(":")[0];
            }
          }

          // Additional validation for course-specific fields
          if (typeof (outputArray[index] as Record<string, unknown>)[key] === "string") {
            const value = (outputArray[index] as Record<string, unknown>)[key] as string;
            // Ensure course-related strings are not empty and have reasonable length
            if (key === "name" || key === "unitName" || key === "youtubeSearchQuery") {
              if (!value.trim() || value.trim().length < 2) {
                throw new Error(`${key} must have meaningful content`);
              }
            }
          }
        }

        if (output_value_only) {
          const currentItem = outputArray[index] as Record<string, unknown>;
          const values = Object.values(currentItem);
          outputArray[index] = values.length === 1 ? values[0] : values;
        }
      }

      return list_input ? outputArray : outputArray[0];
    } catch (e) {
      error_msg = `\n\nResult parse failed\nError message: ${e}`;
      console.log("An exception occurred:", e);

      // For course generation, provide more specific error context
      if (i === num_tries - 1) {
        console.error("Failed to generate valid course content after all retries");
      }
    }
  }

  return [];
}

/**
 * Course service class that provides methods for course-related AI operations
 * Similar pattern to the NoteService class
 */
export class CourseService {
  private model = openai("gpt-4o");

  /**
   * Generate course chapters based on a title and description
   */
  async generateCourseChapters(title: string, description: string) {
    try {
      if (!title || !description) {
        throw new Error("Title and description are required");
      }

      const analysisId = Math.random().toString(36).substring(2, 15);
      const timestamp = new Date().toISOString();

      const { generateObject } = await import("ai");
      const { z } = await import("zod");

      const courseOutlineSchema = z.object({
        chapters: z.array(z.object({
          title: z.string().describe("Chapter title"),
          description: z.string().describe("Chapter description (3-5 sentences)"),
          objectives: z.array(z.string()).min(2).max(5).describe("Learning objectives for this chapter")
        }))
      });

      const result = await generateObject({
        model,
        schema: courseOutlineSchema,
        prompt: `You are a course creation expert. Create a detailed course outline.

Analysis ID: ${analysisId}
Timestamp: ${timestamp}

Create a comprehensive course outline for: "${title}"
Course description: "${description}"

Generate chapters with clear titles, descriptions, and learning objectives.`,
      });

      return result.object;

      return result;
    } catch (error) {
      console.error("Error generating course chapters:", error);
      throw new Error("Failed to generate course chapters");
    }
  }

  /**
   * Generate chapter details based on chapter title and description
   */
  async generateChapterDetails(chapterTitle: string, chapterDescription: string) {
    try {
      if (!chapterTitle || !chapterDescription) {
        throw new Error("Chapter title and description are required");
      }

      const analysisId = Math.random().toString(36).substring(2, 15);
      const timestamp = new Date().toISOString();

      const { generateObject } = await import("ai");
      const { z } = await import("zod");

      const chapterDetailsSchema = z.object({
        sections: z.array(z.object({
          title: z.string().describe("Section title"),
          content: z.string().min(300).describe("Detailed section content (at least 300 words)"),
          quiz: z.array(z.object({
            question: z.string().describe("Quiz question"),
            options: z.array(z.string()).length(4).describe("Four answer options"),
            answer: z.string().describe("Correct option")
          }))
        }))
      });

      const result = await generateObject({
        model,
        schema: chapterDetailsSchema,
        prompt: `You are a course content expert. Create detailed content for a course chapter.

Analysis ID: ${analysisId}
Timestamp: ${timestamp}

Create detailed content for the chapter: "${chapterTitle}"
Chapter description: "${chapterDescription}"

Generate comprehensive sections with detailed content and quiz questions.`,
      });

      return result.object;

      return result;
    } catch (error) {
      console.error("Error generating chapter details:", error);
      throw new Error("Failed to generate chapter details");
    }
  }

  /**
   * Generate quiz questions for a specific topic
   */
  async generateQuizQuestions(topic: string, numberOfQuestions: number = 5) {
    try {
      if (!topic) {
        throw new Error("Topic is required");
      }

      const analysisId = Math.random().toString(36).substring(2, 15);
      const timestamp = new Date().toISOString();

      const { generateObject } = await import("ai");
      const { z } = await import("zod");

      const quizSchema = z.object({
        questions: z.array(z.object({
          question: z.string().describe("Quiz question"),
          options: z.array(z.string()).length(4).describe("Four answer options"),
          answer: z.string().describe("Correct option"),
          explanation: z.string().describe("Explanation of why this is the correct answer")
        })).length(numberOfQuestions)
      });

      const result = await generateObject({
        model,
        schema: quizSchema,
        prompt: `You are an educational assessment expert. Create challenging quiz questions.

Analysis ID: ${analysisId}
Timestamp: ${timestamp}

Create ${numberOfQuestions} quiz questions for the topic: "${topic}"
Make sure the questions test understanding rather than just recall.

Generate questions with four options each, the correct answer, and explanations.`,
      });

      return result.object;

      return result;
    } catch (error) {
      console.error("Error generating quiz questions:", error);
      throw new Error("Failed to generate quiz questions");
    }
  }

  /**
   * Generate units from a course title for the AI course flow
   * Requirements: 1.2, 6.1, 6.2
   */
  async generateUnitsFromTitle(title: string): Promise<Unit[]> {
    try {
      if (!title || title.trim().length < 2 || title.trim().length > 100) {
        throw new Error("Course title must be between 2 and 100 characters");
      }

      const analysisId = Math.random().toString(36).substring(2, 15);
      const timestamp = new Date().toISOString();

      // Use AI SDK directly for better control over the response format
      const aiResponse = await generateText({
        model: this.model,
        prompt: `You are an expert course designer. Create exactly 6 course units for: "${title.trim()}"

CRITICAL REQUIREMENTS:
- Return ONLY valid JSON, no markdown or extra text
- Generate exactly 6 units in this exact format:
{
  "units": [
    {"name": "Unit 1 name"},
    {"name": "Unit 2 name"},
    {"name": "Unit 3 name"},
    {"name": "Unit 4 name"},
    {"name": "Unit 5 name"},
    {"name": "Unit 6 name"}
  ]
}

Guidelines:
- Each unit should be a distinct subtopic that builds upon previous units
- Unit names should be descriptive and educational (10-50 characters)
- Progress from basic foundational concepts to advanced topics
- Avoid duplicate or overlapping topics
- Ensure content is appropriate for educational use

Analysis ID: ${analysisId}
Timestamp: ${timestamp}`,
        temperature: 0.7,
      });

      if (!aiResponse.text || aiResponse.text.trim().length === 0) {
        throw new Error("AI failed to generate meaningful content");
      }

      let cleanedResponse = aiResponse.text.trim();

      // Remove markdown code fences if present
      cleanedResponse = cleanedResponse.replace(/```json|```/g, "").trim();

      // Parse the JSON response
      let result: any;
      try {
        result = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error("Failed to parse AI response:", cleanedResponse);
        throw new Error("AI returned invalid JSON format");
      }

      // Debug: Log the actual result structure
      console.log("AI result structure:", JSON.stringify(result, null, 2));

      // Validate result structure
      if (!result || typeof result !== 'object') {
        throw new Error("AI returned invalid result structure");
      }

      const resultObj = result as any;

      // Check if units property exists and is an array
      if (!resultObj.units) {
        throw new Error("AI result missing 'units' property");
      }

      // Handle case where AI returns a single object instead of an array
      if (!Array.isArray(resultObj.units)) {
        if (typeof resultObj.units === 'object' && resultObj.units.name) {
          // Convert single unit object to array
          resultObj.units = [resultObj.units];
        } else {
          throw new Error(`AI result 'units' is not an array, got: ${typeof resultObj.units}`);
        }
      }

      // Transform the result to match our Unit interface
      const units: Unit[] = resultObj.units.map((unit: any, index: number) => {
        if (!unit || typeof unit !== 'object' || !unit.name) {
          throw new Error(`Invalid unit structure at index ${index}: ${JSON.stringify(unit)}`);
        }

        return {
          id: `unit-${index + 1}-${Date.now()}`,
          name: unit.name,
          isEditing: false
        };
      });

      // Validate that we have the right number of units
      if (units.length !== 6) {
        console.warn(`Expected 6 units, got ${units.length}. Attempting fallback generation.`);
        throw new Error("Generated units count is not exactly 6");
      }

      return units;
    } catch (error) {
      console.error("Error generating units from title:", error);

      // If AI generation fails, provide fallback units based on the title
      if (error instanceof Error && (error.message.includes("AI") || error.message.includes("Generated units count"))) {
        console.log("Attempting fallback unit generation...");
        return this.generateFallbackUnits(title);
      }

      throw new Error("Failed to generate course units");
    }
  }

  /**
   * Generate fallback units when AI generation fails
   */
  private generateFallbackUnits(title: string): Unit[] {
    const timestamp = Date.now();
    const baseUnits = [
      "Introduction and Fundamentals",
      "Core Concepts",
      "Practical Applications",
      "Advanced Topics",
      "Real-world Examples",
      "Best Practices and Summary"
    ];

    return baseUnits.map((unitName, index) => ({
      id: `unit-${index + 1}-${timestamp}`,
      name: `${unitName} of ${title}`,
      isEditing: false
    }));
  }

  /**
   * Generate chapters for each unit in the AI course flow
   * Requirements: 3.1, 6.1, 6.2
   */
  async generateChaptersForUnits(title: string, units: Unit[]): Promise<UnitWithChapters[]> {
    try {
      if (!title || !units || units.length === 0) {
        throw new Error("Course title and units are required");
      }

      // Validate units
      for (const unit of units) {
        if (!unit.name || unit.name.trim().length === 0) {
          throw new Error("All units must have valid names");
        }
      }

      const analysisId = Math.random().toString(36).substring(2, 15);
      const timestamp = new Date().toISOString();

      const unitsText = units.map((unit, index) => `${index + 1}. ${unit.name}`).join('\n');

      // Use modern AI SDK with proper schema validation
      const { generateObject } = await import("ai");
      const { z } = await import("zod");

      const chaptersSchema = z.object({
        unitsWithChapters: z.array(z.object({
          unitName: z.string().describe("The name of the unit"),
          chapters: z.array(z.object({
            name: z.string().describe("Chapter title that relates to the unit"),
            youtubeSearchQuery: z.string().describe("Specific search query for finding educational videos about this chapter")
          })).min(3).max(5).describe("3-5 chapters for this unit")
        }))
      });

      const result = await generateObject({
        model,
        schema: chaptersSchema,
        prompt: `You are an expert course designer. Create 3-5 chapters for each course unit.

Guidelines:
- Generate 3-5 chapters per unit that are coherent and build upon each other
- Each chapter should have a descriptive title that relates to its parent unit
- Include a YouTube search query for each chapter to find relevant educational videos
- Ensure chapters within a unit progress logically from basic to advanced concepts
- Avoid duplicate or overlapping topics within the same unit
- Make YouTube search queries specific enough to find relevant educational content

Analysis ID: ${analysisId}
Timestamp: ${timestamp}

Create chapters for each unit in the course: "${title.trim()}"

Units:
${unitsText}

For each unit, generate 3-5 chapters that cover the key topics within that unit.
Each chapter should include a YouTube search query that would help find relevant educational videos.`,
      });

      // Debug: Log the actual result structure
      console.log("AI chapters result structure:", JSON.stringify(result.object, null, 2));

      // The result is already validated by the schema
      const generatedData = result.object;

      const unitsWithChapters: UnitWithChapters[] = units.map((unit, unitIndex) => {
        // Find the corresponding generated data for this unit
        const generatedUnit = generatedData.unitsWithChapters.find(
          (genUnit) => genUnit.unitName.toLowerCase().includes(unit.name.toLowerCase()) ||
            unit.name.toLowerCase().includes(genUnit.unitName.toLowerCase())
        ) || generatedData.unitsWithChapters[unitIndex];

        const chapters = generatedUnit?.chapters?.map((chapter, chapterIndex) => ({
          id: `chapter-${unitIndex + 1}-${chapterIndex + 1}-${Date.now()}`,
          name: chapter.name,
          youtubeSearchQuery: chapter.youtubeSearchQuery,
          isEditing: false
        })) || [];

        // Validate chapter count
        if (chapters.length < 3 || chapters.length > 5) {
          console.warn(`Unit "${unit.name}" has ${chapters.length} chapters, expected 3-5`);
        }

        return {
          ...unit,
          chapters
        };
      });

      return unitsWithChapters;
    } catch (error) {
      console.error("Error generating chapters for units:", error);

      // If AI generation fails, provide fallback chapters
      if (error instanceof Error && error.message.includes("AI")) {
        console.log("Attempting fallback chapter generation...");
        return this.generateFallbackChapters(units);
      }

      throw new Error("Failed to generate course chapters");
    }
  }

  /**
   * Generate fallback chapters when AI generation fails
   */
  private generateFallbackChapters(units: Unit[]): UnitWithChapters[] {
    const timestamp = Date.now();

    return units.map((unit, unitIndex) => {
      const baseChapters = [
        "Introduction",
        "Key Concepts",
        "Practical Examples",
        "Summary and Review"
      ];

      const chapters = baseChapters.map((chapterName, chapterIndex) => ({
        id: `chapter-${unitIndex + 1}-${chapterIndex + 1}-${timestamp}`,
        name: `${chapterName}: ${unit.name}`,
        youtubeSearchQuery: `${unit.name} ${chapterName.toLowerCase()} tutorial`,
        isEditing: false
      }));

      return {
        ...unit,
        chapters
      };
    });
  }

  /**
   * Save the complete course structure to the database
   * Requirements: 5.1, 5.2, 5.3
   */
  async saveCourseStructure(courseData: CourseStructure): Promise<{ courseId: string; chapters: any[] }> {
    try {
      if (!courseData.title || !courseData.userId || !courseData.units || courseData.units.length === 0) {
        throw new Error("Course title, user ID, and units are required");
      }

      // Validate course title length
      if (courseData.title.trim().length < 2 || courseData.title.trim().length > 100) {
        throw new Error("Course title must be between 2 and 100 characters");
      }

      // Validate units and chapters
      for (const unit of courseData.units) {
        if (!unit.name || unit.name.trim().length === 0) {
          throw new Error("All units must have valid names");
        }
        if (!unit.chapters || unit.chapters.length === 0) {
          throw new Error("All units must have at least one chapter");
        }
        for (const chapter of unit.chapters) {
          if (!chapter.name || chapter.name.trim().length === 0) {
            throw new Error("All chapters must have valid names");
          }
          if (!chapter.youtubeSearchQuery || chapter.youtubeSearchQuery.trim().length === 0) {
            throw new Error("All chapters must have YouTube search queries");
          }
        }
      }

      // Use a transaction to ensure data consistency with increased timeout
      const course = await prisma.$transaction(async (tx) => {
        // Create the course
        const newCourse = await tx.course.create({
          data: {
            name: courseData.title.trim(),
            image: "", // Default empty image, can be updated later
            userId: courseData.userId,
          },
        });

        // Prepare all units data for batch creation
        const unitsData = courseData.units.map((unitData) => ({
          name: unitData.name.trim(),
          courseId: newCourse.id,
        }));

        // Create all units at once
        const createdUnits = await Promise.all(
          unitsData.map((unitData) =>
            tx.unit.create({ data: unitData })
          )
        );

        // Prepare all chapters data for batch creation
        const chaptersData: Array<{
          name: string;
          youtubeSearchQuery: string;
          unitId: string;
        }> = [];

        courseData.units.forEach((unitData, unitIndex) => {
          const unitId = createdUnits[unitIndex].id;
          unitData.chapters.forEach((chapterData) => {
            chaptersData.push({
              name: chapterData.name.trim(),
              youtubeSearchQuery: chapterData.youtubeSearchQuery.trim(),
              unitId: unitId,
            });
          });
        });

        // Create all chapters at once and collect their IDs
        const createdChapters = await Promise.all(
          chaptersData.map((chapterData) =>
            tx.chapter.create({ data: chapterData })
          )
        );

        return { course: newCourse, chapters: createdChapters };
      }, {
        timeout: 15000, // Increase timeout to 15 seconds
      });

      return { courseId: course.course.id, chapters: course.chapters };
    } catch (error) {
      console.error("Error saving course structure:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to save course structure");
    }
  }
}

// Export functions for use in API routes
export async function generateCourseChapters(
  title: string,
  description: string
) {
  const courseService = new CourseService();
  return courseService.generateCourseChapters(title, description);
}

export async function generateUnitsFromTitle(title: string): Promise<Unit[]> {
  const courseService = new CourseService();
  return courseService.generateUnitsFromTitle(title);
}

export async function generateChaptersForUnits(title: string, units: Unit[]): Promise<UnitWithChapters[]> {
  const courseService = new CourseService();
  return courseService.generateChaptersForUnits(title, units);
}

export async function saveCourseStructure(courseData: CourseStructure): Promise<{ courseId: string; chapters: any[] }> {
  const courseService = new CourseService();
  return courseService.saveCourseStructure(courseData);
}
